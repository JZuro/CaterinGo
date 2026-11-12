import django.db.models.deletion
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import migrations, models


DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo1234"


def assign_existing_data_to_demo(apps, schema_editor):
    app_label, model_name = settings.AUTH_USER_MODEL.split(".")
    User = apps.get_model(app_label, model_name)
    demo, _ = User.objects.get_or_create(username=DEMO_USERNAME)
    demo.password = make_password(DEMO_PASSWORD)
    demo.save(update_fields=("password",))

    for model_name in ("Address", "Meal", "Order", "Route"):
        model = apps.get_model("catering", model_name)
        model.objects.filter(user__isnull=True).update(user=demo)

    Address = apps.get_model("catering", "Address")
    Meal = apps.get_model("catering", "Meal")
    Order = apps.get_model("catering", "Order")
    OrderItem = apps.get_model("catering", "OrderItem")
    Route = apps.get_model("catering", "Route")

    if any(
        model.objects.filter(user=demo).exists()
        for model in (Address, Meal, Order, Route)
    ):
        return

    addresses = [
        Address.objects.create(
            user=demo,
            street="Krakowska 5",
            city="Kraków",
            postal_code="31-062",
            latitude="50.051012",
            longitude="19.941702",
        ),
        Address.objects.create(
            user=demo,
            street="Kijowska 5",
            city="Kraków",
            postal_code="30-079",
            latitude="50.070109",
            longitude="19.913842",
        ),
        Address.objects.create(
            user=demo,
            street="Balicka 12b",
            city="Kraków",
            postal_code="30-149",
            latitude="50.081757",
            longitude="19.885383",
        ),
        Address.objects.create(
            user=demo,
            street="Josepha Conrada 66",
            city="Kraków",
            postal_code="31-357",
            latitude="50.089481",
            longitude="19.897564",
        ),
    ]
    meals = [
        Meal.objects.create(user=demo, name="Sport"),
        Meal.objects.create(user=demo, name="Sport Plus"),
    ]
    orders = [
        Order.objects.create(user=demo, address=addresses[2], status="pending"),
        Order.objects.create(user=demo, address=addresses[0], status="pending"),
        Order.objects.create(user=demo, address=addresses[3], status="pending"),
        Order.objects.create(user=demo, address=addresses[1], status="pending"),
    ]
    for order, meal, quantity in (
        (orders[0], meals[0], 2),
        (orders[1], meals[0], 2),
        (orders[2], meals[1], 2),
        (orders[3], meals[1], 1),
    ):
        OrderItem.objects.create(order=order, meal=meal, quantity=quantity)

    order_ids = {
        address.id: [order.id for order in orders if order.address_id == address.id]
        for address in addresses
    }
    stops = []
    for position, address in enumerate(addresses):
        kind = "delivery"
        if position == 0:
            kind = "start"
        elif position == len(addresses) - 1:
            kind = "end"

        stops.append(
            {
                "position": position,
                "kind": kind,
                "address_id": address.id,
                "label": (
                    f"{address.street}, {address.postal_code} {address.city}"
                ),
                "street": address.street,
                "apartment": address.apartment,
                "city": address.city,
                "postal_code": address.postal_code,
                "latitude": str(address.latitude),
                "longitude": str(address.longitude),
                "order_ids": order_ids[address.id],
            }
        )

    Route.objects.create(
        user=demo,
        start=stops[0],
        end=stops[-1],
        stops=stops,
        distance_meters=9737,
        duration_seconds=1062,
    )


class Migration(migrations.Migration):
    # The data migration creates and updates rows before the user foreign keys
    # become non-nullable. PostgreSQL must commit those writes before altering
    # the related tables, otherwise their constraint triggers are still pending.
    atomic = False

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("catering", "0007_route"),
    ]

    operations = [
        migrations.AddField(
            model_name="address",
            name="user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="addresses",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="meal",
            name="user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="meals",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="orders",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="route",
            name="user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="routes",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="meal",
            name="name",
            field=models.CharField(max_length=35),
        ),
        migrations.RunPython(
            assign_existing_data_to_demo,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="address",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="addresses",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="meal",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="meals",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="orders",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="route",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="routes",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddConstraint(
            model_name="meal",
            constraint=models.UniqueConstraint(
                fields=("user", "name"),
                name="unique_meal_name_per_user",
            ),
        ),
    ]
