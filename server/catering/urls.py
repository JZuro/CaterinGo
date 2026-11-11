from rest_framework.routers import DefaultRouter

from .views import AddressViewSet, MealViewSet, OrderViewSet

router = DefaultRouter()
router.register("addresses", AddressViewSet)
router.register("meals", MealViewSet)
router.register("orders", OrderViewSet)

urlpatterns = router.urls
