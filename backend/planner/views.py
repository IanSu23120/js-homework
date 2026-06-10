from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Expense,
    RestaurantReview,
    ScheduleItem,
    ScheduleItemComment,
    Suggestion,
    Trip,
    TravelGroup,
)
from .serializers import (
    ExpenseSerializer,
    RegisterSerializer,
    RestaurantReviewSerializer,
    ScheduleItemCommentSerializer,
    ScheduleItemSerializer,
    SuggestionSerializer,
    TripSerializer,
    TravelGroupSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class TravelGroupViewSet(viewsets.ModelViewSet):
    serializer_class = TravelGroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TravelGroup.objects.filter(members=self.request.user).distinct()

    def perform_create(self, serializer):
        group = serializer.save(leader=self.request.user)
        group.members.add(self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request):
        invite_code = request.data.get('invite_code')
        if not invite_code:
            return Response({'detail': 'Invite code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group = TravelGroup.objects.get(invite_code=invite_code)
        except TravelGroup.DoesNotExist:
            return Response({'detail': 'Invalid invite code.'}, status=status.HTTP_404_NOT_FOUND)

        group.members.add(request.user)
        return Response(TravelGroupSerializer(group).data)


class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(Q(owner=self.request.user) | Q(group__members=self.request.user)).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.owner_id != self.request.user.id:
            raise PermissionDenied('只有行程建立者可以修改分享設定。')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner_id != self.request.user.id:
            raise PermissionDenied('只有行程建立者可以刪除行程。')
        instance.delete()


class ScheduleItemViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ScheduleItem.objects.filter(trip__in=self.get_trip_queryset())

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def get_trip_queryset(self):
        return Trip.objects.filter(Q(owner=self.request.user) | Q(group__members=self.request.user)).distinct()


class ScheduleItemCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleItemCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ScheduleItemComment.objects.filter(
            schedule_item__trip__in=self.get_trip_queryset(),
        ).select_related('author')

    def perform_create(self, serializer):
        schedule_item = serializer.validated_data['schedule_item']
        if not self.get_trip_queryset().filter(id=schedule_item.trip_id).exists():
            raise PermissionDenied('你無法在此行程新增備註。')
        serializer.save(author=self.request.user)

    def get_trip_queryset(self):
        return Trip.objects.filter(
            Q(owner=self.request.user) | Q(group__members=self.request.user),
        ).distinct()


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(trip__in=self.get_trip_queryset())

    def perform_create(self, serializer):
        serializer.save(payer=self.request.user)

    def get_trip_queryset(self):
        return Trip.objects.filter(Q(owner=self.request.user) | Q(group__members=self.request.user)).distinct()


class SuggestionViewSet(viewsets.ModelViewSet):
    serializer_class = SuggestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Suggestion.objects.filter(group__members=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class RestaurantReviewViewSet(viewsets.ModelViewSet):
    serializer_class = RestaurantReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RestaurantReview.objects.filter(
            Q(trip__owner=self.request.user)
            | Q(reviewer=self.request.user)
            | Q(trip__group__members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
