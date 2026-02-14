import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar as CalendarIcon, MapPin, User, ExternalLink } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAppointmentsStore, Appointment } from '../stores/appointmentsStore';
import { useGoogleCalendarStore } from '../stores/googleCalendarStore';
import { GoogleCalendarConnect } from '../components/GoogleCalendarConnect';
import { formatDateTime, formatRelativeDate, getStatusColor, getStatusLabel } from '../utils/helpers';

export function Appointments() {
  const { appointments, loading, fetchAppointments, createAppointment, updateAppointment, deleteAppointment } = useAppointmentsStore();
  const { isConnected, pushToCalendar } = useGoogleCalendarStore();
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    status: 'scheduled',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
    };
    
    if (editingAppointment) {
      await updateAppointment(editingAppointment.id, data);
    } else {
      await createAppointment(data);
    }
    
    setShowModal(false);
    setEditingAppointment(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      status: 'scheduled',
    });
  };

  const handleEdit = (apt: Appointment) => {
    setEditingAppointment(apt);
    setFormData({
      title: apt.title,
      description: apt.description || '',
      start_time: apt.start_time ? new Date(apt.start_time).toISOString().slice(0, 16) : '',
      end_time: apt.end_time ? new Date(apt.end_time).toISOString().slice(0, 16) : '',
      location: apt.location || '',
      contact_name: apt.contact_name || '',
      contact_phone: apt.contact_phone || '',
      contact_email: apt.contact_email || '',
      status: apt.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      await deleteAppointment(id);
    }
  };

  const handleSyncToGoogle = async (apt: Appointment) => {
    setSyncingId(apt.id);
    try {
      const result = await pushToCalendar(apt.id);
      alert('Synchronisé avec succès!');
      fetchAppointments();
    } catch (error) {
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncingId(null);
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (apt.contact_name && apt.contact_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (apt.location && apt.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const upcomingAppointments = filteredAppointments.filter(
    apt => new Date(apt.start_time) >= new Date() && apt.status === 'scheduled'
  );
  const pastAppointments = filteredAppointments.filter(
    apt => new Date(apt.start_time) < new Date() || apt.status !== 'scheduled'
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rendez-vous</h1>
          <p className="text-slate-500">Gérez vos rendez-vous et synchronisez avec Google Calendar</p>
        </div>
        <Button onClick={() => { setEditingAppointment(null); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      {/* Google Calendar Connection */}
      <div className="mb-6">
        <GoogleCalendarConnect />
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un rendez-vous..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>À venir</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Chargement...</div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Aucun rendez-vous à venir</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {upcomingAppointments.map((apt) => (
                <AppointmentRow 
                  key={apt.id} 
                  apt={apt} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSync={isConnected ? () => handleSyncToGoogle(apt) : undefined}
                  syncing={syncingId === apt.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Passés / Terminés</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {pastAppointments.slice(0, 5).map((apt) => (
                <AppointmentRow 
                  key={apt.id} 
                  apt={apt} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isPast
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold">
                {editingAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Titre"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Début"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
                <Input
                  label="Fin (optionnel)"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
              <Input
                label="Lieu"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Adresse ou salle"
              />
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Contact</h4>
                <div className="space-y-3">
                  <Input
                    label="Nom"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingAppointment ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

interface AppointmentRowProps {
  apt: Appointment;
  onEdit: (apt: Appointment) => void;
  onDelete: (id: number) => void;
  onSync?: () => void;
  syncing?: boolean;
  isPast?: boolean;
}

function AppointmentRow({ apt, onEdit, onDelete, onSync, syncing, isPast }: AppointmentRowProps) {
  return (
    <div className={`p-4 ${isPast ? 'bg-slate-50' : 'hover:bg-slate-50'} transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-medium ${isPast ? 'text-slate-500' : 'text-slate-900'}`}>
              {apt.title}
            </h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(apt.status)}`}>
              {getStatusLabel(apt.status)}
            </span>
            {apt.is_synced && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                Google
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-1">
            <span className="flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {formatDateTime(apt.start_time)}
            </span>
            {!isPast && (
              <span className="text-primary-600 font-medium">
                {formatRelativeDate(apt.start_time)}
              </span>
            )}
          </div>
          {apt.location && (
            <p className="text-xs text-slate-500 flex items-center mb-1">
              <MapPin className="w-3 h-3 mr-1" />
              {apt.location}
            </p>
          )}
          {apt.contact_name && (
            <p className="text-xs text-slate-500 flex items-center">
              <User className="w-3 h-3 mr-1" />
              {apt.contact_name}
              {apt.contact_phone && ` • ${apt.contact_phone}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {onSync && (
            <button
              onClick={onSync}
              disabled={syncing}
              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
              title="Synchroniser avec Google Calendar"
            >
              <ExternalLink className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => onEdit(apt)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(apt.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}