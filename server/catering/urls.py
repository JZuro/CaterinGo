from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet,
    CurrentRouteView,
    MealViewSet,
    OrderViewSet,
    RouteOptimizationView,
)

router = DefaultRouter()
router.register("addresses", AddressViewSet)
router.register("meals", MealViewSet)
router.register("orders", OrderViewSet)

urlpatterns = [
    path("routes/current/", CurrentRouteView.as_view(), name="current-route"),
    path(
        "routes/optimize/",
        RouteOptimizationView.as_view(),
        name="optimize-route",
    ),
] + router.urls
