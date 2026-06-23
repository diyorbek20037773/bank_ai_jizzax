import re

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# Railway/Heroku ba'zan "postgres://" sxemasini beradi — SQLAlchemy 2.0
# faqat "postgresql://" ni tushunadi. Avtomatik to'g'rilaymiz.
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Qaysi DB ga ulanayotganini logga chiqaramiz (parol yashiriladi).
# Agar bu yerda "localhost" ko'rinsa — DATABASE_URL env o'zgaruvchisi
# servisga ulanmagan (Railway'da ${{Postgres.DATABASE_URL}} qo'shilmagan).
_safe_url = re.sub(r"://([^:/@]+):[^@/]+@", r"://\1:****@", DATABASE_URL)
print(f"[startup] Database target: {_safe_url}", flush=True)
if "@localhost" in DATABASE_URL or "@127.0.0.1" in DATABASE_URL:
    print(
        "[startup] OGOHLANTIRISH: DATABASE_URL 'localhost' ga ishora qilyapti. "
        "Railway'da backend servisiga DATABASE_URL=${{Postgres.DATABASE_URL}} "
        "o'zgaruvchisini qo'shing.",
        flush=True,
    )

if DATABASE_URL.startswith("sqlite"):
    # SQLite pool argumentlarini qo'llab-quvvatlamaydi
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL — connection pooling + uzilgan ulanishlarni tekshirish
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
