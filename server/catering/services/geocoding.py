import hashlib
import json
import logging
import time
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

_not_found = "not-found"
_request_slot = "nominatim:request-slot"


@dataclass(frozen=True)
class Coordinates:
    latitude: Decimal
    longitude: Decimal


def _cache_key(query: str) -> str:
    provider_query = "|".join(
        (
            settings.NOMINATIM_BASE_URL,
            settings.NOMINATIM_COUNTRY_CODES,
            query.casefold(),
        )
    )
    digest = hashlib.sha256(provider_query.encode()).hexdigest()
    return f"nominatim:{digest}"


def _search(query: str) -> list[dict[str, object]]:
    params = {
        "q": query,
        "format": "jsonv2",
        "limit": 1,
        "countrycodes": settings.NOMINATIM_COUNTRY_CODES,
    }
    base_url = settings.NOMINATIM_BASE_URL.rstrip("/")
    url = f"{base_url}/search?{urlencode(params)}"
    request = Request(
        url,
        headers={
            "User-Agent": settings.NOMINATIM_USER_AGENT,
            "Accept": "application/json",
        },
    )

    while not cache.add(_request_slot, True, timeout=1):
        time.sleep(0.05)

    with urlopen(  # noqa: S310
        request,
        timeout=settings.NOMINATIM_TIMEOUT,
    ) as response:
        return json.load(response)


def geocode_address(
    *,
    street: str,
    city: str,
    postal_code: str,
) -> Coordinates | None:
    query = ", ".join(part.strip() for part in (street, postal_code, city))
    key = _cache_key(query)
    cached = cache.get(key)

    if cached == _not_found:
        return None

    if isinstance(cached, tuple):
        return Coordinates(
            latitude=Decimal(cached[0]),
            longitude=Decimal(cached[1]),
        )

    try:
        results = _search(query)
        if not results:
            cache.set(key, _not_found, settings.NOMINATIM_CACHE_TIMEOUT)
            return None

        coordinates = Coordinates(
            latitude=Decimal(str(results[0]["lat"])),
            longitude=Decimal(str(results[0]["lon"])),
        )
    except (
        HTTPError,
        URLError,
        TimeoutError,
        json.JSONDecodeError,
        InvalidOperation,
        KeyError,
        TypeError,
    ):
        logger.exception("Could not geocode address with Nominatim")
        return None

    cache.set(
        key,
        (str(coordinates.latitude), str(coordinates.longitude)),
        settings.NOMINATIM_CACHE_TIMEOUT,
    )
    return coordinates
