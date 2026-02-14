import os
import pickle
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy.orm import Session

from app.database import GoogleCalendarToken, get_db

# Configuration OAuth2 - À remplacer par vos credentials Google Cloud Console
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/calendar/callback")
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
]

class GoogleCalendarService:
    def __init__(self, db: Session):
        self.db = db
        self.service = None
        self.user_id = "default"  # Pour extension multi-user
    
    def get_auth_url(self) -> str:
        """Génère l'URL d'authentification OAuth2"""
        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            raise ValueError("Google OAuth credentials not configured")
        
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI]
                }
            },
            scopes=SCOPES,
            redirect_uri=GOOGLE_REDIRECT_URI
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        return auth_url
    
    def exchange_code(self, code: str) -> bool:
        """Échange le code OAuth contre des tokens"""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": GOOGLE_CLIENT_ID,
                        "client_secret": GOOGLE_CLIENT_SECRET,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [GOOGLE_REDIRECT_URI]
                    }
                },
                scopes=SCOPES,
                redirect_uri=GOOGLE_REDIRECT_URI
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Sauvegarder les tokens
            token_data = {
                "user_id": self.user_id,
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_expiry": credentials.expiry
            }
            
            existing = self.db.query(GoogleCalendarToken).filter(
                GoogleCalendarToken.user_id == self.user_id
            ).first()
            
            if existing:
                existing.access_token = credentials.token
                existing.refresh_token = credentials.refresh_token or existing.refresh_token
                existing.token_expiry = credentials.expiry
                existing.updated_at = datetime.utcnow()
            else:
                new_token = GoogleCalendarToken(**token_data)
                self.db.add(new_token)
            
            self.db.commit()
            return True
        except Exception as e:
            print(f"Error exchanging code: {e}")
            return False
    
    def get_credentials(self) -> Optional[Credentials]:
        """Récupère et rafraîchit si nécessaire les credentials"""
        token = self.db.query(GoogleCalendarToken).filter(
            GoogleCalendarToken.user_id == self.user_id
        ).first()
        
        if not token:
            return None
        
        creds = Credentials(
            token=token.access_token,
            refresh_token=token.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            scopes=SCOPES
        )
        
        # Rafraîchir si expiré
        if token.token_expiry and token.token_expiry < datetime.utcnow():
            try:
                creds.refresh(Request())
                token.access_token = creds.token
                token.token_expiry = creds.expiry
                self.db.commit()
            except Exception as e:
                print(f"Error refreshing token: {e}")
                return None
        
        return creds
    
    def is_connected(self) -> bool:
        """Vérifie si l'utilisateur est connecté à Google Calendar"""
        return self.get_credentials() is not None
    
    def get_service(self):
        """Retourne le service Google Calendar API"""
        if self.service:
            return self.service
        
        creds = self.get_credentials()
        if not creds:
            raise Exception("Not authenticated with Google Calendar")
        
        self.service = build('calendar', 'v3', credentials=creds)
        return self.service
    
    def sync_events(self, calendar_id: str = "primary", 
                   from_date: Optional[datetime] = None,
                   to_date: Optional[datetime] = None) -> List[Dict]:
        """Récupère les événements de Google Calendar"""
        service = self.get_service()
        
        if not from_date:
            from_date = datetime.utcnow() - timedelta(days=30)
        if not to_date:
            to_date = datetime.utcnow() + timedelta(days=365)
        
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=from_date.isoformat() + 'Z',
            timeMax=to_date.isoformat() + 'Z',
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        return events_result.get('items', [])
    
    def create_event(self, calendar_id: str, summary: str, 
                    start_time: datetime, end_time: Optional[datetime] = None,
                    description: Optional[str] = None,
                    location: Optional[str] = None) -> Dict:
        """Crée un événement dans Google Calendar"""
        service = self.get_service()
        
        if not end_time:
            end_time = start_time + timedelta(hours=1)
        
        event_body = {
            'summary': summary,
            'description': description or '',
            'location': location or '',
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'Europe/Paris',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'Europe/Paris',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60 * 3},  # 3 jours avant
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }
        
        event = service.events().insert(calendarId=calendar_id, body=event_body).execute()
        return event
    
    def update_event(self, event_id: str, calendar_id: str = "primary",
                     summary: Optional[str] = None,
                     start_time: Optional[datetime] = None,
                     end_time: Optional[datetime] = None,
                     description: Optional[str] = None,
                     location: Optional[str] = None) -> Dict:
        """Met à jour un événement dans Google Calendar"""
        service = self.get_service()
        
        # Récupérer l'événement existant
        event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()
        
        if summary:
            event['summary'] = summary
        if description is not None:
            event['description'] = description
        if location is not None:
            event['location'] = location
        if start_time:
            event['start']['dateTime'] = start_time.isoformat()
        if end_time:
            event['end']['dateTime'] = end_time.isoformat()
        
        updated_event = service.events().update(
            calendarId=calendar_id, 
            eventId=event_id, 
            body=event
        ).execute()
        return updated_event
    
    def delete_event(self, event_id: str, calendar_id: str = "primary") -> bool:
        """Supprime un événement de Google Calendar"""
        try:
            service = self.get_service()
            service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
            return True
        except HttpError:
            return False
    
    def get_user_info(self) -> Optional[Dict]:
        """Récupère les infos de l'utilisateur Google"""
        try:
            service = self.get_service()
            calendar = service.calendars().get(calendarId='primary').execute()
            return {
                'email': calendar.get('id'),
                'timezone': calendar.get('timeZone')
            }
        except Exception as e:
            print(f"Error getting user info: {e}")
            return None
    
    def disconnect(self) -> bool:
        """Déconnecte l'utilisateur de Google Calendar"""
        try:
            token = self.db.query(GoogleCalendarToken).filter(
                GoogleCalendarToken.user_id == self.user_id
            ).first()
            if token:
                self.db.delete(token)
                self.db.commit()
            return True
        except Exception as e:
            print(f"Error disconnecting: {e}")
            return False