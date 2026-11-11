from django.contrib import admin

from .models import Address, Meal, Order, OrderItem


admin.site.register([Address, Meal, Order, OrderItem])
