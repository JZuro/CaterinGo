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
        self.assertFalse(OrderItem.objects.filter(pk=order_item.pk).exists())
        self.assertTrue(Meal.objects.filter(id=meal.id).exists())

class MealAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("meal-list")
        self.meal = Meal.objects.create(name="Dieta Wysokobiałkowa")

    def test_list_meals(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": self.meal.id,
                    "name": "Dieta Wysokobiałkowa",
                }
            ],
        )

    def test_create_meal(self):
        response = self.client.post(
            self.list_url,
            {"name": "Super Sport +"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_meal = Meal.objects.get(id=response.json()["id"])
        self.assertEqual(created_meal.name, "Super Sport +")

    def test_create_meal_rejects_duplicate_name(self):
        response = self.client.post(
            self.list_url,
            {"name": "Dieta Wysokobiałkowa"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.json())
        self.assertEqual(Meal.objects.count(), 1)

    def test_update_meal(self):
        detail_url = reverse("meal-detail", args=[self.meal.id])

        response = self.client.patch(
            detail_url,
            {"name": "Low Carb"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.meal.refresh_from_db()
        self.assertEqual(self.meal.name, "Low Carb")

    def test_delete_meal(self):
        detail_url = reverse("meal-detail", args=[self.meal.id])

        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Meal.objects.filter(id=self.meal.id).exists())

    def test_delete_meal_cascades_to_order_items(self):
        address = Address.objects.create(
            street="ul. Leśna 7",
            apartment="2A",
            city="Białystok",
            postal_code="15-001",
        )
        order = Order.objects.create(address=address)
        order_item = OrderItem.objects.create(
            order=order,
            meal=self.meal,
            quantity=3,
        )

        meal_id = self.meal.id
        order_item_pk = order_item.pk
        order_id = order.id
        address_id = address.id

        detail_url = reverse("meal-detail", args=[meal_id])
        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Meal.objects.filter(id=meal_id).exists())
        self.assertFalse(OrderItem.objects.filter(pk=order_item_pk).exists())
        self.assertTrue(Order.objects.filter(id=order_id).exists())
        self.assertTrue(Address.objects.filter(id=address_id).exists())