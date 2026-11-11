from django.db import transaction
from rest_framework import serializers

from .models import Address, Meal, Order, OrderItem


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id",
            "street",
            "apartment",
            "city",
            "postal_code",
            "latitude",
            "longitude",
        )
        read_only_fields = ("id", "latitude", "longitude")


class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = (
            "id",
            "name",
        )
        read_only_fields = ("id",)


class OrderItemSerializer(serializers.ModelSerializer):
    meal = MealSerializer(read_only=True)
    meal_id = serializers.PrimaryKeyRelatedField(
        queryset=Meal.objects.all(),
        source="meal",
        write_only=True,
    )

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "meal",
            "meal_id",
            "quantity",
        )
        read_only_fields = ("id",)


class OrderSerializer(serializers.ModelSerializer):
    address = AddressSerializer(read_only=True)
    address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(),
        source="address",
        write_only=True,
    )
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "address",
            "address_id",
            "items",
        )
        read_only_fields = ("id",)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError(
                "An order must contain at least one item."
            )

        meal_ids = [item["meal"].id for item in items]

        if len(meal_ids) != len(set(meal_ids)):
            raise serializers.ValidationError(
                "Each meal can appear only once in an order."
            )

        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                **item_data,
            )

        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        order = super().update(instance, validated_data)

        if items_data is not None:
            OrderItem.objects.filter(order=order).delete()

            for item_data in items_data:
                OrderItem.objects.create(
                    order=order,
                    **item_data,
                )

        return order
