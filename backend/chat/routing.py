from django.urls import path

from .consumers import UserConsumer

websocket_urlpatterns = [
    path("ws/", UserConsumer.as_asgi()),
]
