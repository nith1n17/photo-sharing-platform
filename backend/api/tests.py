from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import User, Event, Photo, Gallery, GalleryPhoto


class AuthenticationTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_admin_registration(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "testadmin",
                "email": "admin@test.com",
                "password": "TestPass123!"
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username="testadmin")
        self.assertEqual(user.role, User.Role.TEAM_MEMBER)


class AuthorizationTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username="admin",
            password="TestPass123!",
            role=User.Role.ADMIN
        )

        self.team_member = User.objects.create_user(
            username="member",
            password="TestPass123!",
            role=User.Role.TEAM_MEMBER
        )

        self.event = Event.objects.create(
            name="Test Event",
            description="Testing event",
            created_by=self.admin
        )

    def test_team_member_cannot_create_event(self):
        self.client.force_authenticate(user=self.team_member)

        response = self.client.post(
            "/api/events/",
            {
                "name": "Unauthorized Event",
                "description": "Should fail"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_team_member_only_sees_assigned_events(self):
        self.client.force_authenticate(user=self.team_member)

        response = self.client.get("/api/my-events/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_admin_sees_own_events(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/events/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class GalleryTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username="galleryadmin",
            password="TestPass123!",
            role=User.Role.ADMIN
        )

        self.team_member = User.objects.create_user(
            username="gallerymember",
            password="TestPass123!",
            role=User.Role.TEAM_MEMBER
        )

        self.event = Event.objects.create(
            name="Gallery Test Event",
            description="Gallery testing",
            created_by=self.admin
        )

        self.selected_photo = Photo.objects.create(
            event=self.event,
            uploaded_by=self.team_member,
            filename="selected.jpg",
            storage_key="events/test/selected.jpg",
            file_size=1000,
            is_selected=True
        )

        self.unselected_photo = Photo.objects.create(
            event=self.event,
            uploaded_by=self.team_member,
            filename="unselected.jpg",
            storage_key="events/test/unselected.jpg",
            file_size=1000,
            is_selected=False
        )

    def create_and_publish_gallery(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"/api/events/{self.event.id}/gallery/",
            {"pin": "1234"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        gallery = Gallery.objects.get(event=self.event)

        response = self.client.post(
            f"/api/galleries/{gallery.id}/publish/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        return gallery

    def test_gallery_requires_selected_photo(self):
        self.selected_photo.is_selected = False
        self.selected_photo.save()

        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"/api/events/{self.event.id}/gallery/",
            {"pin": "1234"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_gallery_creation_includes_only_selected_photos(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            f"/api/events/{self.event.id}/gallery/",
            {"pin": "1234"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        gallery = Gallery.objects.get(event=self.event)

        gallery_photos = GalleryPhoto.objects.filter(
            gallery=gallery
        )

        self.assertEqual(gallery_photos.count(), 1)
        self.assertEqual(
            gallery_photos.first().photo,
            self.selected_photo
        )

    def test_unpublished_gallery_cannot_be_verified(self):
        self.client.force_authenticate(user=self.admin)

        self.client.post(
            f"/api/events/{self.event.id}/gallery/",
            {"pin": "1234"},
            format="json"
        )

        gallery = Gallery.objects.get(event=self.event)

        response = self.client.post(
            f"/api/gallery/{gallery.gallery_token}/verify/",
            {"pin": "1234"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_wrong_pin_is_rejected(self):
        gallery = self.create_and_publish_gallery()

        self.client.force_authenticate(user=None)

        response = self.client.post(
            f"/api/gallery/{gallery.gallery_token}/verify/",
            {"pin": "9999"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_correct_pin_is_accepted(self):
        gallery = self.create_and_publish_gallery()

        self.client.force_authenticate(user=None)

        response = self.client.post(
            f"/api/gallery/{gallery.gallery_token}/verify/",
            {"pin": "1234"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertIn("access_token", response.data)

    def test_public_gallery_requires_access_token(self):
        gallery = self.create_and_publish_gallery()

        self.client.force_authenticate(user=None)

        response = self.client.get(
            f"/api/gallery/{gallery.gallery_token}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_public_gallery_returns_only_selected_photos(self):
        gallery = self.create_and_publish_gallery()

        self.client.force_authenticate(user=None)

        verify_response = self.client.post(
            f"/api/gallery/{gallery.gallery_token}/verify/",
            {"pin": "1234"},
            format="json"
        )

        self.assertEqual(
            verify_response.status_code,
            status.HTTP_200_OK
        )

        access_token = verify_response.data["access_token"]

        response = self.client.get(
            f"/api/gallery/{gallery.gallery_token}/",
            HTTP_X_GALLERY_ACCESS_TOKEN=access_token
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(
            len(response.data["photos"]),
            1
        )

        self.assertEqual(
            response.data["photos"][0]["id"],
            str(self.selected_photo.id)
        )