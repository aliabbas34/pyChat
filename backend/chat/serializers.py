from rest_framework import serializers

from accounts.models import User

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SlugRelatedField(slug_field="username", read_only=True)
    recipient = serializers.SlugRelatedField(slug_field="username", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "recipient", "content", "created_at", "read_at"]


class ChatListItemSerializer(serializers.ModelSerializer):
    """A friend annotated by services.chat_list. Expects `online_ids` in context."""

    last_message = serializers.CharField(allow_null=True)
    last_message_at = serializers.DateTimeField(allow_null=True)
    unread_count = serializers.IntegerField()
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "display_name",
            "last_message",
            "last_message_at",
            "unread_count",
            "is_online",
        ]

    def get_is_online(self, user):
        return user.id in self.context["online_ids"]
