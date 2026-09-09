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
            return Response({"message": "Logged out successfully."})
        except Exception:
            return Response({"error": "Invalid refresh token."}, status=400)


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != User.Role.ADMIN:
            return Event.objects.none()
        return Event.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can create events.")
        serializer.save(created_by=self.request.user)


class TeamMemberCreateView(generics.CreateAPIView):
    serializer_class = TeamMemberCreateSerializer
    permission_classes = [IsAuthenticated]

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

        event = serializer.validated_data["event"]
        if event.created_by != self.request.user:
            raise PermissionDenied("You do not own this event.")

        serializer.save()


class AssignedEventsView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != User.Role.TEAM_MEMBER:
            return Event.objects.none()
        return Event.objects.filter(members__user=self.request.user)


class PhotoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    MAX_FILE_SIZE = 10 * 1024 * 1024
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

    def post(self, request, event_id):
        if request.user.role != User.Role.TEAM_MEMBER:
            raise PermissionDenied("Only team members can upload photos.")

        event = get_object_or_404(Event, id=event_id)
        if not event.members.filter(user=request.user).exists():
            raise PermissionDenied("You are not assigned to this event.")

        files = request.FILES.getlist("photos")
        if not files:
            return Response({"error": "No photos uploaded."}, status=400)

        uploaded = []
        for photo_file in files:
            if photo_file.content_type not in self.ALLOWED_TYPES:
                return Response(
                    {"error": f"Unsupported file type: {photo_file.content_type}."},
                    status=400,
                )

            if photo_file.size > self.MAX_FILE_SIZE:
                return Response(
                    {"error": f"{photo_file.name} exceeds the 10MB limit."},
                    status=400,
                )

            key = f"events/{event.id}/{uuid4()}_{photo_file.name}"
            upload_file(photo_file, key, photo_file.content_type)

            uploaded.append(
                Photo.objects.create(
                    event=event,
                    uploaded_by=request.user,
                    filename=photo_file.name,
                    storage_key=key,
                    file_size=photo_file.size,
                )
            )

        return Response(PhotoSerializer(uploaded, many=True).data, status=201)


class EventPhotosView(generics.ListAPIView):
    serializer_class = PhotoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != User.Role.ADMIN:
            return Photo.objects.none()
        return Photo.objects.filter(event__id=self.kwargs["event_id"], event__created_by=self.request.user)


class PhotoSelectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, photo_id):
        if request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can select photos.")

        photo = get_object_or_404(Photo, id=photo_id, event__created_by=request.user)
        photo.is_selected = not photo.is_selected
        photo.save(update_fields=["is_selected"])

        return Response({"id": str(photo.id), "is_selected": photo.is_selected})


class GalleryCreateView(generics.CreateAPIView):
    serializer_class = GalleryCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can create galleries.")

        event = get_object_or_404(Event, id=self.kwargs["event_id"], created_by=self.request.user)
        selected_photos = Photo.objects.filter(event=event, is_selected=True)
        if not selected_photos.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Select at least one photo before creating a gallery.")

        gallery = serializer.save(event=event)
        GalleryPhoto.objects.bulk_create(
            [GalleryPhoto(gallery=gallery, photo=photo) for photo in selected_photos]
        )


class GalleryPublishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, gallery_id):
        if request.user.role != User.Role.ADMIN:
            raise PermissionDenied("Only admins can publish galleries.")

        gallery = get_object_or_404(Gallery, id=gallery_id, event__created_by=request.user)
        from django.utils import timezone
        gallery.published = True
        gallery.published_at = timezone.now()
        gallery.save(update_fields=["published", "published_at"])

        return Response(GallerySerializer(gallery).data)


class GalleryVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, gallery_token):
        gallery = get_object_or_404(Gallery, gallery_token=gallery_token, published=True)
        pin = request.data.get("pin")
        if not pin:
            return Response({"error": "PIN is required."}, status=400)

        from django.contrib.auth.hashers import check_password
        if not check_password(pin, gallery.pin_hash):
            return Response({"error": "Invalid PIN."}, status=401)

        from django.core import signing
        access_token = signing.dumps({"gallery_token": gallery.gallery_token})
        return Response({
            "message": "PIN verified successfully.",
            "gallery_token": gallery.gallery_token,
            "access_token": access_token,
        })


class PublicGalleryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, gallery_token):
        gallery = get_object_or_404(Gallery, gallery_token=gallery_token, published=True)
        access_token = request.headers.get("X-Gallery-Access-Token")
        if not access_token:
            return Response({"error": "Gallery access denied. Enter the PIN first."}, status=403)

        from django.core import signing
        from django.core.signing import BadSignature
        try:
            token_data = signing.loads(access_token, max_age=3600)
        except BadSignature:
            return Response({"error": "Gallery access denied. Token expired or invalid."}, status=403)

        if token_data.get("gallery_token") != gallery.gallery_token:
            return Response({"error": "Gallery access denied."}, status=403)

        photos = Photo.objects.filter(galleryphoto__gallery=gallery)
        return Response({
            "gallery_token": gallery.gallery_token,
            "photos": PhotoSerializer(photos, many=True).data,
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
            return Response({"error": "No gallery found for this event."}, status=404)

        return Response(GallerySerializer(gallery).data)
