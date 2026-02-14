# Safe HDF App

Application PWA complète pour la gestion de Safe HDF. Cette application permet de gérer les tâches, le stock et les rendez-vous avec synchronisation Google Calendar.

## 🚀 Fonctionnalités

- ✅ **Gestion des tâches** (CRUD complet, priorité, statut, dates)
- 📦 **Gestion du stock** (articles, quantités, alertes seuil)
- 📅 **Rendez-vous** avec synchronisation Google Calendar
- 📊 **Tableau de bord** avec statistiques en temps réel
- 🔔 **Rappels automatiques** 3 jours avant les rendez-vous
- 📱 **PWA** - Fonctionne hors ligne, installable sur mobile
- 🔐 **OAuth2 Google** pour l'intégration Calendar

## 📁 Structure du projet

```
safe-hdf-app/
├── frontend/          # PWA React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/           # Python FastAPI
│   ├── app/
│   │   ├── routers/
│   │   ├── models/
│   │   ├── services/
│   │   └── database.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🛠️ Technologies

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- React Router
- Axios
- PWA (Vite PWA plugin)

### Backend
- FastAPI
- SQLAlchemy (ORM)
- SQLite (base de données)
- Google Calendar API
- OAuth2

## 🚀 Installation

### Prérequis
- Docker et Docker Compose
- Node.js 20+ (pour développement local)
- Python 3.11+ (pour développement local)

### Configuration Google Calendar (Obligatoire pour la synchro)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar :
   - Menu hamburger → "APIs & Services" → "Library"
   - Recherchez "Google Calendar API" et activez-la
4. Créez des credentials OAuth2 :
   - "APIs & Services" → "Credentials"
   - "Create Credentials" → "OAuth client ID"
   - Configurez l'écran de consentement OAuth (type "External")
   - Application type : "Web application"
   - Nom : "Safe HDF App"
   - Authorized redirect URIs : `http://localhost:8000/calendar/callback`
   - Notez le **Client ID** et le **Client Secret**
5. Créez un fichier `.env` dans le dossier `backend/` :

```bash
# Backend/.env
GOOGLE_CLIENT_ID=votre_client_id_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
GOOGLE_REDIRECT_URI=http://localhost:8000/calendar/callback
```

### Lancement avec Docker

```bash
# Cloner le repository
git clone https://github.com/rentjazz/safe-hdf-app.git
cd safe-hdf-app

# Créer le fichier .env dans backend/
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos credentials Google

# Lancer l'application
docker-compose up -d

# L'application est accessible sur :
# - Frontend : http://localhost
# - Backend API : http://localhost:8000
# - Documentation API : http://localhost:8000/docs
```

### Développement local

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

## 📱 Utilisation de la PWA

1. Ouvrez l'application dans Chrome/Edge/Safari
2. Vous verrez une icône "Installer" dans la barre d'adresse
3. Cliquez pour installer l'application sur votre appareil
4. L'application fonctionne hors ligne et s'adapte à tous les écrans

## 🔌 API Endpoints

### Tâches
- `GET /tasks/` - Liste des tâches
- `POST /tasks/` - Créer une tâche
- `GET /tasks/{id}` - Détails d'une tâche
- `PUT /tasks/{id}` - Modifier une tâche
- `DELETE /tasks/{id}` - Supprimer une tâche

### Stock
- `GET /stock/` - Liste des articles
- `POST /stock/` - Créer un article
- `PUT /stock/{id}` - Modifier un article
- `DELETE /stock/{id}` - Supprimer un article

### Rendez-vous
- `GET /appointments/` - Liste des rendez-vous
- `POST /appointments/` - Créer un rendez-vous
- `PUT /appointments/{id}` - Modifier un rendez-vous
- `DELETE /appointments/{id}` - Supprimer un rendez-vous

### Google Calendar
- `GET /calendar/auth-url` - URL d'authentification OAuth2
- `GET /calendar/callback` - Callback OAuth2
- `GET /calendar/status` - Statut de connexion
- `POST /calendar/sync` - Synchroniser depuis Google Calendar
- `POST /calendar/push/{id}` - Pousser un rendez-vous vers Google

### Dashboard
- `GET /dashboard/stats` - Statistiques globales

## 🔄 Synchronisation Google Calendar

Une fois connecté :
1. Les rendez-vous créés dans Safe HDF peuvent être poussés vers Google Calendar
2. Les événements Google Calendar peuvent être importés dans Safe HDF
3. Les rappels 3 jours avant sont automatiquement configurés

## 📝 License

MIT License - © 2024 Safe HDF

## 🆘 Support

Pour toute question ou problème, contactez l'administrateur système.