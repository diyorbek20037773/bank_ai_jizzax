# ─────────────────────────────────────────────
# 1-bosqich: frontend (React + Vite) ni build qilamiz
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /fe

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# VITE_API_BASE berilmaydi -> prod build relative "/api" ishlatadi (same-origin)
RUN npm run build

# ─────────────────────────────────────────────
# 2-bosqich: backend (FastAPI) + build qilingan frontend
# ─────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

COPY backend/ ./

# Frontend build natijasini backend ichiga ko'chiramiz
COPY --from=frontend /fe/dist ./frontend_dist
ENV FRONTEND_DIST=/app/frontend_dist

# Railway $PORT ni beradi (lokalda 8000 default)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
