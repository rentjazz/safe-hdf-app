import { useEffect } from 'react';
import { 
  CheckSquare, 
  Package, 
  Calendar, 
  AlertTriangle,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { useDashboardStore } from '../stores/dashboardStore';
import { useAppointmentsStore } from '../stores/appointmentsStore';
import { formatDateTime, getPriorityColor, getPriorityLabel, formatRelativeDate } from '../utils/helpers';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { stats, fetchStats } = useDashboardStore();
  const { appointments, fetchAppointments } = useAppointmentsStore();

  useEffect(() => {
    fetchStats();
    fetchAppointments({ limit: 5 });
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500">Vue d'ensemble de Safe HDF</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-500">Tâches en cours</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.tasks_by_status?.in_progress || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-500">Tâches en retard</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.tasks_overdue || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-500">Stock faible</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.low_stock_items || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-500">RDV 3 jours</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.appointments_next_3_days || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Prochains rendez-vous</CardTitle>
            <Link to="/appointments" className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              Voir tout <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Aucun rendez-vous à venir</p>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="flex items-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{apt.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(apt.start_time)}
                      </p>
                    </div>
                    {apt.is_synced && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Google
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Tâches terminées</span>
                  <span className="font-medium">
                    {stats?.tasks_by_status?.done || 0} / {stats?.total_tasks || 0}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: stats?.total_tasks 
                        ? `${(stats.tasks_by_status?.done / stats.total_tasks) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Stock total</span>
                  <span className="font-medium">{stats?.total_stock_items || 0} articles</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: stats?.total_stock_items 
                        ? `${Math.min((stats.total_stock_items / 100) * 100, 100)}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-medium text-slate-900 mb-3">Répartition des tâches</h4>
                <div className="flex gap-2">
                  {Object.entries(stats?.tasks_by_status || {}).map(([status, count]) => (
                    <div key={status} className="flex-1 text-center p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-900">{count as number}</p>
                      <p className="text-xs text-slate-500 capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}