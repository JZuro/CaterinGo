from django.db import models


class Address(models.Model):
    id = models.BigAutoField(primary_key=True)
    street = models.CharField(max_length=255)
    apartment = models.CharField(max_length=20, blank=True, default="")
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.street}, {self.city}"
