# Photo Sharing Platform

A full-stack photo-sharing and event gallery platform built for event teams to upload, review, select, publish, and securely share photos with customers.

## Features

### Admin / Lead
- Secure JWT login
- Create and manage events
- Create team members and assign them to events
- View uploaded event photos
- Select photos for publication
- Create and publish galleries
- Generate shareable gallery links with PIN protection

### Team Member
- Secure JWT login
- View assigned events
- Upload multiple photos
- View photos uploaded to assigned events
- Cannot publish galleries or manage other users' photos

### Customer
- No account required
- Access gallery through a shareable link
- Verify gallery using a PIN
- Browse published photos

## Tech Stack

**Frontend**
- React.js
- React Router
- Axios
- Tailwind CSS
- Vite

**Backend**
- Python
- Django
- Django REST Framework
- Simple JWT

**Database & Storage**
- PostgreSQL
- AWS S3 for private photo storage
- Boto3

## Architecture

```text
React Frontend
      |
      | REST API + JWT
      v
Django REST API
      |
      +------ PostgreSQL
      |
      +------ AWS S3 (Private Photos)
      |
      +------ Gallery PIN + Signed Access Token
```

Photo files are stored in private object storage. PostgreSQL stores photo metadata, event relationships, selections, and gallery information.

## Security

- JWT authentication
- Role-based authorization for Admin and Team Member actions
- Private AWS S3 bucket
- Presigned URLs for controlled photo access
- Hashed gallery PINs
- Time-limited signed gallery access tokens
- File type and file size validation
- Environment variables for secrets and credentials

## Project Structure

```text
photo-sharing-platform/
├── backend/
│   ├── api/
│   │   ├── migrations/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── s3_service.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── config/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── .env.example
└── README.md
```

## Local Setup

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

### Environment Variables

Create a `.env` file in the project root using `.env.example` as a template.

Do not commit `.env` or cloud credentials to GitHub.

## Testing

Run backend tests with:

```bash
cd backend
python manage.py test
```

The test suite covers authentication, authorization, photo access, gallery publishing, PIN verification, unpublished galleries, and protected public gallery access.

## Deployment

The application is designed to be deployable with a React hosting service for the frontend, a Django-compatible hosting service for the backend, managed PostgreSQL, and AWS S3 for photo storage.

## License

MIT License.
