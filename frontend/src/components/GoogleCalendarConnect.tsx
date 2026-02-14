import { useEffect, useState } from 'react';
import { Calendar, Check, X, RefreshCw, ExternalLink } from 'lucide-react';
import { useGoogleCalendarStore } from '../stores/googleCalendarStore';
import { Button } from './Button';

export function GoogleCalendarConnect() {
  const { isConnected, email, checkStatus, disconnect, getAuthUrl, loading } = useGoogleCalendarStore();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const handleConnect = async () => {
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      alert('Erreur: Les credentials Google ne sont pas configurés. Veuillez contacter l\'administrateur.');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await useGoogleCalendarStore.getState().syncCalendar();
      alert(`Synchronisation réussie! ${result.imported} nouveaux, ${result.updated} mis à jour`);
    } catch (error) {
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  if (isConnected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Connecté à Google Calendar</h3>
              <p className="text-sm text-green-700">{email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleSync}
              isLoading={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Synchroniser
            </Button>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              <X className="w-4 h-4 mr-2" />
              Déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">Google Calendar</h3>
            <p className="text-sm text-slate-500">Synchronisez vos rendez-vous</p>
          </div>
        </div>
        <Button onClick={handleConnect} isLoading={loading}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Connecter
        </Button>
      </div>
    </div>
  );
}