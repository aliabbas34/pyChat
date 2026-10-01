from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100)
    bio = models.TextField(max_length=500, blank=True)

    def __str__(self):
        return self.username
