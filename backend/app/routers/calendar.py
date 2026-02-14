from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.schemas import (
    GoogleCalendarAuthUrl, 
    GoogleCalendarTokenResponse,
    GoogleCalendarSyncRequest,
    CalendarConnectionStatus
)
from app.services.google_calendar import GoogleCalendarService
from app.database import Appointment

router = APIRouter(prefix="/calendar", tags=["google-calendar"])

@router.get("/auth-url", response_model=GoogleCalendarAuthUrl)
def get_auth_url(db: Session = Depends(get_db)):
    """Récupère l'URL d'authentification Google OAuth2"""
    try:
        service = GoogleCalendarService(db)
        auth_url = service.get_auth_url()
        return {"auth_url": auth_url}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callback")
def oauth_callback(code: str, db: Session = Depends(get_db)):
    """Callback OAuth2 de Google"""
    service = GoogleCalendarService(db)
    success = service.exchange_code(code)
    
    if success:
        return {"message": "Authentification réussie", "success": True}
    else:
        raise HTTPException(status_code=400, detail="Échec de l'authentification")

@router.get("/status", response_model=CalendarConnectionStatus)
def get_connection_status(db: Session = Depends(get_db)):
    """Vérifie le statut de connexion Google Calendar"""
    service = GoogleCalendarService(db)
    is_connected = service.is_connected()
    
    if is_connected:
        user_info = service.get_user_info()
        return {
            "is_connected": True,
            "email": user_info.get('email') if user_info else None,
            "last_synced": None
        }
    
    return {
        "is_connected": False,
        "email": None,
        "last_synced": None
    }

@router.post("/disconnect")
def disconnect_calendar(db: Session = Depends(get_db)):
    """Déconnecte Google Calendar"""
    service = GoogleCalendarService(db)
    success = service.disconnect()
    
    if success:
        return {"message": "Déconnecté avec succès", "success": True}
    else:
        raise HTTPException(status_code=500, detail="Erreur lors de la déconnexion")

@router.post("/sync")
def sync_calendar(
    sync_request: GoogleCalendarSyncRequest,
    db: Session = Depends(get_db)
):
    """Synchronise les événements depuis Google Calendar"""
    service = GoogleCalendarService(db)
    
    if not service.is_connected():
        raise HTTPException(status_code=401, detail="Non connecté à Google Calendar")
    
    try:
        events = service.sync_events(
            calendar_id=sync_request.calendar_id,
            from_date=sync_request.from_date,
            to_date=sync_request.to_date
        )
        
        imported_count = 0
        for event in events:
            # Vérifier si l'événement existe déjà
            existing = db.query(Appointment).filter(
                Appointment.google_event_id == event['id']
            ).first()
            
            start = event['start'].get('dateTime', event['start'].get('date'))
            end = event['end'].get('dateTime', event['end'].get('date'))
            
            # Parser les dates
            if 'T' in start:
                start_time = datetime.fromisoformat(start.replace('Z', '+00:00').replace('+00:00', ''))
            else:
                start_time = datetime.strptime(start, '%Y-%m-%d')
            
            end_time = None
            if end:
                if 'T' in end:
                    end_time = datetime.fromisoformat(end.replace('Z', '+00:00').replace('+00:00', ''))
                else:
                    end_time = datetime.strptime(end, '%Y-%m-%d')
            
            if existing:
                # Mettre à jour
                existing.title = event.get('summary', 'Sans titre')
                existing.description = event.get('description', '')
                existing.start_time = start_time
                existing.end_time = end_time
                existing.location = event.get('location', '')
                existing.is_synced = True
                existing.last_synced_at = datetime.utcnow()
            else:
                # Créer nouveau
                new_appointment = Appointment(
                    title=event.get('summary', 'Sans titre'),
                    description=event.get('description', ''),
                    start_time=start_time,
                    end_time=end_time,
                    location=event.get('location', ''),
                    google_event_id=event['id'],
                    google_calendar_id=sync_request.calendar_id,
                    is_synced=True,
                    last_synced_at=datetime.utcnow(),
                    status='scheduled'
                )
                db.add(new_appointment)
                imported_count += 1
        
        db.commit()
        return {
            "message": f"Synchronisation réussie",
            "imported": imported_count,
            "updated": len(events) - imported_count,
            "total": len(events)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de synchronisation: {str(e)}")

@router.post("/push/{appointment_id}")
def push_to_calendar(
    appointment_id: int,
    calendar_id: str = "primary",
    db: Session = Depends(get_db)
):
    """Pousse un rendez-vous vers Google Calendar"""
    service = GoogleCalendarService(db)
    
    if not service.is_connected():
        raise HTTPException(status_code=401, detail="Non connecté à Google Calendar")
    
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    
    try:
        if appointment.google_event_id:
            # Mettre à jour l'événement existant
            event = service.update_event(
                event_id=appointment.google_event_id,
                calendar_id=calendar_id,
                summary=appointment.title,
                start_time=appointment.start_time,
                end_time=appointment.end_time,
                description=appointment.description or '',
                location=appointment.location or ''
            )
        else:
            # Créer nouvel événement
            event = service.create_event(
                calendar_id=calendar_id,
                summary=appointment.title,
                start_time=appointment.start_time,
                end_time=appointment.end_time,
                description=appointment.description or '',
                location=appointment.location or ''
            )
            appointment.google_event_id = event['id']
        
        appointment.google_calendar_id = calendar_id
        appointment.is_synced = True
        appointment.last_synced_at = datetime.utcnow()
        db.commit()
        
        return {
            "message": "Rendez-vous synchronisé avec succès",
            "google_event_id": event['id'],
            "html_link": event.get('htmlLink')
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

@router.get("/upcoming-with-reminders")
def get_upcoming_with_reminders(db: Session = Depends(get_db)):
    """Récupère les rendez-vous des 3 prochains jours pour les rappels"""
    now = datetime.utcnow()
    three_days_later = now + timedelta(days=3)
    
    appointments = db.query(Appointment).filter(
        Appointment.start_time >= now,
        Appointment.start_time <= three_days_later,
        Appointment.status == 'scheduled',
        Appointment.reminder_3days_sent == False
    ).all()
    
    return [
        {
            "id": a.id,
            "title": a.title,
            "start_time": a.start_time,
            "contact_email": a.contact_email,
            "contact_name": a.contact_name
        }
        for a in appointments
    ]