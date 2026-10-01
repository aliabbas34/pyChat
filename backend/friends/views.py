from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import UserSerializer
from chat.events import notify

from . import services
from .models import FriendRequest

# action in URL -> (service function, event sent to the other user)
REQUEST_ACTIONS = {
    "accept": (services.accept_request, "friend_request.accepted"),
    "reject": (services.reject_request, "friend_request.rejected"),
    "cancel": (services.cancel_request, "friend_request.cancelled"),
}


class FriendRequestListView(APIView):
    def get(self, request):
        incoming = FriendRequest.objects.filter(receiver=request.user).select_related("sender")
        outgoing = FriendRequest.objects.filter(sender=request.user).select_related("receiver")
        return Response(
            {
                "incoming": UserSerializer([r.sender for r in incoming], many=True).data,
                "outgoing": UserSerializer([r.receiver for r in outgoing], many=True).data,
            }
        )

    def post(self, request):
        other = get_object_or_404(User, username=request.data.get("username"))
        services.send_request(request.user, other)
        notify(other.id, "friend_request.new", {"user": UserSerializer(request.user).data})
        return Response(status=status.HTTP_201_CREATED)


class FriendRequestActionView(APIView):
    def post(self, request, username, action):
        other = get_object_or_404(User, username=username)
        service, event = REQUEST_ACTIONS[action]
        service(request.user, other)
        notify(other.id, event, {"user": UserSerializer(request.user).data})
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendView(APIView):
    def delete(self, request, username):
        other = get_object_or_404(User, username=username)
        services.unfriend(request.user, other)
        notify(other.id, "friend.removed", {"user": UserSerializer(request.user).data})
        return Response(status=status.HTTP_204_NO_CONTENT)
