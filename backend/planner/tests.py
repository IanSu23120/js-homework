from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import ScheduleItem, TravelGroup, Trip

User = get_user_model()


class TripGroupSharingTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', password='password123')
        self.member = User.objects.create_user(username='member', password='password123')
        self.group = TravelGroup.objects.create(name='Friends', leader=self.owner)
        self.group.members.add(self.owner, self.member)
        self.trip = Trip.objects.create(
            owner=self.owner,
            name='Taipei Trip',
            destination='Taipei',
            start_date='2026-07-01',
            end_date='2026-07-03',
        )

    def test_owner_can_share_and_unshare_trip(self):
        self.client.force_authenticate(self.owner)

        share_response = self.client.patch(
            f'/api/trips/{self.trip.id}/',
            {'group': str(self.group.id)},
            format='json',
        )
        self.assertEqual(share_response.status_code, 200)
        self.assertEqual(str(share_response.data['group']), str(self.group.id))

        unshare_response = self.client.patch(
            f'/api/trips/{self.trip.id}/',
            {'group': None},
            format='json',
        )
        self.assertEqual(unshare_response.status_code, 200)
        self.assertIsNone(unshare_response.data['group'])

    def test_group_member_cannot_change_or_delete_shared_trip(self):
        self.trip.group = self.group
        self.trip.save(update_fields=['group'])
        self.client.force_authenticate(self.member)

        update_response = self.client.patch(
            f'/api/trips/{self.trip.id}/',
            {'group': None},
            format='json',
        )
        delete_response = self.client.delete(f'/api/trips/{self.trip.id}/')

        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)


class CollaborationAttributionTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner', password='password123')
        self.member = User.objects.create_user(username='member', password='password123')
        self.group = TravelGroup.objects.create(name='Friends', leader=self.owner)
        self.group.members.add(self.owner, self.member)
        self.trip = Trip.objects.create(
            owner=self.owner,
            group=self.group,
            name='Taipei Trip',
            destination='Taipei',
            start_date='2026-07-01',
            end_date='2026-07-03',
        )
        self.schedule_item = ScheduleItem.objects.create(
            trip=self.trip,
            date='2026-07-01',
            title='Lunch',
            creator=self.owner,
        )
        self.client.force_authenticate(self.member)

    def test_comment_records_author(self):
        response = self.client.post(
            '/api/schedule-item-comments/',
            {
                'schedule_item': self.schedule_item.id,
                'content': '我想吃牛肉麵',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['author']['username'], self.member.username)

    def test_expense_records_payer(self):
        response = self.client.post(
            '/api/expenses/',
            {
                'trip': str(self.trip.id),
                'schedule_item': self.schedule_item.id,
                'amount': '180.00',
                'currency': 'TWD',
                'category': '餐飲',
                'date': '2026-07-01',
                'note': '午餐',
                'shared': False,
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['payer']['username'], self.member.username)
