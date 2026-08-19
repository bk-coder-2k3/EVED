import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/api';

const Combobox = ({ name, label, value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm text-on-surface-variant mb-1">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          name={name}
          value={value} 
          onChange={(e) => {
            onChange(e);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          required 
          className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none transition-shadow text-on-surface" 
          autoComplete="off"
        />
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
          arrow_drop_down
        </span>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg max-h-48 overflow-y-auto overflow-x-hidden">
          {filteredOptions.map((opt) => (
            <div 
              key={opt} 
              className="px-4 py-2 cursor-pointer hover:bg-surface-container text-on-surface text-sm break-words"
              onClick={() => {
                onChange({ target: { name, value: opt } });
                setIsOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function HierarchyManager() {
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection state for cascading panels
  const [selectedZonal, setSelectedZonal] = useState(null);
  const [selectedTaluk, setSelectedTaluk] = useState(null);
  const [selectedGram, setSelectedGram] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignTeamModalOpen, setIsAssignTeamModalOpen] = useState(false);
  const [singleLocationToAssign, setSingleLocationToAssign] = useState(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [message, setMessage] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [formData, setFormData] = useState({
    zonal: '', taluk: '', gram: '', booth: '', village: ''
  });

  useEffect(() => {
    fetchLocations();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/auth/employee');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

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

  // Compute unique lists based on selections
  const zonals = [...new Set(locations.map(l => l.zonal))].sort();
  
  const taluksForZonal = selectedZonal 
    ? [...new Set(locations.filter(l => l.zonal === selectedZonal).map(l => l.taluk))].sort()
    : [];
    
  const gramsForTaluk = selectedTaluk
    ? [...new Set(locations.filter(l => l.taluk === selectedTaluk).map(l => l.gram))].sort()
    : [];

  // Computed lists for Add Location Auto-complete
  const acZonals = [...new Set(locations.map(l => l.zonal))].sort();
  const acTaluks = [...new Set(locations.filter(l => !formData.zonal || l.zonal === formData.zonal).map(l => l.taluk))].sort();
  const acGrams = [...new Set(locations.filter(l => !formData.taluk || l.taluk === formData.taluk).map(l => l.gram))].sort();
  const acBooths = [...new Set(locations.filter(l => !formData.gram || l.gram === formData.gram).map(l => l.booth))].sort();

  const locationsInSelection = locations.filter(l => {
    if (selectedGram) return l.gram === selectedGram;
    if (selectedTaluk) return l.taluk === selectedTaluk;
    if (selectedZonal) return l.zonal === selectedZonal;
    return false;
  });

  // --- Handlers for Forms ---
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
      setTimeout(() => {
        setMessage('');
        setIsAddModalOpen(false);
      }, 2000);
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
      
      const parsedLocations = [];
      for (let i = 1; i < lines.length; i++) {
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
        setError('No valid locations found in CSV.');
        return;
      }

      try {
        const res = await api.post('/locations/bulk', { locations: parsedLocations });
        setMessage(res.data.message);
        setCsvFile(null);
        fetchLocations();
        setTimeout(() => {
          setMessage('');
          setIsAddModalOpen(false);
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.error || 'Error uploading CSV data');
      }
    };
    reader.readAsText(csvFile);
  };

  const handleAssignTeam = async () => {
    if (selectedEmployeeIds.length === 0) return;
    setError('');
    setMessage('');
    try {
      const newVillageIds = singleLocationToAssign 
        ? [singleLocationToAssign._id] 
        : locationsInSelection.map(l => l._id);
        
      await Promise.all(selectedEmployeeIds.map(async (empId) => {
        const emp = employees.find(e => e._id === empId);
        if (!emp) return;
        
        const existingVillages = emp.assignedVillages || [];
        const updatedVillages = [...new Set([...existingVillages.map(v => v.toString()), ...newVillageIds.map(id => id.toString())])];
        
        return api.put(`/auth/employee/${empId}/villages`, {
          assignedVillages: updatedVillages
        });
      }));
      
      setMessage(`Successfully assigned ${newVillageIds.length} location(s) to ${selectedEmployeeIds.length} employee(s).`);
      setIsAssignTeamModalOpen(false);
      setSelectedEmployeeIds([]);
      setSingleLocationToAssign(null);
      fetchEmployees();
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign team');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden relative pb-10">
      
      {/* Top Header */}
      <header className="flex justify-between items-center w-full h-auto min-h-[64px] py-2 px-container-padding sticky top-0 z-40 bg-surface/90 backdrop-blur-md text-on-surface font-body-sm text-body-sm shadow-sm shrink-0 gap-2">
        <div className="hidden md:flex items-center gap-4 w-1/3 shrink-0">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-body-sm" placeholder="Search hierarchies, zones, or villages..." type="text"/>
          </div>
        </div>
        <div className="flex items-center md:justify-center flex-1 shrink-0 min-w-0">
          <span className="font-headline-sm text-headline-sm font-bold text-primary truncate">Hierarchy Manager</span>
        </div>
        <div className="flex items-center justify-end gap-2 md:w-1/3 shrink-0">
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-3 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg font-medium text-xs md:text-sm shadow-sm transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[16px] md:text-[18px] mr-1 md:mr-2">add</span>
            Add Location
          </button>
          <button onClick={() => fetchLocations()} className="p-2 text-on-surface-variant hover:text-primary transition-colors shrink-0" title="Refresh">
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
          </button>
        </div>
      </header>

      {/* Main Workspace: Cascading Panels */}
      <main className="flex-1 overflow-x-auto flex flex-row bg-surface-container-lowest p-gutter gap-gutter h-full scrollbar-hide snap-x snap-mandatory">
        
        {/* Panel 1: Zonal */}
        <div className="w-[85vw] min-w-[280px] md:w-auto md:min-w-[320px] md:max-w-[320px] snap-center flex flex-col bg-surface rounded-xl border border-outline-variant shadow-sm h-full overflow-hidden shrink-0">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Zonal</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {zonals.map(zonal => {
              const isActive = selectedZonal === zonal;
              const talukCount = new Set(locations.filter(l => l.zonal === zonal).map(l => l.taluk)).size;
              return (
                <div 
                  key={zonal}
                  onClick={() => { setSelectedZonal(zonal); setSelectedTaluk(null); setSelectedGram(null); }}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
                    isActive ? 'bg-primary-fixed/20 border-primary/30' : 'hover:bg-surface-container border-transparent'
                  }`}
                >
                  <div>
                    <div className="font-body-md text-on-surface font-medium">{zonal}</div>
                    <div className="font-body-sm text-on-surface-variant text-xs mt-1">{talukCount} Taluks</div>
                  </div>
                  <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Taluk */}
        <div className={`w-[85vw] min-w-[280px] md:w-auto md:min-w-[320px] md:max-w-[320px] snap-center flex flex-col bg-surface rounded-xl border border-outline-variant shadow-sm h-full overflow-hidden shrink-0 transition-opacity ${!selectedZonal ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 truncate">
              {selectedZonal && <span className="text-on-surface-variant/50 text-sm truncate max-w-[100px]">{selectedZonal} /</span>} Taluk
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedZonal ? (
              <div className="h-full flex items-center justify-center text-center p-4">
                <p className="text-on-surface-variant font-body-sm">Select a Zonal to view Taluks</p>
              </div>
            ) : taluksForZonal.map(taluk => {
              const isActive = selectedTaluk === taluk;
              const gramCount = new Set(locations.filter(l => l.taluk === taluk).map(l => l.gram)).size;
              return (
                <div 
                  key={taluk}
                  onClick={() => { setSelectedTaluk(taluk); setSelectedGram(null); }}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
                    isActive ? 'bg-primary-fixed/20 border-primary/30' : 'hover:bg-surface-container border-transparent'
                  }`}
                >
                  <div>
                    <div className="font-body-md text-on-surface font-medium">{taluk}</div>
                    <div className="font-body-sm text-on-surface-variant text-xs mt-1">{gramCount} Grams</div>
                  </div>
                  <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 3: Gram */}
        <div className={`w-[85vw] min-w-[280px] md:w-auto md:min-w-[320px] md:max-w-[320px] snap-center flex flex-col bg-surface rounded-xl border border-outline-variant shadow-sm h-full overflow-hidden shrink-0 transition-opacity ${!selectedTaluk ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 truncate">
              {selectedTaluk && <span className="text-on-surface-variant/50 text-sm truncate max-w-[100px]">{selectedTaluk} /</span>} Gram
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedTaluk ? (
              <div className="h-full flex items-center justify-center text-center p-4">
                <p className="text-on-surface-variant font-body-sm">Select a Taluk to view Grams</p>
              </div>
            ) : gramsForTaluk.map(gram => {
              const isActive = selectedGram === gram;
              const villageCount = locations.filter(l => l.gram === gram).length;
              return (
                <div 
                  key={gram}
                  onClick={() => setSelectedGram(gram)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
                    isActive ? 'bg-primary-fixed/20 border-primary/30' : 'hover:bg-surface-container border-transparent'
                  }`}
                >
                  <div>
                    <div className="font-body-md text-on-surface font-medium">{gram}</div>
                    <div className="font-body-sm text-on-surface-variant text-xs mt-1">{villageCount} Locations</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 w-[90vw] min-w-[300px] md:min-w-[400px] md:w-auto snap-center flex flex-col bg-surface rounded-xl border border-outline-variant shadow-sm h-full overflow-hidden shrink-0">
          {!selectedZonal && !selectedTaluk && !selectedGram ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant p-8 text-center">
              <span className="material-symbols-outlined text-[64px] opacity-20 mb-4">account_tree</span>
              <h2 className="font-headline-sm text-headline-sm mb-2">Hierarchy Overview</h2>
              <p className="max-w-xs">Select nodes from the left panels to drill down into the hierarchy and see specifics.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-outline-variant bg-surface-container-lowest shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs font-label-caps text-on-surface-variant mb-1 uppercase tracking-wider">
                      {selectedGram ? 'Gram Details' : selectedTaluk ? 'Taluk Details' : 'Zonal Details'}
                    </div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                      {selectedGram || selectedTaluk || selectedZonal}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setSingleLocationToAssign(null);
                      setIsAssignTeamModalOpen(true);
                    }} className="px-4 py-2 text-sm font-medium rounded-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors shadow-sm">Assign Team</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/50">
                    <div className="text-xs text-on-surface-variant mb-1">Total Hierarchy Nodes</div>
                    <div className="font-metric-sm text-metric-sm text-on-surface">{locationsInSelection.length}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface z-10 shadow-sm">
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps border-b border-outline-variant">
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider">Village</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider">Booth</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-table-data text-table-data text-on-surface divide-y divide-outline-variant/50">
                    {locationsInSelection.map((loc) => (
                      <tr key={loc._id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-6 py-3 font-medium text-primary">{loc.village}</td>
                        <td className="px-6 py-3">{loc.booth}</td>
                        <td className="px-6 py-3 text-right">
                          <button 
                            onClick={() => {
                              setSingleLocationToAssign(loc);
                              setIsAssignTeamModalOpen(true);
                            }}
                            className="text-on-surface-variant hover:text-primary transition-colors p-1 mr-2" 
                            title="Assign Single Village"
                          >
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                          </button>
                          <button className="text-on-surface-variant hover:text-error transition-colors p-1" title="Remove">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-outline-variant">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="text-lg font-bold text-on-surface">Add Hierarchy Data</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-surface-container-lowest grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Manual Entry */}
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Add Single Location</h3>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <Combobox name="zonal" label="Zonal (ZP)" value={formData.zonal} onChange={handleInputChange} options={acZonals} />
                    <Combobox name="taluk" label="Taluk (TP)" value={formData.taluk} onChange={handleInputChange} options={acTaluks} />
                    <Combobox name="gram" label="Gram Panchayat" value={formData.gram} onChange={handleInputChange} options={acGrams} />
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Combobox name="booth" label="Booth" value={formData.booth} onChange={handleInputChange} options={acBooths} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm text-on-surface-variant mb-1">Village</label>
                        <input type="text" name="village" value={formData.village} onChange={handleInputChange} required className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface focus:ring-2 focus:ring-primary outline-none transition-shadow text-on-surface" autoComplete="off" />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors shadow-sm mt-2">
                    Add Location
                  </button>
                </form>
              </div>

              {/* CSV Upload */}
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Bulk Upload CSV</h3>
                <div className="flex-1 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-6 bg-surface hover:border-primary transition-colors cursor-pointer group">
                  <span className="material-symbols-outlined text-4xl text-primary/70 mb-3 group-hover:scale-110 transition-transform">cloud_upload</span>
                  <p className="text-sm text-on-surface-variant mb-4 text-center">
                    Columns: <span className="font-mono text-[10px] bg-surface-container px-1 py-0.5 rounded text-on-surface">Zonal, Taluk, Gram, Booth, Village</span>
                  </p>
                  <input type="file" accept=".csv" onChange={handleCsvChange} className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-fixed file:text-on-primary-fixed hover:file:bg-primary-fixed-dim cursor-pointer transition-colors" />
                </div>
                <button 
                  onClick={handleCsvUpload} 
                  disabled={!csvFile}
                  className={`w-full mt-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm ${!csvFile ? 'bg-primary/50 text-on-primary/70 cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary/90'}`}
                >
                  Upload CSV
                </button>
              </div>
            </div>

            {(error || message) && (
              <div className={`p-4 text-sm font-medium border-t ${error ? 'bg-error-container text-on-error-container border-error/20' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                {error || message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Team Modal */}
      {isAssignTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-outline-variant">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="text-lg font-bold text-on-surface">
                {singleLocationToAssign ? `Assign Team to ${singleLocationToAssign.village}` : `Assign Team to ${selectedGram || selectedTaluk || selectedZonal}`}
              </h2>
              <button onClick={() => { setIsAssignTeamModalOpen(false); setSingleLocationToAssign(null); setSelectedEmployeeIds([]); }} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-on-surface-variant mb-4">
                You are about to assign <strong>{singleLocationToAssign ? 1 : locationsInSelection.length}</strong> location(s) to an employee.
              </p>
              <label className="block text-sm text-on-surface-variant mb-2">Select Employees</label>
              <div className="max-h-48 overflow-y-auto border border-outline-variant rounded-lg bg-surface mb-6 p-2 space-y-1">
                {employees.length === 0 ? (
                  <div className="p-2 text-sm text-on-surface-variant">No employees available.</div>
                ) : employees.map(emp => (
                  <label key={emp._id} className="flex items-center p-2 hover:bg-surface-container rounded cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
                      checked={selectedEmployeeIds.includes(emp._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployeeIds([...selectedEmployeeIds, emp._id]);
                        } else {
                          setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp._id));
                        }
                      }}
                    />
                    <span className="ml-3 text-sm font-medium text-on-surface">{emp.name} ({emp.employeeId})</span>
                  </label>
                ))}
              </div>
              
              <div className="flex justify-end gap-3">
                <button onClick={() => { setIsAssignTeamModalOpen(false); setSingleLocationToAssign(null); setSelectedEmployeeIds([]); }} className="px-4 py-2 font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">Cancel</button>
                <button onClick={handleAssignTeam} disabled={selectedEmployeeIds.length === 0} className="px-4 py-2 font-medium bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50">Confirm Assignment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast for Success Message */}
      {message && !isAddModalOpen && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-100 text-emerald-800 px-4 py-3 rounded-lg shadow-lg font-medium border border-emerald-200">
          {message}
        </div>
      )}
    </div>
  );
}
