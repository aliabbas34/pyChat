import pytest
from channels.db import database_sync_to_async
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken

from chat.middleware import JwtAuthMiddleware
from chat.routing import websocket_urlpatterns

application = JwtAuthMiddleware(URLRouter(websocket_urlpatterns))

pytestmark = pytest.mark.django_db(transaction=True)


async def connect(user):
    communicator = WebsocketCommunicator(application, f"/ws/?token={AccessToken.for_user(user)}")
    connected, _ = await communicator.connect()
    assert connected
    return communicator


async def receive_until(communicator, event_type):
    while True:
        event = await communicator.receive_json_from(timeout=2)
        if event["type"] == event_type:
            return event


async def test_rejects_missing_token():
    communicator = WebsocketCommunicator(application, "/ws/")
    connected, _ = await communicator.connect()
    assert not connected


async def test_message_reaches_friend(alice, bob, make_friends):
    await database_sync_to_async(make_friends)(alice, bob)
    alice_ws = await connect(alice)
    bob_ws = await connect(bob)

    await alice_ws.send_json_to({"type": "message.send", "data": {"to": "bob", "content": "hi"}})
    event = await receive_until(bob_ws, "message.new")
    assert event["data"]["content"] == "hi"
    assert event["data"]["sender"] == "alice"

    await alice_ws.disconnect()
    await bob_ws.disconnect()


async def test_message_to_non_friend_returns_error(alice, bob):
    alice_ws = await connect(alice)
    await alice_ws.send_json_to({"type": "message.send", "data": {"to": "bob", "content": "hi"}})
    event = await receive_until(alice_ws, "error")
    assert event["data"]["detail"] == "You can only chat with friends."
    await alice_ws.disconnect()
