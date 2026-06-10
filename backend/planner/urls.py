from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CurrentUserView,
    ExpenseViewSet,
    RegisterView,
    RestaurantReviewViewSet,
    ScheduleItemCommentViewSet,
    ScheduleItemViewSet,
    SuggestionViewSet,
    TripViewSet,
    TravelGroupViewSet,
)

router = DefaultRouter()
router.register('trips', TripViewSet, basename='trip')
router.register('schedule-items', ScheduleItemViewSet, basename='scheduleitem')
router.register('schedule-item-comments', ScheduleItemCommentViewSet, basename='scheduleitemcomment')
router.register('expenses', ExpenseViewSet, basename='expense')
router.register('reviews', RestaurantReviewViewSet, basename='review')
router.register('suggestions', SuggestionViewSet, basename='suggestion')
router.register('groups', TravelGroupViewSet, basename='group')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('', include(router.urls)),
]
