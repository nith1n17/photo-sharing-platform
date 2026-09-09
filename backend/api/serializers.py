from rest_framework import serializers
from .models import User, Event, EventMember, Photo, Gallery, GalleryPhoto


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]
        read_only_fields = ["id", "role"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            role=User.Role.TEAM_MEMBER,
        )


class EventSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Event
        fields = ["id", "name", "description", "created_by", "created_at", "updated_at"]


class EventMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = EventMember
        fields = ["id", "event", "user", "added_at"]


class PhotoSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = [
            "id",
            "event",
            "uploaded_by",
            "filename",
            "storage_key",
            "file_size",
            "is_selected",
            "image_url",
            "created_at",
        ]

    def get_image_url(self, obj):
        from .s3_service import generate_presigned_url
        return generate_presigned_url(obj.storage_key)


class GallerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Gallery
        fields = [
            "id",
            "event",
            "gallery_token",
            "published",
            "published_at",
            "created_at",
        ]


class GalleryPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryPhoto
        fields = ["id", "gallery", "photo"]

class TeamMemberCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            role=User.Role.TEAM_MEMBER,
        )

class EventMemberCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventMember
        fields = ["event", "user"]

    def validate_user(self, user):
        if user.role != User.Role.TEAM_MEMBER:
            raise serializers.ValidationError(
                "User must be a team member."
            )
        return user

class GalleryCreateSerializer(serializers.ModelSerializer):
    pin = serializers.CharField(write_only=True, min_length=4, max_length=6)

    class Meta:
        model = Gallery
        fields = ["event", "pin"]

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        import secrets

        pin = validated_data.pop("pin")

        gallery = Gallery.objects.create(
            event=validated_data["event"],
            gallery_token=secrets.token_urlsafe(16),
            pin_hash=make_password(pin),
        )

        return gallery