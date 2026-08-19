import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/api';

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
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    jobs.forEach(job => {
      if (job.status === 'failed' && !notifiedJobsRef.current.has(job._id)) {
        if (job.error) {
          showSnackbar(`Error in "${job.originalName}": ${job.error}`);
        }
        notifiedJobsRef.current.add(job._id);
      } else if (job.status === 'completed' && !notifiedJobsRef.current.has(job._id)) {
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

  return (
    <div className="space-y-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">PDF Data Extraction</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Upload and process electoral roll documents into structured datasets.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={fetchJobs} className="h-9 px-4 rounded-lg bg-surface border border-outline-variant text-on-surface font-medium hover:bg-surface-container-low transition-colors flex items-center space-x-2 text-sm shadow-sm">
            <span className="material-symbols-outlined text-base">sync</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Zone (Premium Drag & Drop) */}
        <div 
          className="w-full border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest transition-all hover:border-primary hover:bg-primary-fixed/5 group relative overflow-hidden flex flex-col items-center justify-center py-16 px-6 text-center shadow-sm cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleChange} accept="application/pdf" />
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-fixed-dim via-transparent to-transparent"></div>
          <div className="w-16 h-16 rounded-full bg-primary-container/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-4xl text-primary/70">cloud_upload</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Drag and drop electoral PDFs here</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mb-6">Supported formats: PDF (Scanned or Digital). Maximum file size: 100MB per document.</p>
          <div className="inline-flex items-center space-x-2 bg-surface border border-outline-variant rounded-full px-4 py-1.5 text-xs font-medium text-on-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
            <span>End-to-end encrypted processing</span>
          </div>
        </div>

        {/* Selected File Details */}
        <div className="flex flex-col justify-between">
          {file ? (
            <div className="space-y-4">
              <div className="p-4 bg-surface rounded-xl flex items-center justify-between border border-outline-variant shadow-sm">
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-primary text-[32px] mr-3">description</span>
                  <div className="text-left">
                    <p className="font-medium text-on-surface truncate w-48" title={file.name}>{file.name}</p>
                    <p className="text-sm text-on-surface-variant">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }} 
                  className="text-error text-sm font-medium hover:underline"
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
              
              <div className="p-4 bg-surface rounded-xl border border-outline-variant shadow-sm text-left">
                <h3 className="font-medium text-on-surface mb-3">Extraction Options</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Start Page (optional)</label>
                    <input type="number" min="1" value={startPage} onChange={e => setStartPage(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-shadow text-on-surface" placeholder="e.g. 1" />
                  </div>
                  <div>
                    <label className="block text-sm text-on-surface-variant mb-1">End Page (optional)</label>
                    <input type="number" min="1" value={endPage} onChange={e => setEndPage(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-shadow text-on-surface" placeholder="e.g. 5" />
                  </div>
                </div>
                
                <div className="mb-2">
                  <label className="block text-sm text-on-surface-variant mb-2">Extraction Method</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="local" checked={extractionMethod === 'local'} onChange={(e) => setExtractionMethod(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary mr-2" />
                      <span className="text-sm font-medium text-on-surface">Local OCR (Fast)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="ai" checked={extractionMethod === 'ai'} onChange={(e) => setExtractionMethod(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary mr-2" />
                      <span className="text-sm font-medium text-on-surface">AI OCR (Gemini)</span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                className={`w-full py-3 px-4 rounded-xl text-on-primary font-semibold transition-all ${uploading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-sm'}`}
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? `Uploading... ${progress}%` : 'Upload and Extract'}
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant border-2 border-transparent p-12">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-30">description</span>
              <p>Select a PDF to configure extraction options.</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-error-container text-on-error-container rounded-lg flex items-center">
          <span className="material-symbols-outlined w-5 h-5 mr-2">error</span>
          {error}
        </div>
      )}
      {message && (
        <div className="mt-4 p-4 bg-emerald-100 text-emerald-800 rounded-lg flex items-center">
          <span className="material-symbols-outlined w-5 h-5 mr-2">check_circle</span>
          {message}
        </div>
      )}

      {/* Processing Queue Table */}
      <div className="flex flex-col space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center">
            Processing Queue
            <span className="ml-3 inline-flex items-center justify-center bg-surface-container-highest text-on-surface text-xs font-bold rounded-full px-2 py-0.5">
              {jobs.filter(j => j.status === 'processing').length} Active
            </span>
          </h3>
        </div>
        
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {loadingJobs ? (
            <div className="p-8 text-center text-on-surface-variant">Loading queue...</div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant flex flex-col items-center">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-20">database</span>
              <p>No PDFs have been uploaded yet.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-label-caps text-label-caps border-b border-outline-variant">
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider w-1/4">File Name</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Pages</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Processed</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-right">Extracted</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-table-data text-table-data text-on-surface divide-y divide-outline-variant/50">
                  {jobs.map(job => (
                    <tr key={job._id} className="hover:bg-surface-container-lowest transition-colors h-[56px]">
                      <td className="px-4 py-2 flex items-center space-x-3 mt-1.5">
                        <span className="material-symbols-outlined text-outline">description</span>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px]" title={job.originalName}>{job.originalName}</span>
                          {job.error && <span className="text-[10px] text-error truncate max-w-[200px]" title={job.error}>{job.error}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-on-surface-variant">{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        {job.status === 'processing' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary-fixed-dim/30">
                            <span className="material-symbols-outlined text-[14px] mr-1 animate-spin">sync</span>
                            Processing
                          </span>
                        )}
                        {job.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim/30">
                            <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                            Completed
                          </span>
                        )}
                        {job.status === 'failed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error-container text-on-error-container border border-error/20">
                            <span className="material-symbols-outlined text-[14px] mr-1">error</span>
                            Failed
                          </span>
                        )}
                        {job.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">
                            <span className="material-symbols-outlined text-[14px] mr-1">hourglass_empty</span>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">{job.totalPages || '?'}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col items-end">
                          <span>{job.processedPages}</span>
                          {job.totalPages > 0 && (
                            <div className="w-16 h-1 bg-surface-variant rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${(job.processedPages / job.totalPages) * 100}%` }}></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">{job.totalVotersExtracted}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => handleDelete(job._id)} className="text-on-surface-variant hover:text-error transition-colors" title="Delete PDF and Extracted Voters">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Snackbar Notification */}
      {snackbar.show && (
        <div className="fixed top-6 right-6 bg-error text-on-error px-6 py-4 rounded-xl shadow-2xl flex items-center z-50 transform transition-all duration-300">
          <span className="material-symbols-outlined w-5 h-5 mr-3 flex-shrink-0">error</span>
          <span className="font-medium mr-4">{snackbar.message}</span>
          <button onClick={() => setSnackbar({ show: false, message: '' })} className="ml-auto text-on-error/80 hover:text-on-error transition-colors">
            <span className="material-symbols-outlined w-5 h-5">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
