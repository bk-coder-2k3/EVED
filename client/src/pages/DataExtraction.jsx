import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { UploadCloud, File, AlertCircle, CheckCircle, RefreshCw, FileText, Trash2, Database, List, X } from 'lucide-react';

export default function DataExtraction() {
  const [file, setFile] = useState(null);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [extractionMethod, setExtractionMethod] = useState('local');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  
  // Snackbar State
  const [snackbar, setSnackbar] = useState({ show: false, message: '' });
  const notifiedJobsRef = useRef(new Set());

  const showSnackbar = (message) => {
    setSnackbar({ show: true, message });
    setTimeout(() => setSnackbar({ show: false, message: '' }), 6000);
  };

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Monitor jobs for new failures to trigger snackbar
  useEffect(() => {
    jobs.forEach(job => {
      if (job.status === 'failed' && !notifiedJobsRef.current.has(job._id)) {
        if (job.error) {
          showSnackbar(`Error in "${job.originalName}": ${job.error}`);
        }
        notifiedJobsRef.current.add(job._id);
      } else if (job.status === 'completed' && !notifiedJobsRef.current.has(job._id)) {
        // Optional: also track completed jobs so we don't spam them if we wanted success snackbars
        notifiedJobsRef.current.add(job._id);
      }
    });
  }, [jobs]);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleChange = (e) => {
    validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    setMessage('');
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      setFile(null);
      return;
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      const payload = { extractionMethod };
      if (startPage && endPage) {
        payload.startPage = Number(startPage);
        payload.endPage = Number(endPage);
      }
      
      await api.post(`/process/${res.data.job._id}`, payload);
      setMessage('File uploaded and processing has started!');
      setFile(null);
      fetchJobs();

      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading file.');
    } finally {
      setUploading(false);
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing': return <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Upload Section */}
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center">
          <Database className="w-6 h-6 mr-3 text-indigo-500" />
          Upload & Extract New PDF
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div 
              className="h-full border-2 border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10 rounded-2xl p-12 flex flex-col items-center justify-center transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleChange} accept="application/pdf" />
              <UploadCloud className="w-16 h-16 text-primary-500 mb-4" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Drag & Drop your PDF here</p>
              <p className="text-sm text-slate-500 mt-2">or click to browse (Max 100MB)</p>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            {file ? (
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center">
                    <File className="w-8 h-8 text-indigo-500 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-slate-800 dark:text-white truncate w-48" title={file.name}>{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }} 
                    className="text-red-500 text-sm font-medium hover:underline"
                    disabled={uploading}
                  >
                    Remove
                  </button>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
                  <h3 className="font-medium text-slate-800 dark:text-white mb-3">Extraction Options</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Start Page (optional)</label>
                      <input type="number" min="1" value={startPage} onChange={e => setStartPage(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. 1" />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">End Page (optional)</label>
                      <input type="number" min="1" value={endPage} onChange={e => setEndPage(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. 5" />
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Extraction Method</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input type="radio" value="local" checked={extractionMethod === 'local'} onChange={(e) => setExtractionMethod(e.target.value)} className="w-4 h-4 text-primary-600 focus:ring-primary-500 mr-2" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Local OCR (Fast & Free)</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input type="radio" value="ai" checked={extractionMethod === 'ai'} onChange={(e) => setExtractionMethod(e.target.value)} className="w-4 h-4 text-primary-600 focus:ring-primary-500 mr-2" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI OCR (Gemini)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button 
                  className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all ${uploading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? `Uploading... ${progress}%` : 'Upload and Extract'}
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-transparent p-12">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p>Select a PDF to configure extraction options.</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {message}
          </div>
        )}
      </div>

      {/* Queue & Processed Files Section */}
      <div className="glass-panel overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            <List className="w-5 h-5 mr-3 text-indigo-500" />
            Extraction Queue & History
          </h2>
          <button onClick={fetchJobs} className="flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
        </div>

        {loadingJobs ? (
          <div className="p-8 text-center text-slate-500">Loading queue...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <Database className="w-12 h-12 mb-4 opacity-20" />
            <p>No PDFs have been uploaded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">File Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Progress</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Voters</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {jobs.map(job => (
                  <tr key={job._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate w-48" title={job.originalName}>{job.originalName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center capitalize text-slate-700 dark:text-slate-300">
                        {getStatusIcon(job.status)}
                        <span className="ml-2 text-sm font-medium">{job.status}</span>
                      </div>
                      {job.error && <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={job.error}>{job.error}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1 mb-1">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${job.totalPages > 0 ? (job.processedPages / job.totalPages) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{job.processedPages} / {job.totalPages || '?'} Pages</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {job.totalVotersExtracted}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(job._id)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete PDF and Extracted Voters"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snackbar Notification */}
      {snackbar.show && (
        <div className="fixed top-6 right-6 bg-red-600/90 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-2xl flex items-center z-50 transform transition-all duration-300">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium mr-4">{snackbar.message}</span>
          <button onClick={() => setSnackbar({ show: false, message: '' })} className="ml-auto text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

    </div>
  );
}
