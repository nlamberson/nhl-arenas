# NHL Arenas Backend

FastAPI backend for the NHL Arenas app with Firebase Authentication.

## Quick Start

```bash
# 1. Setup virtual environment
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your FIREBASE_PROJECT_ID and database credentials

# 3. Run migrations
alembic upgrade head

# 4. Start server
uvicorn app.main:app --reload
```

Visit http://localhost:8000/docs for API documentation.

## Environment Variables

Create `backend/.env` from the template:

```bash
# Required
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Database (auto-constructs DATABASE_URL)
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=nhl_arenas
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Optional
LOG_LEVEL=INFO
CORS_ORIGINS=*
```

### Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service accounts
2. Click "Generate new private key"
3. Save as `backend/firebase-service-account.json`

## Project Structure

```
app/
├── core/           # Config, Firebase, authentication
├── models/         # SQLAlchemy database models
├── routers/        # API endpoint routes
├── services/       # Business logic layer
└── db/             # Database configuration
```

## Authentication

All authenticated endpoints require a Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```


## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Docker

```bash
# Build and run with Docker Compose (from project root)
docker-compose up

# Or build standalone
docker build -t nhl-arenas-backend .
docker run -p 8000:8000 -e FIREBASE_PROJECT_ID=your-id nhl-arenas-backend
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment options including:
- Google Cloud Run
- Railway / Render
- AWS ECS
- Docker on VMs
