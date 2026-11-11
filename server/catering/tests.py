from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Address, Meal, Order, OrderItem


class AddressAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("address-list")
        self.address = Address.objects.create(
            street="ul. Żółkiewskiego 10/12",
            apartment="4B",
            city="Ostrów Świętokrzyski",
            postal_code="27-530",
        )

    def test_list_addresses(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": self.address.id,
                    "street": "ul. Żółkiewskiego 10/12",
                    "apartment": "4B",
                    "city": "Ostrów Świętokrzyski",
                    "postal_code": "27-530",
                }
            ],
        )

    def test_create_address(self):
        response = self.client.post(
            self.list_url,
            {
                "street": "al. gen. Józefa Hallera 5A",
                "apartment": "12/3",
                "city": "Łódź",
                "postal_code": "90-001",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_address = Address.objects.get(id=response.json()["id"])
        self.assertEqual(created_address.street, "al. gen. Józefa Hallera 5A")
        self.assertEqual(created_address.apartment, "12/3")
        self.assertEqual(created_address.city, "Łódź")
        self.assertEqual(created_address.postal_code, "90-001")

    def test_create_address_requires_postal_code(self):
        response = self.client.post(
            self.list_url,
            {
                "street": "pl. Zbawiciela 1",
                "apartment": "oficyna, lok. 6",
                "city": "Gdańsk",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("postal_code", response.json())
        self.assertEqual(Address.objects.count(), 1)

    def test_update_address(self):
        detail_url = reverse("address-detail", args=[self.address.id])

        response = self.client.patch(
            detail_url,
            {"city": "Bielsko-Biała"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.address.refresh_from_db()
        self.assertEqual(self.address.city, "Bielsko-Biała")
        self.assertEqual(self.address.street, "ul. Żółkiewskiego 10/12")

    def test_delete_address_cascades_to_orders(self):
        order = Order.objects.create(address=self.address)
        meal = Meal.objects.create(name="Dieta Wysokobiałkowa")
        order_item = OrderItem.objects.create(
            order=order,
            meal=meal,
            quantity=2,
        )
        detail_url = reverse("address-detail", args=[self.address.id])

        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Address.objects.filter(id=self.address.id).exists())
        self.assertFalse(Order.objects.filter(id=order.id).exists())
        self.assertFalse(OrderItem.objects.filter(id=order_item.id).exists())
        self.assertTrue(Meal.objects.filter(id=meal.id).exists())
