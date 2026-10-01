"""Friendship business rules. Views and the WebSocket consumer call these."""

from django.contrib.auth import get_user_model
from django.db import models, transaction

from config.exceptions import DomainError

from .models import FriendRequest, Friendship

User = get_user_model()


class FriendshipError(DomainError):
    pass


class Relationship(models.TextChoices):
    """How another user relates to the current user."""

    SELF = "self"
    NONE = "none"
    SENT = "sent"  # I sent them a request
    RECEIVED = "received"  # They sent me a request
    FRIENDS = "friends"


def _ordered_pair(a, b):
    return (a, b) if a.id < b.id else (b, a)


def are_friends(a, b):
    user1, user2 = _ordered_pair(a, b)
    return Friendship.objects.filter(user1=user1, user2=user2).exists()


def friends_of(user):
    as_user1 = Friendship.objects.filter(user1=user).values("user2")
    as_user2 = Friendship.objects.filter(user2=user).values("user1")
    return User.objects.filter(models.Q(id__in=as_user1) | models.Q(id__in=as_user2))


def get_relationships(me, users):
    """Return {user_id: Relationship} for many users using three queries."""
    ids = [user.id for user in users]
    friend_ids = set(friends_of(me).filter(id__in=ids).values_list("id", flat=True))
    sent_ids = set(
        FriendRequest.objects.filter(sender=me, receiver_id__in=ids)
        .values_list("receiver_id", flat=True)
    )
    received_ids = set(
        FriendRequest.objects.filter(receiver=me, sender_id__in=ids)
        .values_list("sender_id", flat=True)
    )

    def relationship(user_id):
        if user_id == me.id:
            return Relationship.SELF
        if user_id in friend_ids:
            return Relationship.FRIENDS
        if user_id in sent_ids:
            return Relationship.SENT
        if user_id in received_ids:
            return Relationship.RECEIVED
        return Relationship.NONE

    return {user_id: relationship(user_id) for user_id in ids}


def get_relationship(me, other):
    return get_relationships(me, [other])[other.id]


def send_request(me, other):
    errors = {
        Relationship.SELF: "You cannot add yourself.",
        Relationship.FRIENDS: "You are already friends.",
        Relationship.SENT: "Request already sent.",
        Relationship.RECEIVED: "This user already sent you a request.",
    }
    relationship = get_relationship(me, other)
    if relationship in errors:
        raise FriendshipError(errors[relationship])
    return FriendRequest.objects.create(sender=me, receiver=other)


def _pending_request(sender, receiver):
    try:
        return FriendRequest.objects.get(sender=sender, receiver=receiver)
    except FriendRequest.DoesNotExist:
        raise FriendshipError("No pending request.")


@transaction.atomic
def accept_request(me, other):
    """Accept the request `other` sent to `me`."""
    _pending_request(sender=other, receiver=me).delete()
    user1, user2 = _ordered_pair(me, other)
    Friendship.objects.create(user1=user1, user2=user2)


def reject_request(me, other):
    """Reject the request `other` sent to `me`."""
    _pending_request(sender=other, receiver=me).delete()


def cancel_request(me, other):
    """Withdraw the request `me` sent to `other`."""
    _pending_request(sender=me, receiver=other).delete()


def unfriend(me, other):
    user1, user2 = _ordered_pair(me, other)
    deleted, _ = Friendship.objects.filter(user1=user1, user2=user2).delete()
    if not deleted:
        raise FriendshipError("You are not friends.")
