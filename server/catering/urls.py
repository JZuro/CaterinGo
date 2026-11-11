from rest_framework.routers import DefaultRouter

from .views import AddressViewSet

router = DefaultRouter(trailing_slash=False)
router.register("addresses", AddressViewSet)

urlpatterns = router.urls
