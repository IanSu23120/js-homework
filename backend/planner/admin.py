from django.contrib import admin

from .models import (
    Expense,
    RestaurantReview,
    ScheduleItem,
    Suggestion,
    Trip,
    TravelGroup,
)

admin.site.register(TravelGroup)
admin.site.register(Trip)
admin.site.register(ScheduleItem)
admin.site.register(Expense)
admin.site.register(Suggestion)
admin.site.register(RestaurantReview)
