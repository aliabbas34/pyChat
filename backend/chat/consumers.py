from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model

from config.exceptions import DomainError
from friends.services import are_friends, friends_of

from . import presence, services
from .events import notify_async, user_group
from .serializers import MessageSerializer

User = get_user_model()

UNAUTHORIZED = 4401


class UserConsumer(AsyncJsonWebsocketConsumer):
    """One socket per logged-in user, carrying every real-time event.

    Client -> server events are dispatched through `handlers`, so adding an
    event means adding one method and one entry.
    """

    handlers = {
        "message.send": "on_message_send",
        "typing": "on_typing",
        "messages.read": "on_messages_read",
    }

    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close(code=UNAUTHORIZED)
            return
        await self.channel_layer.group_add(user_group(self.user.id), self.channel_name)
        await self.accept()
        if await sync_to_async(presence.connect)(self.user.id):
            await self.broadcast_presence(online=True)

    async def disconnect(self, code):
        if not self.user.is_authenticated:
            return
        await self.channel_layer.group_discard(user_group(self.user.id), self.channel_name)
        if await sync_to_async(presence.disconnect)(self.user.id):
            await self.broadcast_presence(online=False)

    async def receive_json(self, content):
        handler_name = self.handlers.get(content.get("type"))
        if handler_name is None:
            await self.send_error("Unknown event type.")
            return
        try:
            await getattr(self, handler_name)(content.get("data") or {})
        except (DomainError, User.DoesNotExist) as error:
            await self.send_error(str(error))

    async def on_message_send(self, data):
        recipient = await self.get_user(data.get("to"))
        message = await database_sync_to_async(services.send_message)(
            self.user, recipient, str(data.get("content", ""))
        )
        payload = MessageSerializer(message).data
        # The sender is notified too, so their other open tabs stay in sync.
        for user_id in {self.user.id, recipient.id}:
            await notify_async(user_id, "message.new", payload)

    async def on_typing(self, data):
        recipient = await self.get_user(data.get("to"))
        if await database_sync_to_async(are_friends)(self.user, recipient):
            await notify_async(recipient.id, "typing", {"from": self.user.username})

    async def on_messages_read(self, data):
        friend = await self.get_user(data.get("friend"))
        ids = await database_sync_to_async(services.mark_read)(self.user, friend)
        if ids:
            await notify_async(friend.id, "messages.read", {"by": self.user.username, "ids": ids})

    async def push(self, event):
        """Called by the channel layer for events sent with events.notify."""
        await self.send_json({"type": event["event"], "data": event["data"]})

    async def broadcast_presence(self, online):
        friend_ids = await database_sync_to_async(
            lambda: list(friends_of(self.user).values_list("id", flat=True))
        )()
        for friend_id in friend_ids:
            await notify_async(
                friend_id, "presence", {"username": self.user.username, "online": online}
            )

    async def send_error(self, detail):
        await self.send_json({"type": "error", "data": {"detail": detail}})

    @database_sync_to_async
    def get_user(self, username):
        return User.objects.get(username=username)
