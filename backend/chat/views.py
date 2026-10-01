from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from . import presence, services
from .serializers import ChatListItemSerializer, MessageSerializer


class ChatListView(APIView):
    def get(self, request):
        friends = list(services.chat_list(request.user))
        context = {"online_ids": presence.online_ids([friend.id for friend in friends])}
        return Response(ChatListItemSerializer(friends, many=True, context=context).data)


class MessageHistoryView(APIView):
    def get(self, request, username):
        friend = get_object_or_404(User, username=username)
        before = request.query_params.get("before")
        if before is not None and not before.isdigit():
            raise ValidationError({"before": "Must be a message id."})
        messages = services.get_history(
            request.user, friend, before_id=int(before) if before else None
        )
        return Response(MessageSerializer(messages, many=True).data)
