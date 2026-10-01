# HabitFlow Setup Guide (Windows PowerShell)

This guide provides exact step-by-step Windows PowerShell instructions to set up, initialize, seed, test, and run HabitFlow locally.

---

## Step 1: Database Setup (MySQL 8+)

### Option A: Running Local MySQL
Ensure MySQL server is running on `localhost:3306`.
Create the `habitflow` database:
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS habitflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Option B: Docker Compose MySQL (Recommended)
If Docker is installed, spin up MySQL with a single command:
```powershell
docker compose up mysql -d
```

---

## Step 2: Backend Setup & Server Execution

Open a Windows PowerShell terminal in the project root:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install all backend requirements
pip install -r requirements.txt

# Run Alembic migrations to build database tables
alembic upgrade head

# Seed demo account and 30-day realistic completion history
python seed.py

# Launch FastAPI Backend Server with auto-reload
uvicorn app.main:app --reload --port 8000
```

The backend server will start at:
- **API URL**: [http://localhost:8000](http://localhost:8000)
- **Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Step 3: Running Backend Pytest Test Suite

In a separate PowerShell window with `venv` active:

```powershell
cd backend
.\venv\Scripts\pytest
```

---

## Step 4: Frontend Setup & Dev Server Execution

Open a second PowerShell terminal window in the project root:

```powershell
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite Frontend Development Server
npm run dev
```

The application will launch at:
- **Frontend URL**: [http://localhost:5173](http://localhost:5173)

---

## Step 5: Demo Account Logins

Use the pre-seeded demo account credentials:
- **Email**: `demo@example.com`
- **Password**: `DemoPassword123!`

---

## Step 6: Full Stack Docker Deployment

To build and launch the complete stack (MySQL + FastAPI Backend + React/Nginx Frontend) in containers:

```powershell
docker compose up --build
```
