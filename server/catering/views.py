from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Address
from .serializers import AddressSerializer


class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all().order_by("id")
    serializer_class = AddressSerializer
    permission_classes = (AllowAny,)
