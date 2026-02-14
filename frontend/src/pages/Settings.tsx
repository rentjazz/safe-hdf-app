import { useState } from 'react';
import { Bell, Shield, Database, Info, ExternalLink } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { GoogleCalendarConnect } from '../components/GoogleCalendarConnect';

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reminders: true,
    stockAlerts: true,
  });

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500">Configurez votre application Safe HDF</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Google Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Intégration Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Connectez votre compte Google pour synchroniser vos rendez-vous et recevoir des rappels automatiques.
            </p>
            <GoogleCalendarConnect />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-slate-900">Rappels de rendez-vous</p>
                  <p className="text-sm text-slate-500">Recevoir un rappel 3 jours avant chaque rendez-vous</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.reminders}
                  onChange={(e) => setNotifications({ ...notifications, reminders: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded border-slate-300"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-slate-900">Alertes de stock</p>
                  <p className="text-sm text-slate-500">Être notifié quand un article est en stock faible</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.stockAlerts}
                  onChange={(e) => setNotifications({ ...notifications, stockAlerts: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded border-slate-300"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Authentification</p>
                  <p className="text-sm text-slate-500">Mode actuel : Accès local uniquement</p>
                </div>
                <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  Sécurisé
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Données
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Export des données</p>
                  <p className="text-sm text-slate-500">Télécharger une sauvegarde de vos données</p>
                </div>
                <Button variant="secondary" size="sm">Exporter</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              À propos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>Safe HDF App</strong> - Version 1.0.0</p>
              <p>Application de gestion pour Safe HDF</p>
              <p className="text-slate-400 mt-4">
                © 2024 Safe HDF. Tous droits réservés.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}