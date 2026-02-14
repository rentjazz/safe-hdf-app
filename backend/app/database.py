from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

Base = declarative_base()

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    status = Column(String(20), default="todo")  # todo, in_progress, done, cancelled
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_to = Column(String(100), nullable=True)
    tags = Column(String(500), nullable=True)  # Comma-separated tags

class StockItem(Base):
    __tablename__ = "stock_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Float, default=0)
    unit = Column(String(50), default="unit")  # unit, kg, liter, box, etc.
    min_threshold = Column(Float, default=10)  # Alert threshold
    location = Column(String(200), nullable=True)
    category = Column(String(100), nullable=True)
    supplier = Column(String(200), nullable=True)
    price_per_unit = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    barcode = Column(String(100), nullable=True, unique=True)

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    location = Column(String(200), nullable=True)
    contact_name = Column(String(200), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(200), nullable=True)
    status = Column(String(20), default="scheduled")  # scheduled, completed, cancelled
    reminder_sent = Column(Boolean, default=False)
    reminder_3days_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Google Calendar fields
    google_event_id = Column(String(500), nullable=True, unique=True)
    google_calendar_id = Column(String(500), nullable=True)
    is_synced = Column(Boolean, default=False)
    last_synced_at = Column(DateTime, nullable=True)

class GoogleCalendarToken(Base):
    __tablename__ = "google_calendar_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, unique=True, default="default")
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expiry = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Database setup - use /tmp for SQLite to ensure write access
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/safe_hdf.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()