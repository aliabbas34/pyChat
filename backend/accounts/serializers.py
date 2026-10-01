from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User

# These would collide with fixed URL segments, e.g. /api/users/me/.
RESERVED_USERNAMES = {"me", "search", "requests"}


def validate_not_reserved(username):
    if username.lower() in RESERVED_USERNAMES:
        raise serializers.ValidationError("This username is not available.")
    return username


class UserSerializer(serializers.ModelSerializer):
    """Public view of a user, safe to show to anyone."""

    class Meta:
        model = User
        fields = ["id", "username", "display_name", "bio"]


class ProfileSerializer(UserSerializer):
    """A user as seen by the requester: adds relationship and online status.

    Expects `relationships` ({user_id: status}) and `online_ids` (set) in the
    context, so a list of users is resolved with a fixed number of queries.
    """

    relationship = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["relationship", "is_online"]

    def get_relationship(self, user):
        return self.context["relationships"][user.id]

    def get_is_online(self, user):
        return user.id in self.context["online_ids"]


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "display_name", "email", "password"]

    def validate_username(self, value):
        return validate_not_reserved(value)

    def validate(self, attrs):
        validate_password(attrs["password"], user=User(**attrs))
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class MeSerializer(serializers.ModelSerializer):
    """The logged-in user's own editable profile."""

    class Meta:
        model = User
        fields = ["id", "username", "display_name", "email", "bio"]

    def validate_username(self, value):
        return validate_not_reserved(value)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context["user"].check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["user"])
        return value

    def save(self):
        user = self.context["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
