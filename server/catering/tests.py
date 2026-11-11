from decimal import Decimal
from io import BytesIO
from unittest.mock import patch

from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Address, Meal, Order, OrderItem, Route
from .services.geocoding import Coordinates, geocode_address
from .services.routing import (
    Coordinate,
    RoadMatrix,
    RoutingProviderError,
    get_road_matrix,
)


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


class RoutingServiceTests(SimpleTestCase):
    def tearDown(self):
        cache.clear()

    @override_settings(OSRM_USER_AGENT="CaterinGo-tests/1.0")
    @patch(
        "catering.services.routing.urlopen",
        return_value=BytesIO(
            b'{"code":"Ok","distances":[[0,1200.5],[1350,0]],'
            b'"durations":[[0,180.2],[195.4,0]]}'
        ),
    )
    def test_road_matrix_uses_longitude_first_and_caches_result(self, urlopen):
        cache.clear()
        coordinates = [
            Coordinate(
                latitude=Decimal("52.229676"),
                longitude=Decimal("21.012229"),
            ),
            Coordinate(
                latitude=Decimal("52.249676"),
                longitude=Decimal("21.032229"),
            ),
        ]

        first_result = get_road_matrix(coordinates)
        second_result = get_road_matrix(coordinates)

        self.assertEqual(first_result, second_result)
        self.assertEqual(first_result.distances[0][1], 1200.5)
        self.assertEqual(first_result.durations[1][0], 195.4)
        request = urlopen.call_args.args[0]
        self.assertIn(
            "21.012229,52.229676;21.032229,52.249676",
            request.full_url,
        )
        self.assertEqual(
            request.get_header("User-agent"),
            "CaterinGo-tests/1.0",
        )
        urlopen.assert_called_once()

    @patch(
        "catering.services.routing.urlopen",
        return_value=BytesIO(b'{"code":"NoTable","message":"No route found"}'),
    )
    def test_road_matrix_reports_provider_error(self, urlopen):
        cache.clear()
        coordinates = [
            Coordinate(Decimal("52.229676"), Decimal("21.012229")),
            Coordinate(Decimal("52.249676"), Decimal("21.032229")),
        ]

        with self.assertRaisesMessage(RoutingProviderError, "No route found"):
            get_road_matrix(coordinates)

        urlopen.assert_called_once()

    @override_settings(OSRM_MAX_COORDINATES=2)
    def test_road_matrix_rejects_too_many_coordinates(self):
        coordinates = [
            Coordinate(Decimal("52.1"), Decimal("21.1")),
            Coordinate(Decimal("52.2"), Decimal("21.2")),
            Coordinate(Decimal("52.3"), Decimal("21.3")),
        ]

        with self.assertRaisesMessage(ValueError, "At most 2"):
            get_road_matrix(coordinates)


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


class RouteAPITests(APITestCase):
    def setUp(self):
        self.current_url = reverse("current-route")
        self.optimize_url = reverse("optimize-route")
        self.start_address = Address.objects.create(
            street="ul. Startowa 1",
            city="Warszawa",
            postal_code="00-001",
            latitude=Decimal("52.229676"),
            longitude=Decimal("21.012229"),
        )
        self.end_address = Address.objects.create(
            street="ul. Końcowa 10",
            city="Warszawa",
            postal_code="00-950",
            latitude=Decimal("52.249676"),
            longitude=Decimal("21.032229"),
        )

    def create_route(self, order_ids=None):
        return Route.objects.create(
            start={
                "address_id": self.start_address.id,
                "label": "ul. Startowa 1, 00-001 Warszawa",
                "latitude": "52.229676",
                "longitude": "21.012229",
            },
            end={
                "address_id": self.end_address.id,
                "label": "ul. Końcowa 10, 00-950 Warszawa",
                "latitude": "52.249676",
                "longitude": "21.032229",
            },
            stops=[
                {
                    "position": 1,
                    "address_id": self.end_address.id,
                    "label": "ul. Końcowa 10, 00-950 Warszawa",
                    "latitude": "52.249676",
                    "longitude": "21.032229",
                    "order_ids": order_ids or [],
                }
            ],
            distance_meters=5200,
            duration_seconds=900,
        )

    def test_current_route_returns_not_found_before_optimization(self):
        response = self.client.get(self.current_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_current_route_is_unchanged_when_order_status_changes(self):
        order = Order.objects.create(
            address=self.end_address,
            status=Order.Status.PENDING,
        )
        route = self.create_route(order_ids=[order.id])
        original_stops = route.stops

        order.status = Order.Status.DELIVERED
        order.save(update_fields=("status",))

        response = self.client.get(self.current_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["id"], route.id)
        self.assertEqual(response.json()["stops"], original_stops)

    def test_optimize_route_requires_geocoded_start_and_end(self):
        self.start_address.latitude = None
        self.start_address.longitude = None
        self.start_address.save(update_fields=("latitude", "longitude"))

        response = self.client.post(
            self.optimize_url,
            {
                "start_address_id": self.start_address.id,
                "end_address_id": self.end_address.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("start_address_id", response.json())

    @patch("catering.services.route_optimization.get_road_matrix")
    def test_optimize_route_uses_pending_orders_and_shortest_path(
        self,
        get_road_matrix,
    ):
        first_delivery = Address.objects.create(
            street="ul. Pierwsza 2",
            city="Warszawa",
            postal_code="00-002",
            latitude=Decimal("52.239676"),
            longitude=Decimal("21.022229"),
        )
        second_delivery = Address.objects.create(
            street="ul. Druga 3",
            city="Warszawa",
            postal_code="00-003",
            latitude=Decimal("52.244676"),
            longitude=Decimal("21.027229"),
        )
        skipped_address = Address.objects.create(
            street="ul. Anulowana 4",
            city="Warszawa",
            postal_code="00-004",
        )
        first_order = Order.objects.create(address=first_delivery)
        second_order = Order.objects.create(address=second_delivery)
        third_order = Order.objects.create(address=second_delivery)
        Order.objects.create(
            address=skipped_address,
            status=Order.Status.CANCELLED,
        )
        Order.objects.create(
            address=skipped_address,
            status=Order.Status.DELIVERED,
        )
        get_road_matrix.return_value = RoadMatrix(
            distances=(
                (0, 10, 2, 50),
                (10, 0, 10, 2),
                (2, 2, 0, 10),
                (50, 2, 10, 0),
            ),
            durations=(
                (0, 100, 20, 500),
                (100, 0, 100, 20),
                (20, 20, 0, 100),
                (500, 20, 100, 0),
            ),
        )

        response = self.client.post(
            self.optimize_url,
            {
                "start_address_id": self.start_address.id,
                "end_address_id": self.end_address.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["distance_meters"], 6)
        self.assertEqual(response.json()["duration_seconds"], 60)
        stops = response.json()["stops"]
        self.assertEqual(
            [stop["address_id"] for stop in stops],
            [
                self.start_address.id,
                second_delivery.id,
                first_delivery.id,
                self.end_address.id,
            ],
        )
        self.assertEqual(stops[1]["order_ids"], [second_order.id, third_order.id])
        self.assertEqual(stops[2]["order_ids"], [first_order.id])
        self.assertFalse(
            any(stop["address_id"] == skipped_address.id for stop in stops)
        )
        self.assertEqual(Route.objects.count(), 1)

    @patch("catering.services.route_optimization.get_road_matrix")
    def test_pending_address_without_coordinates_rejects_optimization(
        self,
        get_road_matrix,
    ):
        missing_address = Address.objects.create(
            street="ul. Bez Punktu 5",
            city="Warszawa",
            postal_code="00-005",
        )
        Order.objects.create(address=missing_address)

        response = self.client.post(
            self.optimize_url,
            {
                "start_address_id": self.start_address.id,
                "end_address_id": self.end_address.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["address_ids"], [missing_address.id])
        self.assertEqual(Route.objects.count(), 0)
        get_road_matrix.assert_not_called()

    @patch(
        "catering.services.route_optimization.get_road_matrix",
        side_effect=RoutingProviderError("OSRM is unavailable"),
    )
    def test_provider_failure_preserves_current_route(self, get_road_matrix):
        route = self.create_route()

        response = self.client.post(
            self.optimize_url,
            {
                "start_address_id": self.start_address.id,
                "end_address_id": self.end_address.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )
        self.assertEqual(Route.objects.count(), 1)
        self.assertEqual(Route.objects.get(), route)
        get_road_matrix.assert_called_once()
