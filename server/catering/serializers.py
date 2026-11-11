from django.db import transaction
from rest_framework import serializers

from .models import Address, Meal, Order, OrderItem, Route
from .services.geocoding import geocode_address


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

    def _geocode(self, address):
        coordinates = geocode_address(
            street=address.street,
            city=address.city,
            postal_code=address.postal_code,
        )
        address.latitude = coordinates.latitude if coordinates else None
        address.longitude = coordinates.longitude if coordinates else None
        address.save(update_fields=("latitude", "longitude"))

    def create(self, validated_data):
        address = super().create(validated_data)
        self._geocode(address)
        return address

    def update(self, instance, validated_data):
        address_changed = any(
            field in validated_data
            and validated_data[field] != getattr(instance, field)
            for field in ("street", "city", "postal_code")
        )
        address = super().update(instance, validated_data)

        if address_changed:
            self._geocode(address)

        return address


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


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = (
            "id",
            "created_at",
            "start",
            "end",
            "stops",
            "distance_meters",
            "duration_seconds",
        )
        read_only_fields = fields


class RouteOptimizationRequestSerializer(serializers.Serializer):
    start_address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(),
        source="start_address",
    )
    end_address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(),
        source="end_address",
    )

    def validate(self, attrs):
        missing_coordinates = [
            input_field
            for input_field, source_field in (
                ("start_address_id", "start_address"),
                ("end_address_id", "end_address"),
            )
            if attrs[source_field].latitude is None
            or attrs[source_field].longitude is None
        ]

        if missing_coordinates:
            raise serializers.ValidationError(
                {
                    field: "This address has no coordinates."
                    for field in missing_coordinates
                }
            )

        return attrs
