# HabitFlow Database Schema (MySQL 8+)

```mermaid
erDiagram
    users ||--o{ habits : owns
    users ||--o{ habit_completions : logs
    users ||--o{ categories : manages
    users ||--o{ notifications : receives
    habits ||--o{ habit_completions : has

    users {
        int id PK
        string name
        string email UK
        string password_hash
        string avatar
        string timezone
        datetime created_at
        datetime updated_at
    }

    habits {
        int id PK
        int user_id FK
        string name
        text description
        string category
        string icon
        string color
        string frequency
        float target_value
        string target_unit
        string reminder_time
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    habit_completions {
        int id PK
        int habit_id FK
        int user_id FK
        date completion_date
        boolean completed
        float value
        text notes
        datetime created_at
        datetime updated_at
    }

    categories {
        int id PK
        int user_id FK
        string name
        string color
        string icon
        datetime created_at
    }

    notifications {
        int id PK
        int user_id FK
        int habit_id FK
        string title
        text message
        datetime scheduled_time
        boolean is_read
        datetime created_at
    }
```

## Constraints & Indexes
1. `habit_completions`: Unique constraint `uq_habit_completion_date (habit_id, completion_date)` prevents duplicate completion records.
2. `users.email`: Indexed and strictly unique.
3. Foreign keys with `ON DELETE CASCADE` ensure clean cleanup when deleting habits or user accounts.
