# NHL Arenas Backend

This package contains the FastAPI backend for the NHL Arenas app.

## Getting Started

1. Create and activate a Python 3.13 virtual environment:

   ```sh
   python3.13 -m venv .venv
   source .venv/bin/activate
   ```

2. Upgrade pip and install dependencies:

   ```sh
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` (create it if it does not exist yet) and update the database URL and other secrets.
4. Run the development server:

   ```sh
   uvicorn app.main:app --reload
   ```

   After the environment is created once, future sessions only need:

   ```sh
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload
   ```

5. Run database migrations with Alembic:

   ```sh
   alembic upgrade head
   ```

Run `deactivate` to exit the virtual environment when you're finished working.

## Project Structure

- `app/` – FastAPI application modules (routers, models, configuration, database session management)
- `alembic/` – Alembic migration environment
- `alembic.ini` – Alembic configuration file
- `requirements.txt` – Python dependencies
