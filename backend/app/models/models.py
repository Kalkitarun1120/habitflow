from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, Date, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone_number = Column(String(30), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    avatar = Column(String(255), nullable=True)
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    auth_provider = Column(String(50), default="email")
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    # Relationships
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    completions = relationship("HabitCompletion", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    auth_identities = relationship("AuthIdentity", back_populates="user", cascade="all, delete-orphan")
    otp_verifications = relationship("OTPVerification", back_populates="user", cascade="all, delete-orphan")


class AuthIdentity(Base):
    __tablename__ = "auth_identities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)  # "email", "google", "phone"
    provider_user_id = Column(String(255), nullable=False)  # Google sub, phone number, email
    provider_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_provider_user_id"),
    )

    user = relationship("User", back_populates="auth_identities")


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    phone_number = Column(String(30), nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    otp_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), default="login")  # "signup", "login", "link_phone", "forgot_password", "email_change", "phone_change"
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="otp_verifications")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(50), default="#6366F1")
    icon = Column(String(50), default="folder")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="categories")


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="General")
    icon = Column(String(50), default="sparkles")
    color = Column(String(50), default="#6366F1")
    frequency = Column(String(50), default="daily")
    target_value = Column(Float, default=1.0)
    target_unit = Column(String(50), default="times")
    reminder_time = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True)
    is_paused = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    start_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="habits")
    completions = relationship("HabitCompletion", back_populates="habit", cascade="all, delete-orphan")


class HabitCompletion(Base):
    __tablename__ = "habit_completions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    completion_date = Column(Date, nullable=False, index=True)
    completed = Column(Boolean, default=True)
    skipped = Column(Boolean, default=False)
    value = Column(Float, default=1.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("habit_id", "completion_date", name="uq_habit_completion_date"),
    )

    habit = relationship("Habit", back_populates="completions")
    user = relationship("User", back_populates="completions")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    scheduled_time = Column(DateTime, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
