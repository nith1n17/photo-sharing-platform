# PhotoShare

A full-stack event photo management and gallery publishing platform built for photographers and event teams. PhotoShare handles the complete workflow from event creation and team assignment to multi-photo upload, admin review, gallery publishing, PIN-protected customer access, and private cloud photo storage.

## Live Demo

- **Frontend:** https://photo-sharing-platform-ochre.vercel.app
- **Backend API:** https://photo-sharing-platform-9145.onrender.com
- **Repository:** https://github.com/nith1n17/photo-sharing-platform

> The production frontend is deployed on Vercel and the Django REST API is deployed on Render.

---

## Overview

PhotoShare separates the application into three user experiences:

- **Admin** — manages events, team members, uploaded photos, photo selection, and gallery publishing.
- **Team Member** — works only with assigned events and uploads photos.
- **Customer** — does not create an account; receives a gallery URL and PIN and views the published photos.

The core workflow is:

```text
Admin creates event
        ↓
Admin creates + assigns Team Member
        ↓
Team Member uploads photos
        ↓
Admin reviews uploaded photos
        ↓
Admin selects photos
        ↓
Admin creates gallery + PIN
        ↓
Admin publishes gallery
        ↓
Shareable gallery URL + PIN
        ↓
Customer verifies PIN
        ↓
Customer views published photos
```

---

## Features

### Admin

- JWT-based login
- Create events
- Create Team Member accounts
- Assign Team Members to events
- View photos uploaded to owned events
- Select/deselect individual photos
- Select all / deselect all photos
- Create galleries from selected photos
- Set a 4–6 digit gallery PIN
- Publish galleries
- Generate unique shareable gallery links
- Copy the published gallery URL

### Team Member

- JWT-based login
- View assigned events
- Upload multiple photos in one request
- Upload JPEG, PNG, and WebP images
- Maximum upload size of 10 MB per image
- Access only events to which the member is assigned

### Customer

- No account required
- Access gallery through a unique shareable URL
- Verify the gallery using a PIN
- View only photos included in the published gallery
- Open individual photos in a fullscreen viewer
- Navigate between photos using previous/next controls or keyboard arrows
- Close the fullscreen viewer with Escape

---

## Screenshots

The following screenshots document the main application flows.

> **Add the images to `docs/screenshots/` using the filenames below. The image lines are intentionally left ready to uncomment after the files are added to the repository.**

### Landing Page

The public landing page introduces the platform and provides the login entry point.

**ADD IMAGE: `docs/screenshots/home.png`**

<!-- ![PhotoShare Landing Page](docs/screenshots/home.png) -->

### Login

Users authenticate through the JWT login flow. The interface also provides password visibility controls and role-based redirection after authentication.

**ADD IMAGE: `docs/screenshots/login.png`**

<!-- ![PhotoShare Login](docs/screenshots/login.png) -->

### Admin Dashboard

The Admin dashboard contains event creation, Team Member creation, event assignment, event listing, and photo management.

**ADD IMAGE: `docs/screenshots/admin-dashboard.png`**

<!-- ![Admin Dashboard](docs/screenshots/admin-dashboard.png) -->

### Admin Photo Review & Selection

Admins can review uploaded photos for an event and select the images that should be included in the customer gallery.

**ADD IMAGE: `docs/screenshots/admin-photo-selection.png`**

<!-- ![Admin Photo Selection](docs/screenshots/admin-photo-selection.png) -->

### Gallery Creation & Publishing

After selecting photos, the Admin supplies a gallery PIN, creates the gallery, and publishes it. The UI then exposes the gallery token and shareable URL.

**ADD IMAGE: `docs/screenshots/gallery-publishing.png`**

<!-- ![Gallery Publishing](docs/screenshots/gallery-publishing.png) -->

### Team Member Dashboard

Team Members see their assigned events and can upload multiple photos to an event.

**ADD IMAGE: `docs/screenshots/team-dashboard.png`**

<!-- ![Team Member Dashboard](docs/screenshots/team-dashboard.png) -->

### Customer PIN Verification

A customer opens the shareable gallery URL and enters the gallery PIN before photos are returned by the API.

**ADD IMAGE: `docs/screenshots/gallery-pin.png`**

<!-- ![Gallery PIN Verification](docs/screenshots/gallery-pin.png) -->

### Published Gallery

After successful verification, the customer receives the selected gallery photos and can browse them through the responsive gallery and fullscreen viewer.

**ADD IMAGE: `docs/screenshots/published-gallery.png`**

<!-- ![Published Gallery](docs/screenshots/published-gallery.png) -->

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, JavaScript, React Router, Axios, Tailwind CSS, Vite |
| Backend | Python, Django 6.1.1, Django REST Framework |
| Authentication | djangorestframework-simplejwt |
| Database | PostgreSQL |
| Object Storage | Amazon S3 |
| AWS SDK | boto3 |
| Production Server | Gunicorn |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

---

## Architecture

```text
                         ┌──────────────────────────┐
                         │       React Frontend     │
                         │          Vercel          │
                         └────────────┬─────────────┘
                                      │
                                HTTPS / REST
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │     Django REST API      │
                         │          Render          │
                         │                          │
                         │ JWT Authentication       │
                         │ Role Authorization       │
                         │ Event Management         │
                         │ Photo Management         │
                         │ Gallery Management       │
                         └──────────┬───────┬───────┘
                                    │       │
                         ┌──────────┘       └──────────┐
                         ▼                             ▼
                ┌─────────────────┐          ┌─────────────────┐
                │   PostgreSQL    │          │    Amazon S3    │
                │                 │          │                 │
                │ Users           │          │ Private images  │
                │ Events          │          │ Object storage  │
                │ Memberships     │          │                 │
                │ Photo metadata  │          └─────────────────┘
                │ Galleries       │
                │ Gallery photos  │
                └─────────────────┘
```

### Storage Design

Photo binaries are **not stored in PostgreSQL**.

PostgreSQL stores the photo metadata and its S3 storage key:

- Photo UUID
- Event
- Uploader
- Original filename
- Storage key
- File size
- Selection state
- Creation timestamp

The image itself is uploaded to the private S3 bucket.

---

## Data Model

The backend uses the following core models:

### User

Custom Django user model with two application roles:

- `ADMIN`
- `TEAM_MEMBER`

### Event

Represents a photography event and stores its owner, name, description, and timestamps.

### EventMember

Junction model mapping Team Members to the events they are assigned to.

### Photo

Stores photo metadata and the S3 object key. Each photo belongs to an event and records the user who uploaded it.

### Gallery

Represents a published or unpublished gallery and stores:

- Event
- Unique gallery token
- Hashed PIN
- Published state
- Publication timestamp

### GalleryPhoto

Junction model mapping selected photos to a gallery.

```text
User
 │
 ├───────────────┐
 ▼               ▼
Event         EventMember
 │               │
 ▼               ▼
Photo        Team Member
 │
 ▼
GalleryPhoto
 │
 ▼
Gallery
```

---

## Photo Upload Flow

```text
Team Member
     │
     │ Select multiple files
     ▼
React / Axios
     │
     │ multipart/form-data
     ▼
Django REST API
     │
     ├── Authenticate JWT
     ├── Check TEAM_MEMBER role
     ├── Check event assignment
     ├── Validate MIME type
     └── Validate file size
     │
     ▼
Amazon S3
     │
     └── events/<event_id>/<uuid>_<filename>
     │
     ▼
PostgreSQL
     │
     └── Store photo metadata + S3 key
```

Supported image types:

- JPEG
- PNG
- WebP

Maximum size:

- **10 MB per image**

---

## Photo Review & Gallery Flow

The Admin controls what becomes publicly visible.

```text
Uploaded Photos
      │
      ▼
Admin Review
      │
      ├── Select
      └── Deselect
      │
      ▼
Selected Photos
      │
      ▼
Create Gallery
      │
      ├── Generate unique gallery token
      ├── Hash PIN
      └── Map selected photos
      │
      ▼
Publish Gallery
      │
      ▼
Shareable URL
```

The API prevents gallery creation when no photos have been selected.

---

## Customer Gallery Security Flow

Customer gallery access is deliberately separated from authenticated application access.

```text
Customer
   │
   │ /gallery/<gallery_token>
   ▼
PIN Verification
   │
   │ POST /api/gallery/<token>/verify/
   ▼
Django
   │
   ├── Gallery exists?
   ├── Gallery published?
   └── PIN matches hash?
   │
   ▼
Signed Gallery Access Token
   │
   │ X-Gallery-Access-Token
   ▼
GET /api/gallery/<token>/
   │
   ├── Validate token
   ├── Validate token age
   └── Load gallery photos
   │
   ▼
Customer Gallery
```

The gallery access token is Django-signed and accepted for a maximum of **1 hour**.

Photo URLs returned by the API are generated as **S3 presigned GET URLs**, so the S3 bucket itself remains private.

---

## Security

PhotoShare implements several application-level security controls:

- JWT authentication for Admin and Team Member accounts.
- Role checks on protected API operations.
- Team Member access restricted to assigned events.
- Admin access restricted to events created by that Admin.
- Private S3 bucket for photo objects.
- S3 presigned URLs for controlled image retrieval.
- Gallery PINs stored using Django password hashing.
- Signed, time-limited gallery access tokens.
- File type validation.
- 10 MB per-file upload limit.
- Environment variables for secrets and cloud credentials.
- `.env` excluded from version control.

---

## API

Base production API:

`https://photo-sharing-platform-9145.onrender.com/api/`

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/login/` | Obtain JWT access/refresh tokens |
| POST | `/token/refresh/` | Refresh access token |
| GET | `/me/` | Get current authenticated user |
| POST | `/logout/` | Blacklist refresh token |

### Events & Team Members

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/events/` | List/create Admin-owned events |
| GET/POST | `/team-members/` | List/create Team Members |
| POST | `/event-members/` | Assign a Team Member to an event |
| GET | `/my-events/` | List events assigned to current Team Member |

### Photos

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/events/<event_id>/photos/upload/` | Upload multiple photos |
| GET | `/events/<event_id>/photos/` | Retrieve event photos for Admin review |
| PATCH | `/photos/<photo_id>/select/` | Select/deselect a photo |

### Galleries

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/events/<event_id>/gallery/` | Retrieve/create an event gallery |
| POST | `/galleries/<gallery_id>/publish/` | Publish a gallery |
| POST | `/gallery/<gallery_token>/verify/` | Verify customer PIN |
| GET | `/gallery/<gallery_token>/` | Retrieve protected published gallery |
| GET | `/events/<event_id>/gallery/` | Retrieve latest Admin-owned event gallery |

---

## Project Structure

```text
photo-sharing-platform/
│
├── backend/
│   ├── api/
│   │   ├── migrations/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── s3_service.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── TeamMemberDashboard.jsx
│   │   │   └── PublicGallery.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Local Development

### Prerequisites

- Python 3.x
- Node.js
- PostgreSQL
- AWS account with a private S3 bucket

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install
npm run dev
```

---

## Environment Variables

### Backend

Create the root `.env` using `.env.example` as the template.

```env
SECRET_KEY=
DEBUG=False
DATABASE_URL=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_REGION=

ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=
```

### Frontend

```env
VITE_API_BASE_URL=
```

**Never commit real credentials, AWS access keys, database URLs, or production secrets.**

---

## Testing

The backend includes automated tests for core functionality such as:

- Authentication
- Authorization
- Event/photo access
- Gallery publishing
- PIN verification
- Unpublished gallery protection
- Public gallery access control

Run the backend test suite:

```bash
cd backend
python manage.py test
```

The final project test run completed with:

```text
Found 10 test(s).
..........
Ran 10 tests
OK
```

---

## Deployment

### Frontend — Vercel

The Vite/React frontend is deployed to Vercel.

Production build:

```bash
npm run build
```

### Backend — Render

The Django API runs with Gunicorn:

```bash
gunicorn config.wsgi:application
```

### Database

PostgreSQL is used as the production relational database through the `DATABASE_URL` environment variable.

### Object Storage

Amazon S3 stores uploaded photo objects in a private bucket. boto3 handles upload, deletion, and presigned URL generation.

---

## Demo Information

### Admin Account

```text
Username: <ADD_DEMO_ADMIN_USERNAME>
Password: <ADD_DEMO_ADMIN_PASSWORD>
```

### Team Member Account

```text
Username: <ADD_DEMO_TEAM_MEMBER_USERNAME>
Password: <ADD_DEMO_TEAM_MEMBER_PASSWORD>
```

### Demo Gallery

```text
Gallery URL: <ADD_DEMO_GALLERY_URL>
Gallery PIN: <ADD_DEMO_GALLERY_PIN>
```

> Add demo credentials only if they are intended for evaluator access. Do not add personal credentials or cloud/service credentials.

---

## Current Scope

The current implementation covers the core required workflow:

**Authentication → Event Management → Team Assignment → Photo Upload → Admin Review → Photo Selection → Gallery Creation → PIN Verification → Gallery Publishing → Customer Photo Access**

Potential future extensions include:

- Image thumbnails/resizing
- Pagination or infinite scrolling
- Search and filtering
- Bulk photo management
- Photo downloads
- Gallery expiration
- CDN integration
- CI/CD automation

---

## AI-Assisted Development

AI tools were used during development for implementation guidance, debugging, code review, and documentation.

The deployed PhotoShare application does **not** depend on an LLM or generative-AI API at runtime.

---

## License

This project was developed as part of a technical internship engineering challenge.
