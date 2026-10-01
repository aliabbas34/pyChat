from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/friends/", include("friends.urls")),
    path("api/chats/", include("chat.urls")),
]
