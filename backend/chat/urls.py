from django.urls import path

from . import views

urlpatterns = [
    path("", views.ChatListView.as_view()),
    path("<str:username>/messages/", views.MessageHistoryView.as_view()),
]
