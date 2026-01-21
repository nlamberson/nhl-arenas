#!/bin/bash
# Startup script for production deployment

set -e  # Exit on error

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8100
