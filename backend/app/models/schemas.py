from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    tags: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    tags: Optional[str] = None

class Task(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StockItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    quantity: float = Field(default=0, ge=0)
    unit: str = Field(default="unit", max_length=50)
    min_threshold: float = Field(default=10, ge=0)
    location: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    price_per_unit: Optional[float] = Field(None, ge=0)
    barcode: Optional[str] = None

class StockItemCreate(StockItemBase):
    pass

class StockItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)
    min_threshold: Optional[float] = Field(None, ge=0)
    location: Optional[str] = None
    category: Optional[str] = None
    supplier: Optional[str] = None
    price_per_unit: Optional[float] = Field(None, ge=0)
    barcode: Optional[str] = None

class StockItem(StockItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AppointmentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    status: AppointmentStatus = AppointmentStatus.SCHEDULED

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    status: Optional[AppointmentStatus] = None

class Appointment(AppointmentBase):
    id: int
    reminder_sent: bool
    reminder_3days_sent: bool
    google_event_id: Optional[str] = None
    google_calendar_id: Optional[str] = None
    is_synced: bool = False
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GoogleCalendarSyncRequest(BaseModel):
    calendar_id: str = "primary"
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None

class GoogleCalendarEventCreate(BaseModel):
    calendar_id: str = "primary"
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None

class GoogleCalendarAuthUrl(BaseModel):
    auth_url: str

class GoogleCalendarTokenResponse(BaseModel):
    success: bool
    message: str

class CalendarConnectionStatus(BaseModel):
    is_connected: bool
    email: Optional[str] = None
    last_synced: Optional[datetime] = None

class DashboardStats(BaseModel):
    total_tasks: int
    tasks_by_status: dict
    tasks_overdue: int
    total_stock_items: int
    low_stock_items: int
    total_appointments: int
    upcoming_appointments: int
    appointments_next_3_days: int