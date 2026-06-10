import secrets
import uuid
from django.conf import settings
from django.db import models

CATEGORY_CHOICES = [
    ('景點', '景點'),
    ('餐廳', '餐廳'),
    ('交通', '交通'),
    ('住宿', '住宿'),
    ('其他', '其他'),
]

EXPENSE_CATEGORY_CHOICES = [
    ('機票', '機票'),
    ('住宿', '住宿'),
    ('餐飲', '餐飲'),
    ('交通', '交通'),
    ('購物', '購物'),
    ('門票', '門票'),
    ('其他', '其他'),
]

CURRENCY_CHOICES = [
    ('JPY', 'JPY'),
    ('TWD', 'TWD'),
    ('USD', 'USD'),
    ('EUR', 'EUR'),
]


class TravelGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=140)
    invite_code = models.CharField(max_length=12, unique=True, blank=True)
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='led_groups',
        on_delete=models.CASCADE,
    )
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='travel_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = self._generate_invite_code()
        super().save(*args, **kwargs)

    def _generate_invite_code(self):
        code = secrets.token_urlsafe(8).replace('_', '').replace('-', '')[:12].upper()
        while TravelGroup.objects.filter(invite_code=code).exists():
            code = secrets.token_urlsafe(8).replace('_', '').replace('-', '')[:12].upper()
        return code

    def __str__(self):
        return self.name


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='trips',
        on_delete=models.CASCADE,
    )
    group = models.ForeignKey(
        TravelGroup,
        related_name='trips',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=180)
    destination = models.CharField(max_length=120)
    start_date = models.DateField()
    end_date = models.DateField()
    cover_color = models.CharField(max_length=7, default='#2F80ED')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ScheduleItem(models.Model):
    trip = models.ForeignKey(
        Trip,
        related_name='schedule_items',
        on_delete=models.CASCADE,
    )
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    title = models.CharField(max_length=180)
    category = models.CharField(max_length=24, choices=CATEGORY_CHOICES, default='景點')
    note = models.TextField(blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='created_schedule_items',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.title} ({self.date})'


class ScheduleItemComment(models.Model):
    schedule_item = models.ForeignKey(
        ScheduleItem,
        related_name='comments',
        on_delete=models.CASCADE,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='schedule_item_comments',
        on_delete=models.CASCADE,
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.author}: {self.content[:40]}'


class Expense(models.Model):
    trip = models.ForeignKey(
        Trip,
        related_name='expenses',
        on_delete=models.CASCADE,
    )
    schedule_item = models.ForeignKey(
        ScheduleItem,
        related_name='expenses',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='expenses_paid',
        on_delete=models.CASCADE,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='JPY')
    category = models.CharField(max_length=24, choices=EXPENSE_CATEGORY_CHOICES, default='其他')
    date = models.DateField()
    note = models.TextField(blank=True)
    shared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.amount} {self.currency} - {self.category}'


class Suggestion(models.Model):
    group = models.ForeignKey(
        TravelGroup,
        related_name='suggestions',
        on_delete=models.CASCADE,
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='suggestions',
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=24, choices=CATEGORY_CHOICES, default='景點')
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.title} by {self.author}'


class RestaurantReview(models.Model):
    trip = models.ForeignKey(
        Trip,
        related_name='reviews',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='restaurant_reviews',
        on_delete=models.CASCADE,
    )
    restaurant_name = models.CharField(max_length=180)
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True)
    recommended_dish = models.CharField(max_length=120, blank=True)
    visited_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.restaurant_name} ({self.rating}/5)'
