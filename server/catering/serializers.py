from rest_framework import serializers

from .models import Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id",
            "street",
            "apartment",
            "city",
            "postal_code",
        )
        read_only_fields = [  # noqa: RUF012
            "id"
        ]
