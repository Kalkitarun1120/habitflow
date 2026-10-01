# HabitFlow — Cross-Platform Habit Tracking Application

![HabitFlow](/frontend/public/favicon.svg)

HabitFlow is a modern, cross-platform habit tracking application designed to help users build consistent daily routines, calculate accurate streaks, and analyze habit performance through data-driven smart insights.

The application works on **Desktop browsers, Mobile browsers, Tablets**, and as an **Installable Mobile PWA (Progressive Web App)**.

---

## 🌟 Key Features

- **PWA & Mobile-First Responsive Design**: Works seamlessly on desktop (with collapsible sidebar) and mobile (with bottom navigation bar and PWA offline shell).
- **Streak Engine (`streak_service.py`)**: Precise calculation of active streaks, longest streaks, and completion rates using exact completion logs.
- **Smart Analytics & Insights (`analytics_service.py`)**: Automatic generation of insights (peak consistency days, habit trends, time optimization tips).
- **Interactive Dashboard**: Real-time progress ring, greeting, quick habit completion toggle, and category filtering.
- **Interactive Calendar & Heatmap**: Monthly grid visualization and GitHub-style contribution heatmap.
- **Data Analytics & Recharts Graphs**: Weekly completion bar charts, monthly rate trend lines, and category performance breakdown.
- **Security & JWT Authentication**: Password hashing using Bcrypt, JWT authentication tokens, and protected API routes.
- **Future ML Ready (`backend/app/ml/`)**: Clean prediction interfaces prepared for future ML completion and risk prediction models.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 / 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom glassmorphism & 3D card elevation
- **Routing**: React Router DOM v6/v7
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic JWT interceptors
- **PWA**: Service Worker (`sw.js`) & Web App Manifest (`manifest.json`)

### Backend
- **Framework**: Python 3.11+ / 3.14 + FastAPI
- **ORM**: SQLAlchemy 2.x
- **Validation**: Pydantic v2
- **Database Migrations**: Alembic
- **Security**: PyJWT & Bcrypt
- **Testing**: Pytest & HTTPX TestClient
- **Server**: Uvicorn

### Database
- **Primary DB**: MySQL 8+ (with automatic fallback to SQLite for quick local setup)
- **Driver**: PyMySQL

---

## 📂 Folder Structure

```
HabitFlow/
├── frontend/
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/      # HabitCard, ProgressRing, StatCard, Calendar, Heatmap, Modals
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── layouts/         # AppLayout with Navbar, Sidebar, MobileBottomNav
│   │   ├── pages/           # DashboardPage, HabitsPage, CalendarPage, StatisticsPage, ProfilePage, SettingsPage
│   │   ├── services/        # Centralized Axios API client (api.ts)
│   │   ├── types/           # TypeScript interface declarations
│   │   ├── App.tsx          # Router and protected routes
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── core/            # Config, database, security, dependencies
│   │   ├── models/          # SQLAlchemy ORM models (User, Habit, Completion, Category, Notification)
│   │   ├── schemas/         # Pydantic request & response schemas
│   │   ├── routers/         # REST API endpoints (auth, habits, dashboard, stats, calendar, insights)
│   │   ├── services/        # Streak Engine & Analytics Service
│   │   ├── ml/              # Future ML Architecture interfaces
│   │   ├── tests/           # Pytest test suite
│   │   └── main.py          # FastAPI entrypoint
│   ├── alembic/             # Migrations
│   ├── requirements.txt
│   └── seed.py              # Demo account & historical data seeder
├── database/                # Database schemas & documentation
├── docs/                    # Architecture, API & DB docs
├── docker-compose.yml
├── README.md
├── SETUP.md
├── .env.example
├── .gitignore
└── LICENSE
```

---

## 🚀 Quick Start (Local Setup)

### Backend Execution
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

### Frontend Execution
```powershell
cd frontend
npm install
npm run dev
```

Visit:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Demo Credentials
- **Email**: `demo@example.com`
- **Password**: `DemoPassword123!`

---

## 🧪 Testing

Run automated pytest backend tests:
```powershell
cd backend
.\venv\Scripts\pytest
```

---

## 🐳 Docker Execution

Run full application stack using Docker Compose:
```powershell
docker compose up --build
```

---

## 📄 Documentation Links
- [Setup Guide](SETUP.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
