from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Address, Meal, Order
from .serializers import AddressSerializer, MealSerializer, OrderSerializer


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
