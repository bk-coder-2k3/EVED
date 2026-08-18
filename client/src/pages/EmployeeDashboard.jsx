import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Search, Edit, MapPin, X, Check, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../api';

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Survey Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [familyCandidates, setFamilyCandidates] = useState([]);
  const [saving, setSaving] = useState(false);

  const [manualEpic, setManualEpic] = useState('');
  const [epicSearchError, setEpicSearchError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    epicNumber: '',
    relationName: '',
    relationType: '',
    houseNumber: '',
    age: '',
    gender: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    currentLocation: 'In Village',
    outOfVillageSpecify: '',
    possibility: '',
    prevP: '',
    dd: '',
    religion: '',
    caste: '',
    surveyStatus: 'Pending',
    familyMemberIds: []
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchVoters = async () => {
    try {
      const res = await api.get('/employee/voters');
      setVoters(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  const openSurveyModal = async (voter) => {
    setSelectedVoter(voter);
    setFormData({
      name: voter.name || '',
      epicNumber: voter.epicNumber || '',
      relationName: voter.relationName || '',
      relationType: voter.relationType || '',
      houseNumber: voter.houseNumber || '',
      age: voter.age || '',
      gender: voter.gender || '',
      phoneNumber: voter.phoneNumber || '',
      alternatePhoneNumber: voter.alternatePhoneNumber || '',
      currentLocation: voter.currentLocation || 'In Village',
      outOfVillageSpecify: voter.outOfVillageSpecify || '',
      possibility: voter.possibility || '',
      prevP: voter.prevP || '',
      dd: voter.dd || '',
      religion: voter.religion || '',
      caste: voter.caste || '',
      surveyStatus: voter.surveyStatus || 'Pending',
      familyMemberIds: voter.familyMemberIds || []
    });
    setIsModalOpen(true);
    
    // Fetch smart family tagging candidates
    try {
      const res = await api.get(`/employee/family-candidates?voterId=${voter._id}`);
      setFamilyCandidates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFamilyMember = (candidateId) => {
    const current = new Set(formData.familyMemberIds);
    if (current.has(candidateId)) {
      current.delete(candidateId);
    } else {
      current.add(candidateId);
    }
    setFormData({ ...formData, familyMemberIds: Array.from(current) });
  };

  const handleManualEpicAdd = async () => {
    if (!manualEpic.trim()) return;
    setEpicSearchError('');
    try {
      const res = await api.get(`/employee/search-epic/${manualEpic.trim()}`);
      const newCandidate = res.data;
      
      if (!familyCandidates.find(c => c._id === newCandidate._id)) {
        setFamilyCandidates(prev => [...prev, newCandidate]);
      }
      
      if (!formData.familyMemberIds.includes(newCandidate._id)) {
        setFormData(prev => ({
          ...prev,
          familyMemberIds: [...prev.familyMemberIds, newCandidate._id]
        }));
      }
      setManualEpic('');
    } catch (err) {
      setEpicSearchError(err.response?.data?.error || 'Voter not found.');
    }
  };

  const handleSaveSurvey = async () => {
    setSaving(true);
    try {
      await api.put(`/employee/survey/${selectedVoter._id}`, formData);
      setIsModalOpen(false);
      fetchVoters(); // Refresh the list
      alert('Survey saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save survey.');
    } finally {
      setSaving(false);
    }
  };

  const filteredVoters = voters.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.epicNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 flex flex-col shadow-2xl z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400">
            Employee Portal
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center px-4 py-3 rounded-xl bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-semibold shadow-sm">
            <Users className="w-5 h-5 mr-3" />
            My Voters
          </div>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 mt-4 mr-4 rounded-t-2xl shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Assigned Voter Surveys</h2>
          <div className="relative w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or EPIC..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative mr-4 mb-4 bg-white dark:bg-slate-800 rounded-b-2xl shadow-sm border border-t-0 border-slate-200 dark:border-slate-700">
          {loading ? (
            <div className="flex justify-center items-center h-full text-slate-500">Loading your assigned voters...</div>
          ) : voters.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-slate-500">
              <MapPin className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-lg">You have not been assigned any villages yet.</p>
              <p className="text-sm">Please contact the admin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-500 rounded-tl-lg">Photo</th>
                    <th className="px-4 py-3 font-medium text-slate-500">EPIC No.</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                    <th className="px-4 py-3 font-medium text-slate-500">House No.</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Age / Gender</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 font-medium text-slate-500 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredVoters.map(voter => (
                    <tr key={voter._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-2">
                        {voter.photo ? (
                          <img src={getImageUrl(voter.photo)} alt="voter" className="w-10 h-12 object-cover rounded-md shadow-sm bg-slate-200" />
                        ) : (
                          <div className="w-10 h-12 bg-slate-200 dark:bg-slate-600 rounded-md"></div>
                        )}
                      </td>
                      <td className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-300">{voter.epicNumber}</td>
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{voter.name}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{voter.houseNumber}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{voter.age} / {voter.gender}</td>
                      <td className="px-4 py-2">
                        {voter.surveyStatus === 'Completed' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium dark:bg-green-900/30 dark:text-green-400">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button 
                          onClick={() => openSurveyModal(voter)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors font-medium flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1.5" /> Survey
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Survey Modal */}
      {isModalOpen && selectedVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm mr-4">
                  {selectedVoter.photo ? (
                     <img src={getImageUrl(selectedVoter.photo)} alt="voter" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full bg-slate-200 dark:bg-slate-700"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {selectedVoter.name}
                    </h2>
                    <select
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 cursor-pointer ${
                        formData.surveyStatus === 'Completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 focus:ring-green-500' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 focus:ring-amber-500'
                      }`}
                      value={formData.surveyStatus}
                      onChange={(e) => setFormData({...formData, surveyStatus: e.target.value})}
                    >
                      <option value="Pending" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Pending</option>
                      <option value="Completed" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">Completed</option>
                    </select>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">EPIC: {selectedVoter.epicNumber} • House: {selectedVoter.houseNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Full Width: Extracted Details */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">Extracted Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Voter Name</label>
                      <input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">EPIC Number</label>
                      <input type="text" className="input-field" value={formData.epicNumber} onChange={(e) => setFormData({...formData, epicNumber: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relation Name</label>
                      <input type="text" className="input-field" value={formData.relationName} onChange={(e) => setFormData({...formData, relationName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relation Type</label>
                      <select className="input-field" value={formData.relationType} onChange={(e) => setFormData({...formData, relationType: e.target.value})}>
                        <option value="Father">Father</option>
                        <option value="Husband">Husband</option>
                        <option value="Mother">Mother</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">House Number</label>
                      <input type="text" className="input-field" value={formData.houseNumber} onChange={(e) => setFormData({...formData, houseNumber: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
                      <input type="number" className="input-field" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                      <select className="input-field" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Left Column: Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">Contact Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alternate Phone</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.alternatePhoneNumber}
                      onChange={(e) => setFormData({...formData, alternatePhoneNumber: e.target.value})}
                    />
                  </div>

                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 mt-6">Location Status</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Location</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input type="radio" value="In Village" checked={formData.currentLocation === 'In Village'} onChange={(e) => setFormData({...formData, currentLocation: e.target.value})} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-slate-700 dark:text-slate-300">In Village</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" value="Out of Village" checked={formData.currentLocation === 'Out of Village'} onChange={(e) => setFormData({...formData, currentLocation: e.target.value})} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-slate-700 dark:text-slate-300">Out of Village</span>
                      </label>
                    </div>
                  </div>
                  {formData.currentLocation === 'Out of Village' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specify Location</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Bangalore, Mumbai"
                        value={formData.outOfVillageSpecify}
                        onChange={(e) => setFormData({...formData, outOfVillageSpecify: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                {/* Right Column: Political & Demographic */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">Political Survey</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Possibility</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.possibility}
                        onChange={(e) => setFormData({...formData, possibility: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PrevP</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.prevP}
                        onChange={(e) => setFormData({...formData, prevP: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">DD</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.dd}
                      onChange={(e) => setFormData({...formData, dd: e.target.value})}
                    />
                  </div>

                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2 mt-6">Demographics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Religion</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.religion}
                        onChange={(e) => setFormData({...formData, religion: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Caste</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.caste}
                        onChange={(e) => setFormData({...formData, caste: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Full Width: Smart Family Tagging */}
                <div className="col-span-1 md:col-span-2 mt-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                    <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center mb-3">
                      <Users className="w-5 h-5 mr-2" />
                      Smart Family Tagging
                    </h3>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-4">
                      We found these voters residing at the same house number (<strong>{selectedVoter.houseNumber}</strong>) in this village. Select them to tag as family members. Or, manually search by EPIC below.
                    </p>

                    <div className="flex items-center mb-6 space-x-2">
                      <input
                        type="text"
                        className="input-field max-w-xs"
                        placeholder="Tag by EPIC number..."
                        value={manualEpic}
                        onChange={(e) => setManualEpic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualEpicAdd()}
                      />
                      <button
                        type="button"
                        onClick={handleManualEpicAdd}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        Add
                      </button>
                      {epicSearchError && <span className="text-sm font-medium text-red-500 ml-2">{epicSearchError}</span>}
                    </div>
                    
                    {familyCandidates.length === 0 ? (
                      <div className="text-sm text-slate-500 italic p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        No other voters found at this house number.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {familyCandidates.map(candidate => (
                          <label 
                            key={candidate._id}
                            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                              formData.familyMemberIds.includes(candidate._id)
                                ? 'bg-indigo-100 border-indigo-300 dark:bg-indigo-800/40 dark:border-indigo-500' 
                                : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                              checked={formData.familyMemberIds.includes(candidate._id)}
                              onChange={() => toggleFamilyMember(candidate._id)}
                            />
                            <div className="ml-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{candidate.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{candidate.epicNumber} • {candidate.relationName} ({candidate.relationType})</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-xl transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSurvey}
                disabled={saving}
                className={`px-6 py-2 rounded-xl text-white font-medium flex items-center transition-all ${
                  saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                }`}
              >
                {saving ? 'Saving...' : <><Check className="w-4 h-4 mr-2" /> Save & Claim Voter</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
