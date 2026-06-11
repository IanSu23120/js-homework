from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import ScheduleItem, Suggestion, TravelGroup, Trip

User = get_user_model()


class TravelGroupMemberManagementTests(APITestCase):
    def setUp(self):
        self.leader = User.objects.create_user(
            username='leader',
            password='password123',
        )
        self.member = User.objects.create_user(
            username='group-member',
            password='password123',
        )
        self.other_member = User.objects.create_user(
            username='other-member',
            password='password123',
        )
        self.group = TravelGroup.objects.create(
            name='Friends',
            leader=self.leader,
        )
        self.group.members.add(self.leader, self.member, self.other_member)

    def test_member_can_leave_group(self):
        self.client.force_authenticate(self.member)

        response = self.client.post(f'/api/groups/{self.group.id}/leave/')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(self.group.members.filter(id=self.member.id).exists())

    def test_leader_cannot_leave_group(self):
        self.client.force_authenticate(self.leader)

        response = self.client.post(f'/api/groups/{self.group.id}/leave/')

        self.assertEqual(response.status_code, 400)
        self.assertTrue(self.group.members.filter(id=self.leader.id).exists())

    def test_leader_can_remove_member(self):
        self.client.force_authenticate(self.leader)

        response = self.client.post(
            f'/api/groups/{self.group.id}/remove-member/',
            {'member_id': self.member.id},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(self.group.members.filter(id=self.member.id).exists())

    def test_member_cannot_remove_another_member(self):
        self.client.force_authenticate(self.member)

        response = self.client.post(
            f'/api/groups/{self.group.id}/remove-member/',
            {'member_id': self.other_member.id},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            self.group.members.filter(id=self.other_member.id).exists(),
        )


class SuggestionVotingTests(APITestCase):
    def setUp(self):
        self.leader = User.objects.create_user(
            username='proposal-leader',
            password='password123',
        )
        self.member = User.objects.create_user(
            username='proposal-member',
            password='password123',
        )
        self.group = TravelGroup.objects.create(
            name='Proposal Group',
            leader=self.leader,
        )
        self.group.members.add(self.leader, self.member)
        self.trip = Trip.objects.create(
            owner=self.leader,
            group=self.group,
            name='Seoul Trip',
            destination='Seoul',
            start_date='2026-08-01',
            end_date='2026-08-03',
        )
        self.suggestion = Suggestion.objects.create(
            group=self.group,
            trip=self.trip,
            author=self.member,
            title='景福宮',
            description='早上去比較不熱',
            category='景點',
            place_id='google-gyeongbokgung',
            lat=37.5796,
            lng=126.977,
        )

    def test_member_can_toggle_vote(self):
        self.client.force_authenticate(self.member)

        vote_response = self.client.post(
            f'/api/suggestions/{self.suggestion.id}/vote/',
        )
        unvote_response = self.client.post(
            f'/api/suggestions/{self.suggestion.id}/vote/',
        )

        self.assertEqual(vote_response.status_code, 200)
        self.assertEqual(vote_response.data['vote_count'], 1)
        self.assertTrue(vote_response.data['has_voted'])
        self.assertEqual(unvote_response.status_code, 200)
        self.assertEqual(unvote_response.data['vote_count'], 0)

    def test_leader_can_accept_suggestion_into_shared_trip(self):
        self.client.force_authenticate(self.leader)

        response = self.client.post(
            f'/api/suggestions/{self.suggestion.id}/accept/',
            {
                'date': '2026-08-02',
                'time': '09:30',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['accepted'])
        item = ScheduleItem.objects.get(source_suggestion=self.suggestion)
        self.assertEqual(item.trip, self.trip)
        self.assertEqual(item.title, '景福宮')
        self.assertEqual(str(item.date), '2026-08-02')
        self.assertEqual(item.lat, 37.5796)
        self.assertEqual(item.lng, 126.977)

    def test_member_cannot_accept_suggestion(self):
        self.client.force_authenticate(self.member)

        response = self.client.post(
            f'/api/suggestions/{self.suggestion.id}/accept/',
            {
                'date': '2026-08-02',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 403)


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
