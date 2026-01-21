# NHL Arenas

Mobile application for logging my visits to NHL arenas! I'm trying to model this off the MLB Ballpark app where you can log games and visits, keeping track of teams seen, ballparks visited, and more. I want that same experience for NHL fans like myself so working to make it.

The below sections are AI generated and will get updated as I learn more about python and app development. Any feedback is of course greatly appreciated!

## Stack Overview

- **Frontend:** Expo/React Native (TypeScript), Firebase Auth
- **Backend:** FastAPI, SQLAlchemy 2.0, Alembic
- **Database:** PostgreSQL
- **Auth:** Firebase Authentication

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.13+
- PostgreSQL 14+
- Firebase project

### 1. Clone & Setup

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your values
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env  # Edit with Firebase config
npm start
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```bash
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=nhl_arenas
```

**Frontend** (`frontend/.env`):
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
# (other Firebase config)
```

### 3. Test Authentication

1. Sign up/in with the test screen
2. Click "Test Backend Authentication"
3. User should appear in your database!

## Docker

```bash
cp .env.example .env  # Edit with your values
docker-compose up
```

## Documentation

| Doc | Description |
|-----|-------------|
| [backend/README.md](./backend/README.md) | Backend setup & auth patterns |
| [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md) | Production deployment |
| [frontend/README.md](./frontend/README.md) | Frontend setup |
| [frontend/API_USAGE.md](./frontend/API_USAGE.md) | API client usage |
| [ENV_SETUP.md](./ENV_SETUP.md) | Detailed env var guide |
| [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) | Docker setup |
| [TESTING_AUTH.md](./TESTING_AUTH.md) | Auth troubleshooting |

## Project Structure

```
nhl-arenas/
├── backend/           # FastAPI backend
│   ├── app/           # Application code
│   ├── alembic/       # Database migrations
│   └── Dockerfile
├── frontend/          # Expo/React Native app
│   └── src/
├── docker-compose.yml
└── README.md
```
