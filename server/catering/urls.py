from rest_framework.routers import DefaultRouter

from .views import AddressViewSet, MealViewSet

router = DefaultRouter(trailing_slash=False)
router.register("addresses", AddressViewSet)
router.register("meals", MealViewSet)

urlpatterns = router.urls
