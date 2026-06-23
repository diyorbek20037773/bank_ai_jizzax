# Bank Aktivlari Boshqaruv Tizimi (Bank Asset Management)

Bank ofisi aktivlarini (kompyuter, mebel, texnika va h.k.) ro'yxatga olish, xodimlarga
biriktirish, QR-kod orqali kuzatish va Gemini AI yordamida tahlil qilish tizimi.

- **Backend:** FastAPI + SQLAlchemy (PostgreSQL / SQLite), JWT auth, Gemini AI
- **Frontend:** React 19 + Vite + Ant Design + Recharts

---

## Loyiha tuzilishi

```
BANK/
├── backend/        # FastAPI REST API
│   ├── app/
│   │   ├── api/        # Endpoint'lar (auth, assets, ai, ...)
│   │   ├── core/       # security, dependencies, enums
│   │   ├── models/     # SQLAlchemy modellar
│   │   ├── schemas/    # Pydantic sxemalar
│   │   ├── services/   # Biznes logika (AI, QR, statistika)
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── seed.py     # Demo ma'lumotlar (bo'sh DB da avto ishlaydi)
│   ├── requirements.txt
│   ├── runtime.txt     # Python 3.11
│   ├── railway.json
│   └── Procfile
└── frontend/       # React + Vite SPA
    ├── src/
    ├── package.json
    ├── railway.json
    └── Procfile
```

---

## Lokal ishga tushirish

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate   |  Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # qiymatlarni to'ldiring (lokal uchun SQLite ham bo'ladi)
uvicorn app.main:app --reload
```

API: http://localhost:8000 — Swagger: http://localhost:8000/docs

> Lokalda tez sinash uchun `.env` da `DATABASE_URL=sqlite:///./bank_assets.db` qo'ying.
> `database.py` SQLite va PostgreSQL ni avtomatik farqlaydi.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_BASE=http://localhost:8000
npm run dev
```

Frontend: http://localhost:5173

---

## Railway'ga deploy (tavsiya: 1 ta servis — Docker)

Repo ildizida **`Dockerfile`** bor: u frontend'ni build qiladi va FastAPI o'sha
build'ni o'zi tarqatadi. Natija — **bitta servis, bitta domen, CORS yo'q**.

1. **New → Database → PostgreSQL** qo'shing.
2. **New → GitHub Repo** → shu repo. Railway ildizdagi `Dockerfile`ni avtomatik
   topadi (Root Directory'ni **bo'sh** / `/` qoldiring — `backend` EMAS).
3. **Variables:**

   | Kalit | Qiymat |
   |-------|--------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `SECRET_KEY` | uzun tasodifiy maxfiy kalit |
   | `GEMINI_API_KEY` | Gemini API kaliti |
   | `BASE_URL` | servis public URL (QR-kodlar uchun) |

   > `CORS_ORIGINS` va `VITE_API_BASE` **kerak emas** — frontend va API bitta domenda.
   > Ixtiyoriy: `GEMINI_API_KEY_2/3` rate-limit fallback uchun.

4. **Settings → Networking → Generate Domain.** Tayyor:
   - `/` → React ilova (login: `admin/admin123`)
   - `/api/health` → `{"status":"ok"}`, `/docs` → Swagger

Birinchi ishga tushishda bo'sh DB ga `seed.py` demo ma'lumotlarni to'ldiradi.

---

## Muqobil: 2 ta alohida servis

Frontend va backend'ni mustaqil scale qilmoqchi bo'lsangiz, har biriga
**Root Directory** belgilab 2 ta servis qiling.

### 1. PostgreSQL qo'shish

Railway loyihasida **New → Database → PostgreSQL**. U avtomatik `DATABASE_URL`
muhit o'zgaruvchisini beradi.

### 2. Backend servisi

- **New → GitHub Repo** → shu repo
- Settings → **Root Directory** = `backend`
- Nixpacks `Procfile`/`railway.json` ni avtomatik o'qiydi
- **Variables** (muhit o'zgaruvchilari):

  | Kalit | Qiymat |
  |-------|--------|
  | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Postgres servisidan reference) |
  | `SECRET_KEY` | uzun tasodifiy maxfiy kalit |
  | `GEMINI_API_KEY` | Gemini API kaliti |
  | `CORS_ORIGINS` | frontend URL (masalan `https://your-frontend.up.railway.app`) |
  | `BASE_URL` | backend public URL (QR-kodlar uchun) |

  > Ixtiyoriy: `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3` — rate-limit fallback uchun.

- Deploy bo'lgach **Generate Domain** → backend public URL olinadi.
- Tekshirish: `https://<backend-domain>/api/health` → `{"status":"ok"}`

Birinchi ishga tushishda bo'sh DB ga `seed.py` demo ma'lumotlarni to'ldiradi.

### 3. Frontend servisi

- Xuddi shu repodan yana **New → GitHub Repo**
- Settings → **Root Directory** = `frontend`
- **Variables:**

  | Kalit | Qiymat |
  |-------|--------|
  | `VITE_API_BASE` | backend public URL (masalan `https://your-backend.up.railway.app`) |

  > ⚠️ `VITE_*` build vaqtida o'qiladi. Backend URL o'zgarsa, frontend'ni qayta deploy qiling.

- Build: `npm run build`, Start: `npx serve dist -s -l $PORT` (`railway.json` da).
- **Generate Domain** → frontend public URL.

### 4. Yakuniy bog'lash

Backend `CORS_ORIGINS` ga frontend domenini qo'shganingizga ishonch hosil qiling,
keyin ikkala servisni qayta deploy qiling.

---

## Demo login

`seed.py` quyidagi demo foydalanuvchilarni yaratadi (parollar seed faylida):
admin / menejer / oddiy foydalanuvchi rollari mavjud. Tafsilotlar uchun
`backend/app/seed.py` ga qarang.

---

## Muhit o'zgaruvchilari (qisqacha)

**Backend** (`backend/.env.example`):
`APP_NAME`, `DATABASE_URL`, `SECRET_KEY`, `BASE_URL`, `CORS_ORIGINS`, `GEMINI_API_KEY`

**Frontend** (`frontend/.env.example`):
`VITE_API_BASE`
