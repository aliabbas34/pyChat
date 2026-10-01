"""Push events to a user's open sockets.

Every connected socket joins the group "user_<id>", so sending to that group
reaches all of the user's tabs, whichever server process they are on.
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def user_group(user_id):
    return f"user_{user_id}"


async def notify_async(user_id, event, data):
    await get_channel_layer().group_send(
        user_group(user_id), {"type": "push", "event": event, "data": data}
    )


def notify(user_id, event, data):
    async_to_sync(notify_async)(user_id, event, data)
