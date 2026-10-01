from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _user_from_token(token):
    User = get_user_model()
    try:
        return User.objects.get(id=AccessToken(token)["user_id"])
    except (TokenError, User.DoesNotExist):
        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    """Authenticate WebSocket connections with `?token=<access token>`.

    Browsers cannot set headers on a WebSocket handshake, so the token
    travels in the query string.
    """

    async def __call__(self, scope, receive, send):
        token = parse_qs(scope["query_string"].decode()).get("token", [None])[0]
        scope["user"] = await _user_from_token(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
