import { useState, useEffect } from 'react';
import api from '../api';
import { RefreshCw, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProcessingQueue() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing': return <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Processing Queue</h1>
        <button onClick={fetchJobs} className="btn-secondary flex items-center">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Loading queue...</div>
        ) : jobs.length === 0 ? (
           <div className="p-8 text-center text-slate-500">No jobs in queue.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">File Name</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Pages Processed</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Voters Extracted</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map(job => (
                <tr key={job._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{job.originalName}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center capitalize">
                      {getStatusIcon(job.status)}
                      <span className="ml-2 text-sm font-medium">{job.status}</span>
                    </div>
                    {job.error && <p className="text-xs text-red-500 mt-1">{job.error}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2 mb-1">
                      <div 
                        className="bg-primary-500 h-1.5 rounded-full" 
                        style={{ width: `${job.totalPages > 0 ? (job.processedPages / job.totalPages) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">{job.processedPages} / {job.totalPages || '?'}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400">{job.totalVotersExtracted}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(job.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
