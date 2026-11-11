from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from .models import Address, Meal, Order, OrderItem, Route
from .services.geocoding import geocode_address

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")
        read_only_fields = fields


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(
        max_length=150,
        validators=[UnicodeUsernameValidator()],
    )
    password = serializers.CharField(
        max_length=128,
        write_only=True,
        trim_whitespace=False,
    )
    password_confirm = serializers.CharField(
        max_length=128,
        write_only=True,
        trim_whitespace=False,
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )

        user = User(username=attrs["username"])
        try:
            password_validation.validate_password(attrs["password"], user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError(
                {"password": list(error.messages)}
            ) from error

        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        max_length=128,
        write_only=True,
        trim_whitespace=False,
    )


class OwnedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.context.get("request")

        if request is None or not request.user.is_authenticated:
            return queryset.none()

        return queryset.filter(user=request.user)


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

    def validate_name(self, value):
        request = self.context["request"]
        meals = Meal.objects.filter(user=request.user, name=value)

        if self.instance is not None:
            meals = meals.exclude(pk=self.instance.pk)

        if meals.exists():
            raise serializers.ValidationError(
                "You already have a meal with this name."
            )

        return value


class OrderItemSerializer(serializers.ModelSerializer):
    meal = MealSerializer(read_only=True)
    meal_id = OwnedPrimaryKeyRelatedField(
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
    address_id = OwnedPrimaryKeyRelatedField(
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
        order = Order.objects.create(
            user=self.context["request"].user,
            **validated_data,
        )

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
    start_address_id = OwnedPrimaryKeyRelatedField(
        queryset=Address.objects.all(),
        source="start_address",
    )
    end_address_id = OwnedPrimaryKeyRelatedField(
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
