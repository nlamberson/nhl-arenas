![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/nlamberson/nhl-arenas/backend-ci.yml?style=flat-square&logo=githubactions&label=Backend%20build&link=https%3A%2F%2Fgithub.com%2Fnlamberson%2Fnhl-arenas%2Factions%2Fworkflows%2Fbackend-ci.yml)
![Docker Image Version](https://img.shields.io/docker/v/nlamberson/nhl-arenas-api?style=flat-square&logo=docker&label=Latest%20Image&link=https%3A%2F%2Fhub.docker.com%2Frepository%2Fdocker%2Fnlamberson%2Fnhl-arenas-api%2Fgeneral&color=2496ED)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/nlamberson/nhl-arenas/backend-cd.yml?style=flat-square&logo=githubactions&label=Backend%20deploy&link=https%3A%2F%2Fgithub.com%2Fnlamberson%2Fnhl-arenas%2Factions%2Fworkflows%2Fbackend-cd.yml)

# NHL Arenas

Mobile application for logging my visits to NHL arenas! I'm trying to model this off the MLB Ballpark app where you can log games and visits, keeping track of teams seen, ballparks visited, and more. I want that same experience for NHL fans like myself so working to make it.

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

### How to Run

Coming soon...

## Project Structure

```text
nhl-arenas/
├── backend/           # FastAPI backend
│   ├── app/           # Application code
│   ├── alembic/       # Database migrations
│   └── Dockerfile
├── frontend/          # Expo SDK 56 + Expo Router + NativeWind v4
│   └── app/           # File-based routes
├── ENV_SETUP.md       # Environment variable reference
└── README.md
```
