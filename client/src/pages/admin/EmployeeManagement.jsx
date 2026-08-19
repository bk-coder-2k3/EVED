import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, X, MapPin, Check } from 'lucide-react';
import api from '../../api/api';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    age: '',
    email: '',
    mobile: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Location State for Assignment Modal
  const [zonals, setZonals] = useState([]);
  const [taluks, setTaluks] = useState([]);
  const [grams, setGrams] = useState([]);
  const [booths, setBooths] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selZonal, setSelZonal] = useState('');
  const [selTaluk, setSelTaluk] = useState('');
  const [selGram, setSelGram] = useState('');
  const [selBooth, setSelBooth] = useState('');
  const [selLocationId, setSelLocationId] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/auth/employee');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchZonals = async () => {
    try {
      const res = await api.get('/locations/zonals');
      setZonals(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchEmployees();
    fetchZonals();
  }, []);

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const handleDobChange = (e) => {
    const dob = e.target.value;
    const age = calculateAge(dob);
    setFormData(prev => ({ ...prev, dateOfBirth: dob, age }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', dateOfBirth: '', age: '', email: '', mobile: '', password: '' });
    setMessage('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (employee) => {
    setModalMode('edit');
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name || '',
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
      age: employee.age || '',
      email: employee.email || '',
      mobile: employee.mobile || '',
      password: '' // Don't show password
    });
    setMessage('');
    setError('');
    setIsModalOpen(true);
  };

  const openDeleteModal = (employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const openAssignModal = (employee) => {
    setSelectedEmployee(employee);
    setSelZonal(''); setSelTaluk(''); setSelGram(''); setSelBooth(''); setSelLocationId('');
    setTaluks([]); setGrams([]); setBooths([]); setVillages([]);
    setIsAssignModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      if (modalMode === 'add') {
        await api.post('/auth/employee', formData);
        setMessage('Employee created successfully!');
      } else {
        await api.put(`/auth/employee/${selectedEmployee._id}`, formData);
        setMessage('Employee updated successfully!');
      }
      fetchEmployees();
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save employee');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/auth/employee/${selectedEmployee._id}`);
      fetchEmployees();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Location Handlers
  const handleZonalChange = async (e) => {
    const val = e.target.value;
    setSelZonal(val);
    setSelTaluk(''); setSelGram(''); setSelBooth(''); setSelLocationId('');
    setTaluks([]); setGrams([]); setBooths([]); setVillages([]);
    if (val) {
      const res = await api.get(`/locations/taluks?zonal=${val}`);
      setTaluks(res.data);
    }
  };

  const handleTalukChange = async (e) => {
    const val = e.target.value;
    setSelTaluk(val);
    setSelGram(''); setSelBooth(''); setSelLocationId('');
    setGrams([]); setBooths([]); setVillages([]);
    if (val) {
      const res = await api.get(`/locations/grams?taluk=${val}`);
      setGrams(res.data);
    }
  };

  const handleGramChange = async (e) => {
    const val = e.target.value;
    setSelGram(val);
    setSelBooth(''); setSelLocationId('');
    setBooths([]); setVillages([]);
    if (val) {
      const res = await api.get(`/locations/booths?gram=${val}`);
      setBooths(res.data);
    }
  };

  const handleBoothChange = async (e) => {
    const val = e.target.value;
    setSelBooth(val);
    setSelLocationId('');
    setVillages([]);
    if (val) {
      const res = await api.get(`/locations/villages?booth=${val}`);
      setVillages(res.data);
    }
  };

  const handleVillageChange = (e) => {
    setSelLocationId(e.target.value);
  };

  const handleAssignVillage = async () => {
    if (!selLocationId) return;
    try {
      // Get existing assigned villages
      const existingVillages = selectedEmployee.assignedVillages || [];
      if (existingVillages.includes(selLocationId)) {
        alert("This village is already assigned to the employee.");
        return;
      }

      const updatedVillages = [...existingVillages, selLocationId];
      
      await api.put(`/auth/employee/${selectedEmployee._id}/villages`, {
        assignedVillages: updatedVillages
      });
      fetchEmployees();
      setIsAssignModalOpen(false);
      alert('Village assigned successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to assign village.');
    }
  };

  const removeVillage = async (empId, currentVillages, villageIdToRemove) => {
    try {
      const updatedVillages = currentVillages.filter(id => id !== villageIdToRemove);
      await api.put(`/auth/employee/${empId}/villages`, {
        assignedVillages: updatedVillages
      });
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert('Failed to remove village.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-on-surface flex items-center">
          <Users className="mr-3 w-6 h-6 text-primary" />
          Employee Management
        </h2>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg font-medium text-sm shadow-sm transition-colors"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200 ">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 ">
                <th className="p-4 font-semibold text-slate-600 ">Emp ID</th>
                <th className="p-4 font-semibold text-slate-600 ">Name / Contact</th>
                <th className="p-4 font-semibold text-slate-600 ">Assigned Villages</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No employees found.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="border-b border-slate-100 hover:bg-slate-50 :bg-slate-700/50 transition-colors">
                    <td className="p-4 text-slate-800 font-medium whitespace-nowrap">{emp.employeeId || 'N/A'}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800 ">{emp.name || 'N/A'}</div>
                      <div className="text-slate-500 text-xs">{emp.mobile}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {emp.assignedVillages && emp.assignedVillages.length > 0 ? (
                          emp.assignedVillages.map((locId, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                              Village ID: {locId.toString().slice(-4)}
                              <button onClick={() => removeVillage(emp._id, emp.assignedVillages, locId)} className="ml-1.5 text-primary/60 hover:text-primary"><X className="w-3 h-3" /></button>
                            </span>
                          ))
                        ) : (
                          <span className="text-on-surface-variant text-xs italic">No villages assigned</span>
                        )}
                        <button 
                          onClick={() => openAssignModal(emp)} 
                          className="inline-flex items-center px-2 py-1 rounded border border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-colors text-xs font-medium"
                        >
                          <MapPin className="w-3 h-3 mr-1" /> Add
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button onClick={() => openEditModal(emp)} className="p-2 text-blue-600 hover:bg-blue-50 :bg-blue-900/30 rounded-lg transition-colors mr-2" title="Edit Employee">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteModal(emp)} className="p-2 text-red-600 hover:bg-red-50 :bg-red-900/30 rounded-lg transition-colors" title="Delete Employee">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 ">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 ">
                {modalMode === 'add' ? 'Add New Employee' : 'Edit Employee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 :text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
              {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                    value={formData.dateOfBirth}
                    onChange={handleDobChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    readOnly
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    value={formData.age}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Optional if mobile provided"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  placeholder="Optional if email provided"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {modalMode === 'edit' && <span className="text-slate-400 text-xs font-normal">(Leave blank to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  required={modalMode === 'add'}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant ">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg shadow-sm transition-colors font-medium">
                  {modalMode === 'add' ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center border border-slate-200 ">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Employee</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Are you sure you want to delete <strong>{selectedEmployee?.name || selectedEmployee?.email}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 text-slate-700 hover:bg-slate-100 :bg-slate-700 rounded-lg transition-colors font-medium">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-colors font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Village Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 ">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-on-surface flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Assign Village to {selectedEmployee?.name}
              </h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zonal</label>
                <select value={selZonal} onChange={handleZonalChange} className="input-field">
                  <option value="">Select Zonal</option>
                  {zonals.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Taluk</label>
                <select value={selTaluk} onChange={handleTalukChange} className="input-field" disabled={!selZonal}>
                  <option value="">Select Taluk</option>
                  {taluks.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gram Panchayat</label>
                <select value={selGram} onChange={handleGramChange} className="input-field" disabled={!selTaluk}>
                  <option value="">Select Gram</option>
                  {grams.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Booth</label>
                <select value={selBooth} onChange={handleBoothChange} className="input-field" disabled={!selGram}>
                  <option value="">Select Booth</option>
                  {booths.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Village</label>
                <select value={selLocationId} onChange={handleVillageChange} className="input-field border-indigo-300 focus:ring-indigo-500" disabled={!selBooth}>
                  <option value="">Select Village</option>
                  {villages.map(v => <option key={v._id} value={v._id}>{v.village}</option>)}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 :bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignVillage}
                disabled={!selLocationId}
                className={`px-6 py-2 rounded-xl font-medium flex items-center transition-all ${
                  !selLocationId ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-md'
                }`}
              >
                <Check className="w-4 h-4 mr-2" /> Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
