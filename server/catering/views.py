from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Address, Meal, Order, Route
from .serializers import (
    AddressSerializer,
    MealSerializer,
    OrderSerializer,
    RouteOptimizationRequestSerializer,
    RouteSerializer,
)


class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all().order_by("id")
    serializer_class = AddressSerializer
    permission_classes = (AllowAny,)


class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.all().order_by("id")
    serializer_class = MealSerializer
    permission_classes = (AllowAny,)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.select_related("address")
        .prefetch_related("items__meal")
        .order_by("id")
    )
    serializer_class = OrderSerializer
    permission_classes = (AllowAny,)


class CurrentRouteView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        route = Route.objects.order_by("-created_at", "-id").first()

        if route is None:
            return Response(
                {"detail": "No route has been optimized yet."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(RouteSerializer(route).data)


class RouteOptimizationView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = RouteOptimizationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response(
            {"detail": "The routing provider is not configured yet."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
