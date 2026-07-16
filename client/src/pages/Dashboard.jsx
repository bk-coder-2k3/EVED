import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, RefreshCw, Users } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><RefreshCw className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  const cards = [
    { title: 'Total PDFs', value: stats?.totalPDFs || 0, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { title: 'Completed', value: stats?.completedPDFs || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { title: 'Processing', value: stats?.processingPDFs || 0, icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { title: 'Failed', value: stats?.failedPDFs || 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { title: 'Total Pages', value: stats?.totalPages || 0, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { title: 'Total Voters', value: stats?.totalVoters || 0, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Overview</h1>
          <p className="text-slate-500 mt-1">Real-time statistics of PDF extraction jobs.</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary flex items-center">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {cards.map((card, i) => (
          <div key={i} className="glass-panel p-6 flex items-center justify-between group hover:-translate-y-1 transition-transform duration-300">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
              <h3 className="text-4xl font-bold text-slate-800 dark:text-white mt-2">{card.value}</h3>
            </div>
            <div className={`p-4 rounded-full ${card.bg} ${card.color}`}>
              <card.icon className="w-8 h-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
