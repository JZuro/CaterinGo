from django.core.validators import MinValueValidator
from django.db import models


class Address(models.Model):
    id = models.BigAutoField(primary_key=True)
    street = models.CharField(max_length=255)
    apartment = models.CharField(max_length=20, blank=True, default="")
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.street}, {self.city}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    id = models.BigAutoField(primary_key=True)
    address = models.ForeignKey(
        Address,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(
        max_length=9,
        choices=Status,
        default=Status.PENDING,
    )

    def __str__(self) -> str:
        return f"Order {self.id} status: {self.status}"


class Meal(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=35, unique=True)

    def __str__(self) -> str:
        return f"Meal #{self.id}: {self.name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    meal = models.ForeignKey(Meal, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveSmallIntegerField(
        default=1, validators=[MinValueValidator(1)]
    )

    class Meta:
        constraints = [  # noqa: RUF012
            models.UniqueConstraint(
                fields=["order", "meal"],
                name="unique_meal_per_order",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.order}: {self.meal} × {self.quantity}"
