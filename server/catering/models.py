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
        return f"Order {self.id} — {self.status}"
