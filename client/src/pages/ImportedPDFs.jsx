import { useState, useEffect } from 'react';
import api from '../api';
import { Trash2, File } from 'lucide-react';

export default function ImportedPDFs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will delete the PDF record and ALL associated extracted voters.')) return;
    try {
      await api.delete(`/pdf/${id}`);
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert('Error deleting file');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Imported PDFs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <div key={job._id} className="glass-panel p-6 relative group">
            <button 
              onClick={() => handleDelete(job._id)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex items-center mb-4">
              <File className="w-10 h-10 text-indigo-500 mr-3" />
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate w-48" title={job.originalName}>
                  {job.originalName}
                </h3>
                <p className="text-xs text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
               <p className="text-sm flex justify-between"><span className="text-slate-500">Status:</span> <span className="capitalize font-medium">{job.status}</span></p>
               <p className="text-sm flex justify-between mt-1"><span className="text-slate-500">Pages:</span> <span>{job.totalPages}</span></p>
               <p className="text-sm flex justify-between mt-1"><span className="text-slate-500">Extracted:</span> <span className="font-bold text-indigo-600 dark:text-indigo-400">{job.totalVotersExtracted}</span></p>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-slate-500">No PDFs imported yet.</p>}
      </div>
    </div>
  );
}
