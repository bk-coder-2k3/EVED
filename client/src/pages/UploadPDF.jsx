import { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';

export default function UploadPDF() {
  const [file, setFile] = useState(null);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [extractionMethod, setExtractionMethod] = useState('local');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

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
      setMessage('File uploaded successfully! A background job has been created.');
      setFile(null);
      
      const payload = {
        extractionMethod
      };
      if (startPage && endPage) {
        payload.startPage = Number(startPage);
        payload.endPage = Number(endPage);
      }
      
      await api.post(`/process/${res.data.job._id}`, payload);
      setMessage('File uploaded and processing has started. Check the Processing Queue.');

    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 pb-10">
      <div className="glass-panel p-8 text-center">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Upload Electoral Roll PDF</h2>
        
        <div 
          className="border-2 border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10 rounded-2xl p-12 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleChange} accept="application/pdf" />
          <UploadCloud className="w-16 h-16 mx-auto text-primary-500 mb-4" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Drag & Drop your PDF here</p>
          <p className="text-sm text-slate-500 mt-2">or click to browse (Max 100MB)</p>
        </div>

        {file && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <File className="w-8 h-8 text-indigo-500 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-slate-800 dark:text-white">{file.name}</p>
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
            
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left">
              <h3 className="font-medium text-slate-800 dark:text-white mb-2">Extraction Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Start Page (optional)</label>
                  <input type="number" min="1" value={startPage} onChange={e => setStartPage(e.target.value)} className="input-field" placeholder="e.g. 1" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">End Page (optional)</label>
                  <input type="number" min="1" value={endPage} onChange={e => setEndPage(e.target.value)} className="input-field" placeholder="e.g. 5" />
                </div>
                <div className="col-span-2 mt-2">
                  <label className="block text-sm text-slate-600 mb-2">Extraction Method</label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="local" checked={extractionMethod === 'local'} onChange={(e) => setExtractionMethod(e.target.value)} className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 mr-2" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Local OCR (Fast & Free)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="radio" value="ai" checked={extractionMethod === 'ai'} onChange={(e) => setExtractionMethod(e.target.value)} className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 mr-2" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI OCR (Gemini - Highly Accurate)</span>
                    </label>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Leave blank to extract all pages in the PDF.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {message}
          </div>
        )}

        {uploading && (
          <div className="mt-6">
            <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        <button 
          className={`mt-8 w-full btn-primary py-3 text-lg ${(!file || uploading) && 'opacity-50 cursor-not-allowed'}`}
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Processing...' : 'Upload and Extract'}
        </button>
      </div>
    </div>
  );
}
