from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from chat import presence
from friends.services import get_relationships

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    MeSerializer,
    ProfileSerializer,
    SignupSerializer,
)

SEARCH_LIMIT = 20


def profile_context(me, users):
    """Everything ProfileSerializer needs, fetched in bulk for a list of users."""
    return {
        "relationships": get_relationships(me, users),
        "online_ids": presence.online_ids([user.id for user in users]),
    }


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"user": request.user}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserSearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        users = list(
            User.objects.filter(
                Q(username__icontains=query) | Q(display_name__icontains=query)
            )
            .exclude(id=request.user.id)
            .order_by("username")[:SEARCH_LIMIT]
        )
        context = profile_context(request.user, users)
        return Response(ProfileSerializer(users, many=True, context=context).data)


class ProfileView(APIView):
    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        context = profile_context(request.user, [user])
        return Response(ProfileSerializer(user, context=context).data)
