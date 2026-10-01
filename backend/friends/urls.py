from django.urls import path, re_path

from . import views

urlpatterns = [
    path("requests/", views.FriendRequestListView.as_view()),
    re_path(
        r"^requests/(?P<username>[^/]+)/(?P<action>accept|reject|cancel)/$",
        views.FriendRequestActionView.as_view(),
    ),
    path("<str:username>/", views.FriendView.as_view()),
]
