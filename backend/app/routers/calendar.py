from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.services.google_calendar import GoogleCalendarService
from app.models.schemas import (
    GoogleCalendarSyncRequest, 
    GoogleCalendarAuthUrl,
    GoogleCalendarTokenResponse,
    CalendarConnectionStatus
)

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/auth-url", response_model=GoogleCalendarAuthUrl)
def get_auth_url(db: Session = Depends(get_db)):
    """Get Google OAuth authorization URL"""
    service = GoogleCalendarService(db)
    try:
        auth_url = service.get_auth_url()
        return {"auth_url": auth_url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/callback")
def oauth_callback(
    code: str,
    error: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """OAuth callback from Google"""
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    
    service = GoogleCalendarService(db)
    success = service.exchange_code(code)
    
    if success:
        return {"message": "Google Calendar connected successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to connect Google Calendar")

@router.get("/status", response_model=CalendarConnectionStatus)
def get_connection_status(db: Session = Depends(get_db)):
    """Check if Google Calendar is connected"""
    service = GoogleCalendarService(db)
    is_connected = service.is_connected()
    return {
        "is_connected": is_connected,
        "email": None,  # Could be enhanced to store user email
        "last_synced": None
    }

@router.post("/sync")
def sync_calendar(
    request: GoogleCalendarSyncRequest,
    db: Session = Depends(get_db)
):
    """Sync events from Google Calendar"""
    service = GoogleCalendarService(db)
    try:
        result = service.sync_events(
            calendar_id=request.calendar_id,
            from_date=request.from_date,
            to_date=request.to_date
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/appointments/{appointment_id}/create-event")
def create_google_event(
    appointment_id: int,
    calendar_id: str = "primary",
    db: Session = Depends(get_db)
):
    """Create a Google Calendar event from a local appointment"""
    service = GoogleCalendarService(db)
    try:
        event_id = service.create_event(appointment_id, calendar_id)
        return {"message": "Event created", "event_id": event_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))