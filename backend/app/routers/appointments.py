from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models.schemas import Appointment, AppointmentCreate, AppointmentUpdate
from app.database import Appointment as AppointmentModel

router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.get("/", response_model=List[Appointment])
def get_appointments(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AppointmentModel)
    
    if status:
        query = query.filter(AppointmentModel.status == status)
    if from_date:
        query = query.filter(AppointmentModel.start_time >= from_date)
    if to_date:
        query = query.filter(AppointmentModel.start_time <= to_date)
    
    return query.order_by(AppointmentModel.start_time.asc()).offset(skip).limit(limit).all()

@router.post("/", response_model=Appointment)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    db_appointment = AppointmentModel(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.get("/{appointment_id}", response_model=Appointment)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(AppointmentModel).filter(AppointmentModel.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.put("/{appointment_id}", response_model=Appointment)
def update_appointment(appointment_id: int, appointment_update: AppointmentUpdate, db: Session = Depends(get_db)):
    appointment = db.query(AppointmentModel).filter(AppointmentModel.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    update_data = appointment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    appointment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(AppointmentModel).filter(AppointmentModel.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db.delete(appointment)
    db.commit()
    return {"message": "Appointment deleted successfully"}

@router.get("/upcoming/next-3-days")
def get_appointments_next_3_days(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    three_days_later = now + timedelta(days=3)
    
    appointments = db.query(AppointmentModel).filter(
        AppointmentModel.start_time >= now,
        AppointmentModel.start_time <= three_days_later,
        AppointmentModel.status == "scheduled"
    ).order_by(AppointmentModel.start_time.asc()).all()
    
    return appointments

@router.get("/upcoming/this-week")
def get_appointments_this_week(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    week_later = now + timedelta(days=7)
    
    appointments = db.query(AppointmentModel).filter(
        AppointmentModel.start_time >= now,
        AppointmentModel.start_time <= week_later,
        AppointmentModel.status == "scheduled"
    ).order_by(AppointmentModel.start_time.asc()).all()
    
    return appointments

@router.post("/{appointment_id}/mark-reminder-sent")
def mark_reminder_sent(appointment_id: int, days: int = 3, db: Session = Depends(get_db)):
    appointment = db.query(AppointmentModel).filter(AppointmentModel.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if days == 3:
        appointment.reminder_3days_sent = True
    else:
        appointment.reminder_sent = True
    
    db.commit()
    return {"message": f"Reminder ({days} days) marked as sent"}