from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Address, Meal
from .serializers import AddressSerializer, MealSerializer


class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all().order_by("id")
    serializer_class = AddressSerializer
    permission_classes = (AllowAny,)


class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.all().order_by("id")
    serializer_class = MealSerializer
    permission_classes = (AllowAny,)
