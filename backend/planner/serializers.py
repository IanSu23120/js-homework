from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    Expense,
    RestaurantReview,
    ScheduleItem,
    ScheduleItemComment,
    Suggestion,
    Trip,
    TravelGroup,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        return user


class ScheduleItemCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = ScheduleItemComment
        fields = '__all__'
        read_only_fields = ['id', 'author', 'created_at']


class ScheduleItemSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    comments = ScheduleItemCommentSerializer(read_only=True, many=True)

    class Meta:
        model = ScheduleItem
        fields = '__all__'
        read_only_fields = ['id', 'creator', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    payer = UserSerializer(read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['id', 'payer', 'created_at']

    def validate(self, attrs):
        trip = attrs.get('trip') or getattr(self.instance, 'trip', None)
        schedule_item = attrs.get('schedule_item')

        if schedule_item and schedule_item.trip_id != getattr(trip, 'id', None):
            raise serializers.ValidationError({
                'schedule_item': '費用項目必須屬於同一個旅程。',
            })

        return attrs


class RestaurantReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)

    class Meta:
        model = RestaurantReview
        fields = '__all__'
        read_only_fields = ['id', 'reviewer', 'created_at']


class SuggestionSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Suggestion
        fields = '__all__'
        read_only_fields = ['id', 'author', 'accepted', 'created_at']


class TravelGroupSerializer(serializers.ModelSerializer):
    leader = UserSerializer(read_only=True)
    members = UserSerializer(read_only=True, many=True)

    class Meta:
        model = TravelGroup
        fields = '__all__'
        read_only_fields = ['id', 'leader', 'invite_code', 'created_at']


class TripSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    schedule_items = ScheduleItemSerializer(read_only=True, many=True)
    expenses = ExpenseSerializer(read_only=True, many=True)
    reviews = RestaurantReviewSerializer(read_only=True, many=True)

    class Meta:
        model = Trip
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate_group(self, value):
        request = self.context.get('request')
        if value and request and request.user not in value.members.all():
            raise serializers.ValidationError('你必須是群組成員才能將此旅程指派給該群組。')
        return value
