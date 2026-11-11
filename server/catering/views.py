from django.contrib.auth import authenticate
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Address, Meal, Order, Route
from .serializers import (
    AddressSerializer,
    LoginSerializer,
    MealSerializer,
    OrderSerializer,
    RouteOptimizationRequestSerializer,
    RouteSerializer,
    SignupSerializer,
    UserSerializer,
)
from .services.route_optimization import (
    MissingCoordinatesError,
    RouteOptimizationError,
    optimize_route,
)
from .services.routing import RoutingProviderError


def _authentication_response(user, response_status=status.HTTP_200_OK):
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "user": UserSerializer(user).data,
        },
        status=response_status,
    )


class SignupView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "auth"

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return _authentication_response(user, status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(request=request, **serializer.validated_data)

        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return _authentication_response(user)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by("id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MealViewSet(viewsets.ModelViewSet):
    serializer_class = MealSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Meal.objects.filter(user=self.request.user).order_by("id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .select_related("address")
            .prefetch_related("items__meal")
            .order_by("id")
        )


class CurrentRouteView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        route = (
            Route.objects.filter(user=request.user)
            .order_by("-created_at", "-id")
            .first()
        )

        if route is None:
            return Response(
                {"detail": "No route has been optimized yet."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(RouteSerializer(route).data)


class RouteOptimizationView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = RouteOptimizationRequestSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        try:
            route = optimize_route(
                user=request.user,
                **serializer.validated_data,
            )
        except MissingCoordinatesError as error:
            return Response(
                {
                    "detail": str(error),
                    "address_ids": error.address_ids,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except RoutingProviderError:
            return Response(
                {"detail": "Could not retrieve road distances."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except RouteOptimizationError as error:
            return Response(
                {"detail": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            RouteSerializer(route).data,
            status=status.HTTP_201_CREATED,
        )
