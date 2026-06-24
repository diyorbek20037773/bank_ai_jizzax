from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.config import settings
from app.database import engine, Base
from app.models import user, branch, department, employee, category, asset, assignment, audit_log, request
from app.api import auth, branches, departments, employees, categories, assets, assignments, qrcode, audit_logs, statistics, upload, ai, requests

Base.metadata.create_all(bind=engine)

# Startup'da demo ma'lumotlarni yaratish (agar database bo'sh bo'lsa)
try:
    from app.seed import seed
    seed()
except Exception as e:
    print(f"Seed xatosi (e'tiborsiz qoldirildi): {e}")

# Demo akkaunt ismlarini har deployda kafolatlash (DB to'la bo'lsa ham)
try:
    from app.seed import ensure_demo_identity
    ensure_demo_identity()
except Exception as e:
    print(f"Demo identity xatosi (e'tiborsiz): {e}")

app = FastAPI(
    title=settings.APP_NAME,
    description="Bank ofisi aktivlarini boshqarish tizimi",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.QRCODE_DIR, exist_ok=True)

app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/api/qrcodes", StaticFiles(directory=settings.QRCODE_DIR), name="qrcodes")

app.include_router(auth.router)
app.include_router(branches.router)
app.include_router(departments.router)
app.include_router(employees.router)
app.include_router(categories.router)
app.include_router(assets.router)
app.include_router(assignments.router)
app.include_router(qrcode.router)
app.include_router(audit_logs.router)
app.include_router(statistics.router)
app.include_router(upload.router)
app.include_router(ai.router)
app.include_router(requests.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


# ─────────────────────────────────────────────
# Frontend (React SPA) ni shu servisning o'zidan tarqatamiz.
# Bu blok eng oxirida turishi shart — barcha /api/... va /docs
# yo'llari avval ro'yxatga olinadi va ustun bo'ladi.
# Docker build'da frontend /app/frontend_dist ga ko'chiriladi.
# ─────────────────────────────────────────────
FRONTEND_DIST = os.environ.get(
    "FRONTEND_DIST",
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"),
)
FRONTEND_DIST = os.path.abspath(FRONTEND_DIST)

if os.path.isdir(FRONTEND_DIST):
    _index = os.path.join(FRONTEND_DIST, "index.html")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Mavjud fayl bo'lsa (assets, favicon, ...) o'shani ber,
        # aks holda SPA uchun index.html (React Router client-side routing).
        candidate = os.path.abspath(os.path.join(FRONTEND_DIST, full_path))
        if (
            full_path
            and candidate.startswith(FRONTEND_DIST)
            and os.path.isfile(candidate)
        ):
            return FileResponse(candidate)
        return FileResponse(_index)
else:
    print(
        f"[startup] OGOHLANTIRISH: frontend_dist topilmadi ({FRONTEND_DIST}). "
        "Faqat API ishlaydi. Docker build orqali deploy qiling.",
        flush=True,
    )
