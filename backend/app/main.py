from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import tasks, stock, appointments, calendar, sheets

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Safe HDF API",
    description="API pour la gestion des tâches, stock et rendez-vous de Safe HDF",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines exacts
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks.router)
app.include_router(stock.router)
app.include_router(appointments.router)
app.include_router(calendar.router)
app.include_router(sheets.router)

@app.get("/")
def root():
    return {
        "message": "Safe HDF API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/dashboard/stats")
def get_dashboard_stats(db=Depends(lambda: None)):
    from sqlalchemy.orm import Session
    from app.database import get_db, Task, StockItem, Appointment
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Tasks stats
        total_tasks = db.query(Task).count()
        tasks_by_status = {}
        for status in ["todo", "in_progress", "done", "cancelled"]:
            count = db.query(Task).filter(Task.status == status).count()
            tasks_by_status[status] = count
        
        tasks_overdue = db.query(Task).filter(
            Task.due_date < datetime.utcnow(),
            Task.status.in_(["todo", "in_progress"])
        ).count()
        
        # Stock stats
        total_stock_items = db.query(StockItem).count()
        low_stock_items = db.query(StockItem).filter(
            StockItem.quantity <= StockItem.min_threshold
        ).count()
        
        # Appointments stats
        total_appointments = db.query(Appointment).count()
        now = datetime.utcnow()
        upcoming_appointments = db.query(Appointment).filter(
            Appointment.start_time >= now,
            Appointment.status == "scheduled"
        ).count()
        
        three_days_later = now + timedelta(days=3)
        appointments_next_3_days = db.query(Appointment).filter(
            Appointment.start_time >= now,
            Appointment.start_time <= three_days_later,
            Appointment.status == "scheduled"
        ).count()
        
        return {
            "total_tasks": total_tasks,
            "tasks_by_status": tasks_by_status,
            "tasks_overdue": tasks_overdue,
            "total_stock_items": total_stock_items,
            "low_stock_items": low_stock_items,
            "total_appointments": total_appointments,
            "upcoming_appointments": upcoming_appointments,
            "appointments_next_3_days": appointments_next_3_days
        }
    finally:
        db_gen.close()