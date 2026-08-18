import React, { useState, useEffect } from 'react';
import api from '../api';
import { UploadCloud, Plus, RefreshCw, AlertCircle, CheckCircle, Database } from 'lucide-react';

export default function HierarchyManager() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    zonal: '', taluk: '', gram: '', booth: '', village: ''
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/locations');
      setLocations(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/locations', formData);
      setMessage('Location added successfully!');
      setFormData({ zonal: '', taluk: '', gram: '', booth: '', village: '' });
      fetchLocations();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding location');
    }
  };

  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      setCsvFile(null);
      setError('Please select a valid CSV file.');
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setError('');
    setMessage('');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      // Assume first line is header and verify it (optional, but good practice)
      const parsedLocations = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple comma split (doesn't handle quotes perfectly, but fine for simple strings)
        const parts = lines[i].split(',').map(s => s.trim());
        if (parts.length >= 5) {
          parsedLocations.push({
            zonal: parts[0],
            taluk: parts[1],
            gram: parts[2],
            booth: parts[3],
            village: parts[4]
          });
        }
      }

      if (parsedLocations.length === 0) {
        setError('No valid locations found in CSV. Expected columns: Zonal, Taluk, Gram, Booth, Village');
        return;
      }

      try {
        const res = await api.post('/locations/bulk', { locations: parsedLocations });
        setMessage(res.data.message);
        setCsvFile(null);
        document.getElementById('csvInput').value = '';
        fetchLocations();
      } catch (err) {
        setError(err.response?.data?.error || 'Error uploading CSV data');
      }
    };
    reader.readAsText(csvFile);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
          <Database className="w-8 h-8 mr-3 text-indigo-500" />
          Hierarchy Manager
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> {error}
        </div>
      )}
      {message && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Manual Entry */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Add Single Location</h2>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zonal (ZP)</label>
                <input type="text" name="zonal" value={formData.zonal} onChange={handleInputChange} required className="input-field" placeholder="e.g. North Zone" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Taluk (TP)</label>
                <input type="text" name="taluk" value={formData.taluk} onChange={handleInputChange} required className="input-field" placeholder="e.g. Central Taluk" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gram Panchayat</label>
                <input type="text" name="gram" value={formData.gram} onChange={handleInputChange} required className="input-field" placeholder="e.g. Main Gram" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Booth</label>
                <input type="text" name="booth" value={formData.booth} onChange={handleInputChange} required className="input-field" placeholder="e.g. Booth 12" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Village</label>
                <input type="text" name="village" value={formData.village} onChange={handleInputChange} required className="input-field" placeholder="e.g. TestVillage" />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full flex justify-center items-center py-2.5">
              <Plus className="w-5 h-5 mr-2" /> Add Location
            </button>
          </form>
        </div>

        {/* CSV Upload */}
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Bulk Upload via CSV</h2>
          <div className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50">
            <UploadCloud className="w-12 h-12 text-indigo-500 mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
              Upload a CSV with columns:<br/> <span className="font-mono text-xs">Zonal, Taluk, Gram, Booth, Village</span>
            </p>
            <input type="file" id="csvInput" accept=".csv" onChange={handleCsvChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400" />
          </div>
          <button 
            onClick={handleCsvUpload} 
            disabled={!csvFile}
            className="btn-primary w-full mt-4 flex justify-center items-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="w-5 h-5 mr-2" /> Upload CSV
          </button>
        </div>
      </div>

      {/* Locations Table */}
      <div className="glass-panel overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
            Current Hierarchy
          </h2>
          <button onClick={fetchLocations} className="text-sm flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500">Zonal</th>
                <th className="px-6 py-3 font-medium text-slate-500">Taluk</th>
                <th className="px-6 py-3 font-medium text-slate-500">Gram</th>
                <th className="px-6 py-3 font-medium text-slate-500">Booth</th>
                <th className="px-6 py-3 font-medium text-slate-500">Village</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {locations.length > 0 ? locations.map((loc) => (
                <tr key={loc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{loc.zonal}</td>
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{loc.taluk}</td>
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{loc.gram}</td>
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{loc.booth}</td>
                  <td className="px-6 py-3 font-medium text-indigo-600 dark:text-indigo-400">{loc.village}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No locations added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
