# HabitFlow REST API Reference

The FastAPI backend automatically generates OpenAPI 3.0 documentation available interactively at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/me` | Retrieve currently authenticated user profile | Yes (Bearer) |
| `POST` | `/api/auth/logout` | Invalidate current session | Yes (Bearer) |

---

## Habit Endpoints (`/api/habits`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/habits` | Fetch user habits (supports category/search/sort) | Yes |
| `POST` | `/api/habits` | Create a new habit | Yes |
| `GET` | `/api/habits/{id}` | Get habit details with streak calculations | Yes |
| `PUT` | `/api/habits/{id}` | Update existing habit configuration | Yes |
| `DELETE` | `/api/habits/{id}` | Delete habit and completion history | Yes |
| `POST` | `/api/habits/{id}/complete` | Mark habit complete / update completion value | Yes |
| `DELETE` | `/api/habits/{id}/complete` | Remove completion for date | Yes |
| `GET` | `/api/habits/{id}/history` | Fetch completion log history | Yes |

---

## Dashboard, Analytics & Calendar (`/api`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Overview greeting, today progress, streak metrics | Yes |
| `GET` | `/api/statistics` | Recharts statistics, weekly/monthly charts, performance | Yes |
| `GET` | `/api/calendar` | Monthly calendar grid data with month/year query | Yes |
| `GET` | `/api/insights` | Data-driven smart habit performance insights | Yes |
| `GET` | `/api/categories` | User habit categories | Yes |
