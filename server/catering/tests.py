from decimal import Decimal
from io import BytesIO
from unittest.mock import patch

from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Address, Meal, Order, OrderItem
from .services.geocoding import Coordinates, geocode_address


class GeocodingServiceTests(SimpleTestCase):
    def tearDown(self):
        cache.clear()

    @override_settings(NOMINATIM_USER_AGENT="CaterinGo-tests/1.0")
    @patch(
        "catering.services.geocoding.urlopen",
        return_value=BytesIO(b'[{"lat": "51.759248", "lon": "19.455983"}]'),
    )
    def test_geocoding_uses_identifying_header_and_caches_result(self, urlopen):
        cache.clear()

        first_result = geocode_address(
            street="al. gen. Józefa Hallera 5A",
            city="Łódź",
            postal_code="90-001",
        )
        second_result = geocode_address(
            street="al. gen. Józefa Hallera 5A",
            city="Łódź",
            postal_code="90-001",
        )

        self.assertEqual(first_result, second_result)
        if first_result is None:
            self.fail("Expected coordinates from Nominatim response")
        self.assertEqual(first_result.latitude, Decimal("51.759248"))
        self.assertEqual(first_result.longitude, Decimal("19.455983"))
        self.assertEqual(
            urlopen.call_args.args[0].get_header("User-agent"),
            "CaterinGo-tests/1.0",
        )
        urlopen.assert_called_once()


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
                    "latitude": None,
                    "longitude": None,
                }
            ],
        )

    @patch(
        "catering.serializers.geocode_address",
        return_value=Coordinates(
            latitude=Decimal("51.759248"),
            longitude=Decimal("19.455983"),
        ),
    )
    def test_create_address(self, geocode_address):
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
        self.assertEqual(created_address.latitude, Decimal("51.759248"))
        self.assertEqual(created_address.longitude, Decimal("19.455983"))
        geocode_address.assert_called_once_with(
            street="al. gen. Józefa Hallera 5A",
            city="Łódź",
            postal_code="90-001",
        )

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

    @patch(
        "catering.serializers.geocode_address",
        return_value=Coordinates(
            latitude=Decimal("49.822376"),
            longitude=Decimal("19.044384"),
        ),
    )
    def test_update_address(self, geocode_address):
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
        self.assertEqual(self.address.latitude, Decimal("49.822376"))
        self.assertEqual(self.address.longitude, Decimal("19.044384"))
        geocode_address.assert_called_once_with(
            street="ul. Żółkiewskiego 10/12",
            city="Bielsko-Biała",
            postal_code="27-530",
        )

    @patch("catering.serializers.geocode_address")
    def test_unchanged_address_is_not_geocoded_again(self, geocode_address):
        detail_url = reverse("address-detail", args=[self.address.id])

        response = self.client.patch(
            detail_url,
            {"city": "Ostrów Świętokrzyski"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        geocode_address.assert_not_called()

    @patch("catering.serializers.geocode_address", return_value=None)
    def test_failed_geocoding_clears_stale_coordinates(self, geocode_address):
        self.address.latitude = Decimal("50.929580")
        self.address.longitude = Decimal("21.385810")
        self.address.save(update_fields=("latitude", "longitude"))
        detail_url = reverse("address-detail", args=[self.address.id])

        response = self.client.patch(
            detail_url,
            {"street": "Nieznana 999"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.address.refresh_from_db()
        self.assertIsNone(self.address.latitude)
        self.assertIsNone(self.address.longitude)
        geocode_address.assert_called_once()

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


class OrderAPITests(APITestCase):
    def setUp(self):
        self.list_url = reverse("order-list")
        self.address = Address.objects.create(
            street="ul. Świętojańska 15",
            apartment="7",
            city="Gdynia",
            postal_code="81-368",
        )
        self.meal = Meal.objects.create(name="Dieta Wysokobiałkowa")
        self.other_meal = Meal.objects.create(name="Low Carb")
        self.order = Order.objects.create(
            address=self.address,
            status=Order.Status.PENDING,
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            meal=self.meal,
            quantity=2,
        )

    def test_list_orders(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": self.order.id,
                    "status": "pending",
                    "address": {
                        "id": self.address.id,
                        "street": "ul. Świętojańska 15",
                        "apartment": "7",
                        "city": "Gdynia",
                        "postal_code": "81-368",
                        "latitude": None,
                        "longitude": None,
                    },
                    "items": [
                        {
                            "id": self.order_item.pk,
                            "meal": {
                                "id": self.meal.id,
                                "name": "Dieta Wysokobiałkowa",
                            },
                            "quantity": 2,
                        }
                    ],
                }
            ],
        )

    def test_create_order_with_items(self):
        response = self.client.post(
            self.list_url,
            {
                "status": "pending",
                "address_id": self.address.id,
                "items": [
                    {
                        "meal_id": self.meal.id,
                        "quantity": 1,
                    },
                    {
                        "meal_id": self.other_meal.id,
                        "quantity": 3,
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response_data = response.json()
        created_order = Order.objects.get(id=response_data["id"])
        self.assertEqual(created_order.address, self.address)
        self.assertEqual(created_order.status, Order.Status.PENDING)
        self.assertEqual(OrderItem.objects.filter(order=created_order).count(), 2)
        self.assertNotIn("address_id", response_data)
        self.assertNotIn("meal_id", response_data["items"][0])

    def test_create_order_requires_at_least_one_item(self):
        response = self.client.post(
            self.list_url,
            {
                "status": "pending",
                "address_id": self.address.id,
                "items": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.json())
        self.assertEqual(Order.objects.count(), 1)

    def test_create_order_rejects_duplicate_meals(self):
        response = self.client.post(
            self.list_url,
            {
                "status": "pending",
                "address_id": self.address.id,
                "items": [
                    {
                        "meal_id": self.meal.id,
                        "quantity": 1,
                    },
                    {
                        "meal_id": self.meal.id,
                        "quantity": 2,
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.json())
        self.assertEqual(Order.objects.count(), 1)

    def test_create_order_rejects_quantity_below_one(self):
        response = self.client.post(
            self.list_url,
            {
                "status": "pending",
                "address_id": self.address.id,
                "items": [
                    {
                        "meal_id": self.meal.id,
                        "quantity": 0,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.json())
        self.assertEqual(Order.objects.count(), 1)

    def test_update_status_preserves_items(self):
        detail_url = reverse("order-detail", args=[self.order.id])
        order_item_pk = self.order_item.pk

        response = self.client.patch(
            detail_url,
            {"status": "delivered"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.DELIVERED)
        self.assertTrue(OrderItem.objects.filter(pk=order_item_pk).exists())

    def test_update_order_replaces_items(self):
        detail_url = reverse("order-detail", args=[self.order.id])
        old_item_pk = self.order_item.pk

        response = self.client.patch(
            detail_url,
            {
                "items": [
                    {
                        "meal_id": self.other_meal.id,
                        "quantity": 4,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(OrderItem.objects.filter(pk=old_item_pk).exists())

        updated_items = OrderItem.objects.filter(order=self.order)
        self.assertEqual(updated_items.count(), 1)

        updated_item = updated_items.get()
        self.assertEqual(updated_item.meal, self.other_meal)
        self.assertEqual(updated_item.quantity, 4)

    def test_delete_order_cascades_to_items(self):
        detail_url = reverse("order-detail", args=[self.order.id])
        order_id = self.order.id
        order_item_pk = self.order_item.pk
        address_id = self.address.id
        meal_id = self.meal.id

        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Order.objects.filter(id=order_id).exists())
        self.assertFalse(OrderItem.objects.filter(pk=order_item_pk).exists())
        self.assertTrue(Address.objects.filter(id=address_id).exists())
        self.assertTrue(Meal.objects.filter(id=meal_id).exists())
