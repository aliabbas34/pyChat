"""Chat business rules. Views and the WebSocket consumer call these."""

from django.db.models import Count, F, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from django.utils import timezone

from config.exceptions import DomainError
from friends.services import are_friends, friends_of

from .models import Message

HISTORY_PAGE_SIZE = 30


class ChatError(DomainError):
    pass


def _ensure_friends(me, other):
    if not are_friends(me, other):
        raise ChatError("You can only chat with friends.")


def send_message(sender, recipient, content):
    content = content.strip()
    if not content:
        raise ChatError("Message cannot be empty.")
    if len(content) > Message.MAX_LENGTH:
        raise ChatError(f"Message cannot exceed {Message.MAX_LENGTH} characters.")
    _ensure_friends(sender, recipient)
    return Message.objects.create(sender=sender, recipient=recipient, content=content)


def get_history(me, friend, before_id=None, limit=HISTORY_PAGE_SIZE):
    """Return up to `limit` messages older than `before_id`, oldest first.

    Cursor pagination on the id: stable even when new messages arrive.
    """
    _ensure_friends(me, friend)
    messages = Message.objects.filter(
        Q(sender=me, recipient=friend) | Q(sender=friend, recipient=me)
    ).select_related("sender", "recipient")
    if before_id is not None:
        messages = messages.filter(id__lt=before_id)
    return list(reversed(messages.order_by("-id")[:limit]))


def mark_read(me, friend):
    """Mark everything `friend` sent to `me` as read. Return the affected ids."""
    unread = Message.objects.filter(sender=friend, recipient=me, read_at__isnull=True)
    ids = list(unread.values_list("id", flat=True))
    Message.objects.filter(id__in=ids).update(read_at=timezone.now())
    return ids


def chat_list(me):
    """All friends with their last message and unread count, latest chat first.

    Everything is computed with subqueries, so this is a single SQL query.
    """
    last_message = Message.objects.filter(
        Q(sender=me, recipient=OuterRef("pk")) | Q(sender=OuterRef("pk"), recipient=me)
    ).order_by("-id")
    unread_count = (
        Message.objects.filter(sender=OuterRef("pk"), recipient=me, read_at__isnull=True)
        .order_by()
        .values("sender")
        .annotate(count=Count("id"))
        .values("count")
    )
    return friends_of(me).annotate(
        last_message=Subquery(last_message.values("content")[:1]),
        last_message_at=Subquery(last_message.values("created_at")[:1]),
        unread_count=Coalesce(Subquery(unread_count), 0),
    ).order_by(F("last_message_at").desc(nulls_last=True), "display_name")
