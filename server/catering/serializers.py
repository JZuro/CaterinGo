from rest_framework import serializers

from .models import Address, Meal


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
        read_only_fields = ("id",)


class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = (
            "id",
            "name",
        )
        read_only_fields = ("id",)
