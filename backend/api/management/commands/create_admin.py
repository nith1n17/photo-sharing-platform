import os
from django.core.management.base import BaseCommand
from api.models import User


class Command(BaseCommand):
    help = "Create the initial admin user"

    def handle(self, *args, **kwargs):
        username = os.getenv("ADMIN_USERNAME")
        password = os.getenv("ADMIN_PASSWORD")
        email = os.getenv("ADMIN_EMAIL", "")

        if not username or not password:
            self.stdout.write("Admin credentials not configured. Skipping.")
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(f"Admin '{username}' already exists.")
            return

        User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=User.Role.ADMIN,
            is_staff=True,
        )

        self.stdout.write(
            self.style.SUCCESS(f"Admin '{username}' created successfully.")
        )