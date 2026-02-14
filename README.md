# Safe HDF App 🏛️

Application PWA complète pour la gestion de Safe HDF - Dépannage et maintenance de coffres-forts.

## ✨ Fonctionnalités

- **📋 Gestion des tâches** - CRUD complet, priorités, statuts, rappels
- **📦 Gestion du stock** - Articles, quantités, alertes de seuil minimum
- **📅 Rendez-vous** - Planning, rappels automatiques, intégration Google Calendar
- **📊 Dashboard** - Statistiques en temps réel, métriques clés
- **🔔 Notifications** - Rappels 3 jours avant les rendez-vous

## 🏗️ Architecture

```
safe-hdf-app/
├── backend/           # API FastAPI + Python
│   ├── app/
│   │   ├── routers/   # Endpoints API
│   │   ├── models/    # Schémas Pydantic
│   │   ├── services/  # Logique métier
│   │   └── database.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/          # PWA React + Vite + Tailwind
│   ├── src/
│   │   ├── components/# Composants UI
│   │   ├── pages/     # Pages de l'app
│   │   ├── stores/    # State management (Zustand)
│   │   └── utils/     # Utilitaires
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## 🚀 Déploiement

### Prérequis
- Docker + Docker Compose
- Git

### Installation

1. **Cloner le repo**
```bash
git clone https://github.com/rentjazz/safe-hdf-app.git
cd safe-hdf-app
```

2. **Configurer les variables d'environnement**
```bash
# Créer le fichier backend/.env
cat > backend/.env << EOF
DATABASE_URL=sqlite:///data/safe_hdf.db
# Google Calendar OAuth (optionnel)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://your-domain/calendar/callback
EOF
```

3. **Lancer l'application**
```bash
docker-compose up -d
```

4. **Accéder à l'application**
- Frontend : http://localhost
- API : http://localhost:8000
- Docs API : http://localhost:8000/docs

### Configuration Google Calendar (optionnel)

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un projet
3. Activer l'API Google Calendar
4. Créer des credentials OAuth2 (Web application)
5. Ajouter l'URL de redirection : `http://your-domain/calendar/callback`
6. Copier le Client ID et Client Secret dans le fichier `.env`

## 📱 Utilisation PWA

### Android
1. Ouvrir Chrome sur l'URL de l'application
2. Appuyer sur "Ajouter à l'écran d'accueil"
3. L'application s'installe comme une app native

### iOS
1. Ouvrir Safari sur l'URL
2. Tapper le bouton Partager → "Sur l'écran d'accueil"

### macOS
1. Ouvrir Chrome/Edge sur l'URL
2. Cliquer sur l'icône d'installation dans la barre d'adresse

## 🛠️ Développement

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📚 API Endpoints

### Tâches
- `GET /tasks/` - Liste des tâches
- `POST /tasks/` - Créer une tâche
- `PUT /tasks/{id}` - Modifier une tâche
- `DELETE /tasks/{id}` - Supprimer une tâche

### Stock
- `GET /stock/` - Liste du stock
- `POST /stock/` - Ajouter un article
- `PUT /stock/{id}` - Modifier un article
- `POST /stock/{id}/adjust-quantity` - Ajuster la quantité

### Rendez-vous
- `GET /appointments/` - Liste des rendez-vous
- `POST /appointments/` - Créer un rendez-vous
- `GET /appointments/upcoming/next-3-days` - RDV dans les 3 jours

### Google Calendar
- `GET /calendar/auth-url` - URL d'autorisation OAuth
- `GET /calendar/status` - Statut de la connexion
- `POST /calendar/sync` - Synchroniser les événements
- `POST /calendar/appointments/{id}/create-event` - Créer sur Google Calendar

## 🔒 Sécurité

- Base de données SQLite locale
- Pas de données sensibles en clair
- OAuth2 pour Google Calendar
- CORS configuré

## 📝 License

MIT License - Propriété de Safe HDF

---

Développé avec ❤️ pour Rémy et Safe HDF