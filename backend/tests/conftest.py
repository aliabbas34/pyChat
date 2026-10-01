import pytest
from rest_framework.test import APIClient

from accounts.models import User
from friends import services as friend_services


@pytest.fixture(autouse=True)
def in_memory_channel_layer(settings):
    settings.CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}


@pytest.fixture
def make_user(db):
    def make(username):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            display_name=username.title(),
            password="s3cure-pass-123",
        )

    return make


@pytest.fixture
def alice(make_user):
    return make_user("alice")


@pytest.fixture
def bob(make_user):
    return make_user("bob")


@pytest.fixture
def make_friends():
    def make(a, b):
        friend_services.send_request(a, b)
        friend_services.accept_request(b, a)

    return make


@pytest.fixture
def client_for():
    def make(user):
        client = APIClient()
        client.force_authenticate(user)
        return client

    return make
