# NHL Arenas

Mobile application for logging my visits to NHL arenas! I'm trying to model this off the MLB Ballpark app where you can log games and visits, keeping track of teams seen, ballparks visited, and more. I want that same experience for NHL fans like myself so working to make it.

The below sections are AI generated and will get updated as I learn more about python and app development. Any feedback is of course greatly appreciated!

## Stack Overview

- **Frontend:** Expo-managed React Native (TypeScript), Firebase SDK (Auth & Storage), Axios
- **Backend:** FastAPI, SQLAlchemy 2.0, Alembic, psycopg[binary], python-dotenv, Pydantic
- **Database:** PostgreSQL
- **Authentication:** Firebase Authentication
- **Monorepo Layout:** Managed manually with separate `frontend/` and `backend/` packages

## Repository Structure

```
nhl-arenas/
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── .gitignore
└── README.md
```

## Local Development

### Prerequisites

- Node.js 20+ (latest LTS)
- npm or yarn
- Python 3.13+
- PostgreSQL 14+

### Frontend Setup

```sh
cd frontend
npm install
# start Expo dev server
npm start
```

### Backend Setup

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Database Migrations

```sh
cd backend
alembic upgrade head
```

### Environment Variables

- Copy `backend/.env.example` to `backend/.env` and update secrets.
- Create `frontend/.env` for Firebase configuration (API key, project ID, etc.).

## Next Steps

- Define SQLAlchemy models and initial Alembic migrations for arenas and visits.
- Integrate Firebase Authentication flows in the frontend and secure backend endpoints.
- Implement API routes for arenas, visits, and user profiles.
