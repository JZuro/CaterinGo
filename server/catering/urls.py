from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet,
    CurrentRouteView,
    CurrentUserView,
    LoginView,
    LogoutView,
    MealViewSet,
    OrderViewSet,
    RouteOptimizationView,
    SignupView,
)

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")
router.register("meals", MealViewSet, basename="meal")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("routes/current/", CurrentRouteView.as_view(), name="current-route"),
    path(
        "routes/optimize/",
        RouteOptimizationView.as_view(),
        name="optimize-route",
    ),
] + router.urls
