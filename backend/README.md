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

# 4. Seed reference data (teams from nhl-api-py, arenas from app/data/arenas.json)
python -m app.scripts.seed_reference_data

# 5. Start server
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

```text
Authorization: Bearer <firebase-id-token>
```

## Reference Data (Teams & Arenas)

Teams and arenas are populated by a seed script (not migrations). After `alembic upgrade head`, run:

```bash
python -m app.scripts.seed_reference_data
```

- **Teams:** Fetched from [nhl-api-py](https://github.com/coreyjs/nhl-api-py) (NHL API). Re-run to sync name/city changes.
- **Arenas:** Loaded from `app/data/arenas.json` (keyed by team abbreviation). Edit that file to add or update venues.

View DB Data with the following nhl-arenas APIs: `GET /api/v1/teams`, `GET /api/v1/arenas`.

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
