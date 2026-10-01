from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    path("auth/signup/", views.SignupView.as_view()),
    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("users/me/", views.MeView.as_view()),
    path("users/me/password/", views.ChangePasswordView.as_view()),
    path("users/search/", views.UserSearchView.as_view()),
    path("users/<str:username>/", views.ProfileView.as_view()),
]
