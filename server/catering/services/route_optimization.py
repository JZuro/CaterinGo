from itertools import permutations
from math import inf

from django.conf import settings

from ..models import Address, Order, Route
from .routing import Coordinate, RoadMatrix, get_road_matrix


class RouteOptimizationError(Exception):
    pass


class MissingCoordinatesError(RouteOptimizationError):
    def __init__(self, address_ids: list[int]):
        self.address_ids = address_ids
        super().__init__("Some delivery addresses have no coordinates")


def _path_total(
    path: tuple[int, ...],
    matrix: tuple[tuple[float | None, ...], ...],
) -> float:
    total = 0.0

    for current, following in zip(path, path[1:]):
        value = matrix[current][following]
        if value is None:
            return inf
        total += value

    return total


def _exact_path(matrix: RoadMatrix) -> tuple[int, ...]:
    end = len(matrix.distances) - 1
    middle = range(1, end)
    candidates = ((0, *order, end) for order in permutations(middle))
    path = min(
        candidates,
        key=lambda candidate: _path_total(candidate, matrix.distances),
    )

    if _path_total(path, matrix.distances) == inf:
        raise RouteOptimizationError("No drivable route connects all stops")

    return path


def _nearest_neighbour_path(matrix: RoadMatrix) -> tuple[int, ...]:
    end = len(matrix.distances) - 1
    unvisited = set(range(1, end))
    path = [0]

    while unvisited:
        current = path[-1]
        reachable: list[tuple[float, int]] = []

        for candidate in unvisited:
            distance = matrix.distances[current][candidate]
            if distance is not None:
                reachable.append((distance, candidate))

        if not reachable:
            raise RouteOptimizationError("No drivable route connects all stops")

        _, next_stop = min(reachable)
        path.append(next_stop)
        unvisited.remove(next_stop)

    path.append(end)
    result = tuple(path)

    if _path_total(result, matrix.distances) == inf:
        raise RouteOptimizationError("No drivable route connects all stops")

    return result


def _address_snapshot(
    address: Address,
    order_ids: list[int],
) -> dict[str, object]:
    street = (
        f"{address.street} {address.apartment}"
        if address.apartment
        else address.street
    )

    return {
        "address_id": address.id,
        "label": f"{street}, {address.postal_code} {address.city}",
        "street": address.street,
        "apartment": address.apartment,
        "city": address.city,
        "postal_code": address.postal_code,
        "latitude": str(address.latitude),
        "longitude": str(address.longitude),
        "order_ids": order_ids,
    }


def optimize_route(start_address: Address, end_address: Address) -> Route:
    orders_by_address: dict[int, list[int]] = {}
    delivery_addresses: dict[int, Address] = {}

    pending_orders = (
        Order.objects.filter(status=Order.Status.PENDING)
        .select_related("address")
        .order_by("id")
    )

    for order in pending_orders:
        orders_by_address.setdefault(order.address_id, []).append(order.id)
        delivery_addresses[order.address_id] = order.address

    delivery_addresses.pop(start_address.id, None)
    delivery_addresses.pop(end_address.id, None)

    addresses = [
        start_address,
        *sorted(delivery_addresses.values(), key=lambda address: address.id),
        end_address,
    ]
    missing_coordinates = [
        address.id
        for address in addresses
        if address.latitude is None or address.longitude is None
    ]
    if missing_coordinates:
        raise MissingCoordinatesError(sorted(set(missing_coordinates)))

    coordinates = [
        Coordinate(address.latitude, address.longitude)
        for address in addresses
        if address.latitude is not None and address.longitude is not None
    ]
    matrix = get_road_matrix(coordinates)

    delivery_count = len(addresses) - 2
    if delivery_count <= settings.ROUTE_EXACT_STOP_LIMIT:
        path = _exact_path(matrix)
    else:
        path = _nearest_neighbour_path(matrix)

    stops = []
    for position, address_index in enumerate(path):
        address = addresses[address_index]
        stop = _address_snapshot(
            address,
            orders_by_address.get(address.id, []),
        )
        stop["position"] = position

        if position == 0:
            stop["kind"] = "start"
        elif position == len(path) - 1:
            stop["kind"] = "end"
        else:
            stop["kind"] = "delivery"

        stops.append(stop)

    distance = _path_total(path, matrix.distances)
    duration = _path_total(path, matrix.durations)
    if distance == inf or duration == inf:
        raise RouteOptimizationError("No drivable route connects all stops")

    return Route.objects.create(
        start=stops[0],
        end=stops[-1],
        stops=stops,
        distance_meters=round(distance),
        duration_seconds=round(duration),
    )
