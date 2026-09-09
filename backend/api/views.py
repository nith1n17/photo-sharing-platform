from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied

from django.shortcuts import get_object_or_404
from uuid import uuid4

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Event, Photo, Gallery, GalleryPhoto

from .serializers import (
    UserSerializer,
    EventSerializer,
    EventMemberCreateSerializer,
    TeamMemberCreateSerializer,
    PhotoSerializer,
    GalleryCreateSerializer,
    GallerySerializer,
)

from .s3_service import upload_file


class MeView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"})
        except Exception:
            return Response(
                {"error": "Invalid refresh token"},
                status=400
            )


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can create events.")
        serializer.save(created_by=self.request.user)


class TeamMemberCreateView(generics.ListCreateAPIView):
    serializer_class = TeamMemberCreateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can view team members.")
        return User.objects.filter(role=User.Role.TEAM_MEMBER)

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can create team members.")
        serializer.save()


class EventMemberCreateView(generics.CreateAPIView):
    serializer_class = EventMemberCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can assign team members.")
        serializer.save()


class AssignedEventsView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != User.Role.TEAM_MEMBER:
            raise PermissionDenied("Only team members can access assigned events.")
        return Event.objects.filter(members__user=self.request.user).distinct()


class PhotoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, event_id):
        if request.user.role != User.Role.TEAM_MEMBER:
            raise PermissionDenied("Only team members can upload photos.")

        event = get_object_or_404(Event, id=event_id)
        if not event.members.filter(user=request.user).exists():
            raise PermissionDenied("You are not assigned to this event.")

        photo_files = request.FILES.getlist("photos")
        if not photo_files:
            return Response(
                {"error": "No photos uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        max_size = 10 * 1024 * 1024
        uploaded_photos = []

        for photo_file in photo_files:
            if photo_file.content_type not in allowed_types:
                return Response(
                    {"error": f"{photo_file.name}: Only JPEG, PNG and WebP images are allowed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if photo_file.size > max_size:
                return Response(
                    {"error": f"{photo_file.name}: Maximum file size is 10 MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            storage_key = f"events/{event.id}/{uuid4()}_{photo_file.name}"
            upload_file(photo_file, storage_key, photo_file.content_type)

            photo = Photo.objects.create(
                event=event,
                uploaded_by=request.user,
                filename=photo_file.name,
                storage_key=storage_key,
                file_size=photo_file.size,
            )
            uploaded_photos.append(photo)

        return Response(
            PhotoSerializer(uploaded_photos, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class EventPhotosView(generics.ListAPIView):
    serializer_class = PhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can view event photos.")

        event = get_object_or_404(
            Event,
            id=self.kwargs["event_id"],
            created_by=self.request.user,
        )
        return Photo.objects.filter(event=event)


class PhotoSelectionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, photo_id):
        if request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can select photos.")

        photo = get_object_or_404(
            Photo,
            id=photo_id,
            event__created_by=request.user,
        )
        photo.is_selected = request.data.get("is_selected", photo.is_selected)
        photo.save(update_fields=["is_selected"])
        return Response(PhotoSerializer(photo).data)


class GalleryCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        if request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can view galleries.")

        gallery = get_object_or_404(
            Gallery,
            event_id=event_id,
            event__created_by=request.user
        )
        return Response(GallerySerializer(gallery).data)

    def post(self, request, event_id):
        if request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can create galleries.")

        event = get_object_or_404(Event, id=event_id, created_by=request.user)
        selected_photos = Photo.objects.filter(event=event, is_selected=True)

        if not selected_photos.exists():
            return Response(
                {"error": "Select at least one photo before creating a gallery."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = GalleryCreateSerializer(
            data={"event": event.id, "pin": request.data.get("pin")}
        )
        serializer.is_valid(raise_exception=True)
        gallery = serializer.save()

        GalleryPhoto.objects.bulk_create([
            GalleryPhoto(gallery=gallery, photo=photo)
            for photo in selected_photos
        ])

        return Response(
            GallerySerializer(gallery).data,
            status=status.HTTP_201_CREATED
        )


class GalleryPublishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, gallery_id):
        if request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can publish galleries.")

        gallery = get_object_or_404(
            Gallery,
            id=gallery_id,
            event__created_by=request.user
        )

        if gallery.published:
            return Response(
                {"message": "Gallery is already published."},
                status=status.HTTP_200_OK
            )

        gallery.published = True
        from django.utils import timezone
        gallery.published_at = timezone.now()
        gallery.save(update_fields=["published", "published_at"])

        return Response(
            GallerySerializer(gallery).data,
            status=status.HTTP_200_OK
        )


class GalleryVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, gallery_token):
        gallery = get_object_or_404(
            Gallery,
            gallery_token=gallery_token,
            published=True
        )
        pin = request.data.get("pin")

        if not pin:
            return Response(
                {"error": "PIN is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.contrib.auth.hashers import check_password
        if not check_password(pin, gallery.pin_hash):
            return Response(
                {"error": "Invalid PIN."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        from django.core import signing
        access_token = signing.dumps({"gallery_token": gallery.gallery_token})

        return Response({
            "message": "PIN verified successfully.",
            "gallery_token": gallery.gallery_token,
            "access_token": access_token
        })


class PublicGalleryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, gallery_token):
        gallery = get_object_or_404(
            Gallery,
            gallery_token=gallery_token,
            published=True
        )
        access_token = request.headers.get("X-Gallery-Access-Token")

        if not access_token:
            return Response(
                {"error": "Gallery access denied. Enter the PIN first."},
                status=status.HTTP_403_FORBIDDEN
            )

        from django.core import signing
        from django.core.signing import BadSignature
        try:
            token_data = signing.loads(access_token, max_age=3600)
        except BadSignature:
            return Response(
                {"error": "Gallery access denied. Token expired or invalid."},
                status=status.HTTP_403_FORBIDDEN
            )

        if token_data.get("gallery_token") != gallery.gallery_token:
            return Response(
                {"error": "Gallery access denied."},
                status=status.HTTP_403_FORBIDDEN
            )

        photos = Photo.objects.filter(galleryphoto__gallery=gallery)
        return Response({
            "gallery_token": gallery.gallery_token,
            "photos": PhotoSerializer(photos, many=True).data
        })


class EventGalleryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        if request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can view galleries.")

        gallery = (
            Gallery.objects
            .filter(event_id=event_id, event__created_by=request.user)
            .order_by("-created_at")
            .first()
        )

        if not gallery:
            return Response(
                {"error": "No gallery found for this event."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(GallerySerializer(gallery).data)
