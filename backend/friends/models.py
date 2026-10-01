from django.conf import settings
from django.db import models


class FriendRequest(models.Model):
    """A pending request. Accepting, rejecting or cancelling deletes the row."""

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_requests"
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_requests"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["sender", "receiver"], name="unique_friend_request"),
        ]


class Friendship(models.Model):
    """One row per pair of friends, always stored with user1_id < user2_id."""

    user1 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    user2 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user1", "user2"], name="unique_friendship"),
            models.CheckConstraint(
                condition=models.Q(user1__lt=models.F("user2")),
                name="friendship_user1_lt_user2",
            ),
        ]
