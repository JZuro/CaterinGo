import hashlib
import json
import time
from dataclasses import dataclass
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache

_request_slot = "osrm:request-slot"


class RoutingProviderError(Exception):
    pass


@dataclass(frozen=True)
class Coordinate:
    latitude: Decimal
    longitude: Decimal


@dataclass(frozen=True)
class RoadMatrix:
    distances: tuple[tuple[float | None, ...], ...]
    durations: tuple[tuple[float | None, ...], ...]


def _coordinate_string(coordinates: list[Coordinate]) -> str:
    return ";".join(
        f"{coordinate.longitude},{coordinate.latitude}"
        for coordinate in coordinates
    )


def _cache_key(coordinate_string: str) -> str:
    request_identity = "|".join(
        (
            settings.OSRM_BASE_URL,
            settings.OSRM_PROFILE,
            coordinate_string,
        )
    )
    digest = hashlib.sha256(request_identity.encode()).hexdigest()
    return f"osrm:table:{digest}"


def _normalize_matrix(
    value: object,
    size: int,
) -> tuple[tuple[float | None, ...], ...]:
    if not isinstance(value, list) or len(value) != size:
        raise RoutingProviderError("OSRM returned an invalid matrix size")

    normalized_rows: list[tuple[float | None, ...]] = []

    for row in value:
        if not isinstance(row, list) or len(row) != size:
            raise RoutingProviderError("OSRM returned an invalid matrix row")

        normalized_row: list[float | None] = []
        for cell in row:
            if cell is None:
                normalized_row.append(None)
            elif isinstance(cell, int | float):
                normalized_row.append(float(cell))
            else:
                raise RoutingProviderError("OSRM returned an invalid matrix value")

        normalized_rows.append(tuple(normalized_row))

    return tuple(normalized_rows)


def _parse_matrix(data: dict[str, object], size: int) -> RoadMatrix:
    if data.get("code") != "Ok":
        raise RoutingProviderError(str(data.get("message", "OSRM request failed")))

    distances = data.get("distances")
    durations = data.get("durations")

    if distances is None or durations is None:
        raise RoutingProviderError("OSRM returned no distance matrix")

    return RoadMatrix(
        distances=_normalize_matrix(distances, size),
        durations=_normalize_matrix(durations, size),
    )


def get_road_matrix(coordinates: list[Coordinate]) -> RoadMatrix:
    if len(coordinates) < 2:
        raise ValueError("At least two coordinates are required")

    if len(coordinates) > settings.OSRM_MAX_COORDINATES:
        raise ValueError(
            f"At most {settings.OSRM_MAX_COORDINATES} coordinates are supported"
        )

    coordinate_string = _coordinate_string(coordinates)
    key = _cache_key(coordinate_string)
    cached = cache.get(key)

    if isinstance(cached, RoadMatrix):
        return cached

    base_url = settings.OSRM_BASE_URL.rstrip("/")
    url = (
        f"{base_url}/table/v1/{settings.OSRM_PROFILE}/{coordinate_string}?"
        + urlencode(
            {
                "annotations": "distance,duration",
                "skip_waypoints": "true",
            }
        )
    )
    request = Request(
        url,
        headers={
            "User-Agent": settings.OSRM_USER_AGENT,
            "Accept": "application/json",
        },
    )

    try:
        while not cache.add(_request_slot, True, timeout=1):
            time.sleep(0.05)

        with urlopen(  # noqa: S310
            request,
            timeout=settings.OSRM_TIMEOUT,
        ) as response:
            data = json.load(response)

        if not isinstance(data, dict):
            raise RoutingProviderError("OSRM returned an invalid response")

        matrix = _parse_matrix(data, len(coordinates))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RoutingProviderError("Could not retrieve routes from OSRM") from error

    cache.set(key, matrix, settings.OSRM_CACHE_TIMEOUT)
    return matrix
