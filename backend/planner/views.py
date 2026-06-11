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

    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        group = self.get_object()
        if group.leader_id == request.user.id:
            return Response(
                {'detail': '群組創立者不能直接退出，請先移除群組或轉讓管理權。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        group.members.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        group = self.get_object()
        if group.leader_id != request.user.id:
            raise PermissionDenied('只有群組創立者可以管理成員。')

        member_id = request.data.get('member_id')
        if not member_id:
            return Response(
                {'detail': 'member_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if str(member_id) == str(group.leader_id):
            return Response(
                {'detail': '不能移除群組創立者。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            member = group.members.get(id=member_id)
        except User.DoesNotExist:
            return Response(
                {'detail': '找不到此群組成員。'},
                status=status.HTTP_404_NOT_FOUND,
            )

        group.members.remove(member)
        return Response(TravelGroupSerializer(group).data)

    def perform_update(self, serializer):
        if serializer.instance.leader_id != self.request.user.id:
            raise PermissionDenied('只有群組創立者可以修改群組。')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.leader_id != self.request.user.id:
            raise PermissionDenied('只有群組創立者可以解散群組。')
        instance.delete()


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
        queryset = Suggestion.objects.filter(
            trip__group__members=self.request.user,
        ).distinct()
        trip_id = self.request.query_params.get('trip')
        if trip_id:
            queryset = queryset.filter(trip_id=trip_id)
        return queryset

    def perform_create(self, serializer):
        trip = serializer.validated_data['trip']
        serializer.save(author=self.request.user, group=trip.group)

    def perform_update(self, serializer):
        suggestion = serializer.instance
        if (
            suggestion.author_id != self.request.user.id
            and suggestion.trip.group.leader_id != self.request.user.id
        ):
            raise PermissionDenied('只有提案者或群組創立者可以修改提案。')
        if suggestion.accepted:
            raise PermissionDenied('已接受的提案不能修改。')
        serializer.save()

    def perform_destroy(self, instance):
        if (
            instance.author_id != self.request.user.id
            and instance.trip.group.leader_id != self.request.user.id
        ):
            raise PermissionDenied('只有提案者或群組創立者可以刪除提案。')
        if instance.accepted:
            raise PermissionDenied('已接受的提案不能刪除。')
        instance.delete()

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        suggestion = self.get_object()
        if suggestion.accepted:
            return Response(
                {'detail': '此提案已加入正式行程。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if suggestion.voters.filter(id=request.user.id).exists():
            suggestion.voters.remove(request.user)
        else:
            suggestion.voters.add(request.user)

        return Response(self.get_serializer(suggestion).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        suggestion = self.get_object()
        if suggestion.trip.group.leader_id != request.user.id:
            raise PermissionDenied('只有群組創立者可以接受提案。')
        if suggestion.accepted:
            return Response(
                {'detail': '此提案已加入正式行程。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date = request.data.get('date')
        time = request.data.get('time') or None
        if not date:
            return Response(
                {'detail': 'date is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trip = suggestion.trip
        if not trip:
            return Response(
                {'detail': '此提案沒有對應旅程。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(date) < str(trip.start_date) or str(date) > str(trip.end_date):
            return Response(
                {'detail': '加入日期必須在旅程日期範圍內。'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        schedule_item = ScheduleItem.objects.create(
            trip=trip,
            date=date,
            time=time,
            title=suggestion.title,
            category=suggestion.category,
            note=suggestion.description,
            lat=suggestion.lat,
            lng=suggestion.lng,
            creator=request.user,
        )
        suggestion.accepted = True
        suggestion.accepted_schedule_item = schedule_item
        suggestion.save(update_fields=['accepted', 'accepted_schedule_item'])

        return Response(self.get_serializer(suggestion).data)


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
