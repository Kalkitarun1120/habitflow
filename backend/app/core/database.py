import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

logger = logging.getLogger("habitflow.database")

db_url = settings.get_database_url()

def build_engine():
    connect_args = {}
    if "sqlite" in db_url:
        connect_args = {"check_same_thread": False}

    try:
        eng = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args=connect_args,
        )
        # Test connection immediately
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Connected to database at {db_url}")
        return eng
    except Exception as e:
        logger.warning(f"Could not connect to configured DB ({db_url}): {e}. Falling back to SQLite dev database.")
        fallback_url = "sqlite:///./habitflow_dev.db"
        fallback_eng = create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
        )
        with fallback_eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return fallback_eng


engine = build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
