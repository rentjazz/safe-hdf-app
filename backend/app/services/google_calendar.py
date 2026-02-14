import os
from datetime import datetime, timedelta
from typing import Optional, List
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from sqlalchemy.orm import Session
from app.database import GoogleCalendarToken, Appointment

# Configuration OAuth2
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/calendar/callback")

SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
]

class GoogleCalendarService:
    def __init__(self, db: Session):
        self.db = db
        self.service = None
    
    def get_auth_url(self) -> str:
        """Generate OAuth2 authorization URL"""
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise ValueError("Google OAuth credentials not configured")
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        auth_url, _ = flow.authorization_url(prompt='consent')
        return auth_url
    
    def exchange_code(self, code: str, user_id: str = "default") -> bool:
        """Exchange authorization code for tokens"""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [REDIRECT_URI]
                    }
                },
                scopes=SCOPES,
                redirect_uri=REDIRECT_URI
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Store tokens
            token_record = self.db.query(GoogleCalendarToken).filter(
                GoogleCalendarToken.user_id == user_id
            ).first()
            
            if token_record:
                token_record.access_token = credentials.token
                token_record.refresh_token = credentials.refresh_token or token_record.refresh_token
                token_record.token_expiry = credentials.expiry
            else:
                token_record = GoogleCalendarToken(
                    user_id=user_id,
                    access_token=credentials.token,
                    refresh_token=credentials.refresh_token,
                    token_expiry=credentials.expiry
                )
                self.db.add(token_record)
            
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error exchanging code: {e}")
            return False
    
    def _get_credentials(self, user_id: str = "default") -> Optional[Credentials]:
        """Get credentials for user"""
        token_record = self.db.query(GoogleCalendarToken).filter(
            GoogleCalendarToken.user_id == user_id
        ).first()
        
        if not token_record:
            return None
        
        credentials = Credentials(
            token=token_record.access_token,
            refresh_token=token_record.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            scopes=SCOPES
        )
        
        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            token_record.access_token = credentials.token
            token_record.token_expiry = credentials.expiry
            self.db.commit()
        
        return credentials
    
    def is_connected(self, user_id: str = "default") -> bool:
        """Check if user has connected Google Calendar"""
        return self._get_credentials(user_id) is not None
    
    def sync_events(self, calendar_id: str = "primary", 
                    from_date: Optional[datetime] = None,
                    to_date: Optional[datetime] = None,
                    user_id: str = "default") -> List[dict]:
        """Sync events from Google Calendar to local database"""
        credentials = self._get_credentials(user_id)
        if not credentials:
            raise ValueError("Google Calendar not connected")
        
        service = build('calendar', 'v3', credentials=credentials)
        
        if not from_date:
            from_date = datetime.utcnow()
        if not to_date:
            to_date = from_date + timedelta(days=90)
        
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=from_date.isoformat() + 'Z',
            timeMax=to_date.isoformat() + 'Z',
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        synced_count = 0
        
        for event in events:
            # Check if event already exists
            existing = self.db.query(Appointment).filter(
                Appointment.google_event_id == event['id']
            ).first()
            
            start_time = event['start'].get('dateTime', event['start'].get('date'))
            end_time = event['end'].get('dateTime', event['end'].get('date'))
            
            # Parse datetime
            if 'T' in start_time:
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            else:
                start_dt = datetime.strptime(start_time, '%Y-%m-%d')
            
            if end_time:
                if 'T' in end_time:
                    end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                else:
                    end_dt = datetime.strptime(end_time, '%Y-%m-%d')
            else:
                end_dt = None
            
            if existing:
                # Update existing
                existing.title = event.get('summary', 'Sans titre')
                existing.description = event.get('description', '')
                existing.start_time = start_dt
                existing.end_time = end_dt
                existing.location = event.get('location', '')
                existing.last_synced_at = datetime.utcnow()
            else:
                # Create new
                new_appointment = Appointment(
                    title=event.get('summary', 'Sans titre'),
                    description=event.get('description', ''),
                    start_time=start_dt,
                    end_time=end_dt,
                    location=event.get('location', ''),
                    google_event_id=event['id'],
                    google_calendar_id=calendar_id,
                    is_synced=True,
                    last_synced_at=datetime.utcnow()
                )
                self.db.add(new_appointment)
                synced_count += 1
        
        self.db.commit()
        return {"synced": synced_count, "total": len(events)}
    
    def create_event(self, appointment_id: int, calendar_id: str = "primary",
                     user_id: str = "default") -> Optional[str]:
        """Create a Google Calendar event from local appointment"""
        credentials = self._get_credentials(user_id)
        if not credentials:
            raise ValueError("Google Calendar not connected")
        
        appointment = self.db.query(Appointment).filter(
            Appointment.id == appointment_id
        ).first()
        
        if not appointment:
            raise ValueError("Appointment not found")
        
        service = build('calendar', 'v3', credentials=credentials)
        
        event_body = {
            'summary': appointment.title,
            'description': appointment.description or '',
            'start': {
                'dateTime': appointment.start_time.isoformat(),
                'timeZone': 'Europe/Paris',
            },
            'end': {
                'dateTime': (appointment.end_time or appointment.start_time).isoformat(),
                'timeZone': 'Europe/Paris',
            },
        }
        
        if appointment.location:
            event_body['location'] = appointment.location
        
        event = service.events().insert(calendarId=calendar_id, body=event_body).execute()
        
        # Update local appointment
        appointment.google_event_id = event['id']
        appointment.google_calendar_id = calendar_id
        appointment.is_synced = True
        appointment.last_synced_at = datetime.utcnow()
        self.db.commit()
        
        return event['id']