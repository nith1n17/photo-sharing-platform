from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    MeView,
    LogoutView,
    EventListCreateView,
    TeamMemberCreateView,
    EventMemberCreateView,
    AssignedEventsView,
    PhotoUploadView,
    EventPhotosView,
    PhotoSelectionView,
    GalleryCreateView,
    GalleryPublishView,
    GalleryVerifyView,
    PublicGalleryView,
    EventGalleryView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("events/", EventListCreateView.as_view(), name="events"),
    path("team-members/", TeamMemberCreateView.as_view(), name="team-member-create"),
    path(
    "event-members/",
    EventMemberCreateView.as_view(),
    name="event-member-create",
    ),
    path(
    "my-events/",
    AssignedEventsView.as_view(),
    name="my-events",
    ),
    path(
    "events/<uuid:event_id>/photos/upload/",
    PhotoUploadView.as_view(),
    name="photo-upload",
    ),
    path(
    "events/<uuid:event_id>/photos/",
    EventPhotosView.as_view(),
    name="event-photos",
    ),
    path(
    "photos/<uuid:photo_id>/select/",
    PhotoSelectionView.as_view(),
    name="photo-selection",
    ),
    path(
    "events/<uuid:event_id>/gallery/",
    GalleryCreateView.as_view(),
    name="gallery-create",
    ),
    path(
    "galleries/<uuid:gallery_id>/publish/",
    GalleryPublishView.as_view(),
    name="gallery-publish",
    ),
    path(
    "gallery/<str:gallery_token>/verify/",
    GalleryVerifyView.as_view(),
    name="gallery-verify",
    ),
    path(
    "gallery/<str:gallery_token>/",
    PublicGalleryView.as_view(),
    name="public-gallery",
    ),
    path(
    "events/<uuid:event_id>/gallery/",
    EventGalleryView.as_view(),
    name="event-gallery",
    ),
]