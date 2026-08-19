import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../api/api';

const EmployeeVoters = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All'); 
  const [selectedVillage, setSelectedVillage] = useState('All');

  const [activeSurveyVoter, setActiveSurveyVoter] = useState(null);
  const [familyCandidates, setFamilyCandidates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [manualEpic, setManualEpic] = useState('');
  const [epicSearchError, setEpicSearchError] = useState('');

  const [formData, setFormData] = useState({
    name: '', epicNumber: '', relationName: '', relationType: '', houseNumber: '', age: '', gender: '',
    phoneNumber: '', alternatePhoneNumber: '', currentLocation: 'In Village', outOfVillageSpecify: '', possibility: '',
    prevP: '', dd: '', religion: '', caste: '', status: '', surveyStatus: 'Pending', familyMemberIds: []
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

  const openSurvey = async (voter) => {
    setActiveSurveyVoter(voter);
    setFormData({
      name: voter.name || '', epicNumber: voter.epicNumber || '', relationName: voter.relationName || '', relationType: voter.relationType || '',
      houseNumber: voter.houseNumber || '', age: voter.age || '', gender: voter.gender || '', phoneNumber: voter.phoneNumber || '',
      alternatePhoneNumber: voter.alternatePhoneNumber || '', currentLocation: voter.currentLocation || 'In Village',
      outOfVillageSpecify: voter.outOfVillageSpecify || '', possibility: voter.possibility || '', prevP: voter.prevP || '',
      dd: voter.dd || '', religion: voter.religion || '', caste: voter.caste || '', status: voter.status || '', surveyStatus: voter.surveyStatus || 'Pending',
      familyMemberIds: voter.familyMemberIds || []
    });
    
    try {
      const res = await api.get(`/employee/family-candidates?voterId=${voter._id}`);
      setFamilyCandidates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const closeSurvey = () => {
    setActiveSurveyVoter(null);
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
        setFormData(prev => ({ ...prev, familyMemberIds: [...prev.familyMemberIds, newCandidate._id] }));
      }
      setManualEpic('');
    } catch (err) {
      setEpicSearchError(err.response?.data?.error || 'Voter not found.');
    }
  };

  const handleSaveSurvey = async () => {
    setSaving(true);
    try {
      await api.put(`/employee/survey/${activeSurveyVoter._id}`, formData);
      closeSurvey();
      fetchVoters();
    } catch (err) {
      console.error(err);
      alert('Failed to save survey.');
    } finally {
      setSaving(false);
    }
  };

  const uniqueVillagesList = [...new Set(voters.filter(v => v.locationId && v.locationId.village).map(v => v.locationId.village))];
  const assignedVillagesDisplay = uniqueVillagesList.length > 0 ? uniqueVillagesList.join(', ') : 'My Region';

  const baseFilteredVoters = voters.filter(v => {
    const matchesSearch = v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.epicNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.houseNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVillage = selectedVillage === 'All' || v.locationId?.village === selectedVillage;
    return matchesSearch && matchesVillage;
  });

  const completedCount = baseFilteredVoters.filter(v => v.surveyStatus === 'Completed').length;
  const pendingCount = baseFilteredVoters.length - completedCount;
  const totalCount = baseFilteredVoters.length;

  const filteredVoters = baseFilteredVoters.filter(v => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return v.surveyStatus !== 'Completed';
    if (filter === 'Completed') return v.surveyStatus === 'Completed';
    return true;
  });

  if (activeSurveyVoter) {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed md:bg-background">
        <header className="flex justify-between items-center w-full h-16 px-container-padding sticky top-0 z-40 bg-surface/90 backdrop-blur-md shadow-sm border-b border-outline-variant">
          <div className="flex items-center gap-2 cursor-pointer" onClick={closeSurvey}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
            <span className="font-headline-sm text-headline-sm font-bold text-primary">Back to List</span>
          </div>
        </header>

        <main className="flex-1 w-full max-w-md md:max-w-4xl mx-auto px-4 pt-6 pb-24 md:bg-surface-container-lowest md:rounded-xl md:shadow-lg md:border md:border-outline-variant md:my-8 md:p-8">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-primary mb-1">Survey Mode</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">House #{activeSurveyVoter.houseNumber}</p>
            </div>
            <div className="bg-surface-container-high rounded-full px-3 py-1 flex items-center gap-1 border border-outline-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">person_check</span>
              <span className="font-label-caps text-label-caps text-primary">{completedCount}/{totalCount} Done</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-4 mb-8 relative overflow-hidden ring-1 ring-black/5">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0 border border-outline-variant flex items-center justify-center">
                 {activeSurveyVoter.photo ? (
                   <img src={getImageUrl(activeSurveyVoter.photo)} alt="voter" className="w-full h-full object-cover" />
                 ) : (
                   <span className="material-symbols-outlined text-4xl text-outline-variant">person</span>
                 )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="font-headline-sm text-headline-sm text-primary">{activeSurveyVoter.name}</h2>
                  <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-on-surface-variant uppercase border border-outline-variant">EPIC: {activeSurveyVoter.epicNumber}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 font-body-sm text-body-sm text-on-surface-variant mt-2">
                  <div><span className="font-medium text-on-surface block text-[11px] uppercase tracking-wider">Age/Gender</span> {activeSurveyVoter.age} / {activeSurveyVoter.gender?.charAt(0)}</div>
                  <div><span className="font-medium text-on-surface block text-[11px] uppercase tracking-wider">House No</span> {activeSurveyVoter.houseNumber}</div>
                  <div className="col-span-2"><span className="font-medium text-on-surface block text-[11px] uppercase tracking-wider">Relation</span> {activeSurveyVoter.relationType}</div>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-8" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-8">
              <section>
                <label className="block font-headline-sm text-headline-sm text-primary mb-3">Voter Profile (Editable)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">EPIC Number</label>
                    <input type="text" value={formData.epicNumber} onChange={e => setFormData({...formData, epicNumber: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Age</label>
                    <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">House Number</label>
                    <input type="text" value={formData.houseNumber} onChange={e => setFormData({...formData, houseNumber: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Relation Name</label>
                    <input type="text" value={formData.relationName} onChange={e => setFormData({...formData, relationName: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Relation Type</label>
                    <input type="text" value={formData.relationType} onChange={e => setFormData({...formData, relationType: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="e.g. Father, Husband" />
                  </div>
                </div>

                <label className="block font-headline-sm text-headline-sm text-primary mb-3">Contact Information</label>
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline">call</span>
                    </div>
                    <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow outline-none" placeholder="Primary Phone Number" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline">phone_iphone</span>
                    </div>
                    <input type="tel" value={formData.alternatePhoneNumber} onChange={e => setFormData({...formData, alternatePhoneNumber: e.target.value})} className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow outline-none" placeholder="Secondary Phone Number (Optional)" />
                  </div>
                </div>
              </section>

              <section>
                <label className="block font-headline-sm text-headline-sm text-primary mb-3">Current Location</label>
                <div className="flex p-1 bg-surface-container rounded-lg border border-outline-variant">
                  <button type="button" onClick={() => setFormData({...formData, currentLocation: 'In Village'})} className={`flex-1 py-3 text-center rounded-md font-body-md text-body-md font-medium transition-colors ${formData.currentLocation === 'In Village' ? 'bg-surface-container-lowest shadow-sm text-primary border border-outline-variant' : 'text-on-surface-variant hover:text-primary'}`}>
                    In Village
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, currentLocation: 'Out of Village'})} className={`flex-1 py-3 text-center rounded-md font-body-md text-body-md font-medium transition-colors ${formData.currentLocation === 'Out of Village' ? 'bg-surface-container-lowest shadow-sm text-primary border border-outline-variant' : 'text-on-surface-variant hover:text-primary'}`}>
                    Out of Village
                  </button>
                </div>
                {formData.currentLocation === 'Out of Village' && (
                  <div className="mt-3">
                    <input type="text" value={formData.outOfVillageSpecify} onChange={e => setFormData({...formData, outOfVillageSpecify: e.target.value})} className="block w-full px-4 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" placeholder="Specify Location (e.g. Mumbai, Dubai)" />
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div>
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Religion</label>
                  <input type="text" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Enter religion" />
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Caste Category</label>
                  <input type="text" value={formData.caste} onChange={e => setFormData({...formData, caste: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Enter caste category" />
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="block font-headline-sm text-headline-sm text-primary">Survey Details</h3>
                <div>
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Possibility</label>
                  <input type="text" value={formData.possibility} onChange={e => setFormData({...formData, possibility: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Enter possibility" />
                </div>
                <div>
                  <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Status</label>
                  <div className="relative">
                    <select value={formData.surveyStatus} onChange={e => setFormData({...formData, surveyStatus: e.target.value})} className="block w-full pl-3 pr-10 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md appearance-none focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-[20px]">expand_more</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">Prev P</label>
                    <input type="text" value={formData.prevP} onChange={e => setFormData({...formData, prevP: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Prev P" />
                  </div>
                  <div>
                    <label className="block font-body-sm text-body-sm font-medium text-on-surface mb-1">DD</label>
                    <input type="text" value={formData.dd} onChange={e => setFormData({...formData, dd: e.target.value})} className="block w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="DD" />
                  </div>
                </div>
              </section>
              
              <section>
                <div className="p-4 bg-primary-fixed/30 rounded-xl border border-primary-fixed-dim">
                  <h3 className="font-headline-sm text-headline-sm text-on-primary-container flex items-center mb-2">
                    <span className="material-symbols-outlined mr-2">group</span>
                    Smart Family Tagging
                  </h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mb-4">
                    We found these voters residing at house number <strong>{activeSurveyVoter.houseNumber}</strong>. Select them to tag as family members.
                  </p>

                  {familyCandidates.length > 0 && (
                    <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                      {familyCandidates.map(candidate => (
                        <label key={candidate._id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${formData.familyMemberIds.includes(candidate._id) ? 'bg-primary-fixed border-primary text-on-primary-fixed' : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'}`}>
                          <input type="checkbox" className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary mr-3" checked={formData.familyMemberIds.includes(candidate._id)} onChange={() => toggleFamilyMember(candidate._id)} />
                          <div>
                            <p className="text-body-md font-semibold leading-tight">{candidate.name}</p>
                            <p className="text-label-caps text-[10px] text-on-surface-variant mt-0.5">EPIC: {candidate.epicNumber}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input type="text" className="flex-1 px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" placeholder="Add EPIC Number..." value={manualEpic} onChange={(e) => setManualEpic(e.target.value)} />
                    <button type="button" onClick={handleManualEpicAdd} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm">Add</button>
                  </div>
                  {epicSearchError && <span className="text-xs font-medium text-error mt-1 block">{epicSearchError}</span>}
                </div>
              </section>
            </div>

            <div className="h-8 md:hidden"></div>
            
            <div className="hidden md:flex col-span-2 justify-end mt-4 pt-4 border-t border-outline-variant">
              <button onClick={handleSaveSurvey} disabled={saving} className="px-8 py-3 bg-primary text-on-primary rounded-lg font-body-md text-body-md font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save & Close Survey'}
                {!saving && <span className="material-symbols-outlined">check_circle</span>}
              </button>
            </div>
          </form>
        </main>

        <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-surface/95 backdrop-blur-md border-t border-outline-variant z-40">
          <button onClick={handleSaveSurvey} disabled={saving} className="w-full py-3.5 bg-primary text-on-primary rounded-lg font-body-md text-body-md font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform disabled:opacity-50">
            {saving ? 'Saving...' : 'Save & Close'}
            {!saving && <span className="material-symbols-outlined">check_circle</span>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto pb-24 md:pb-8">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1">Assigned Voters</h1>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <p className="font-body-md truncate max-w-sm" title={assignedVillagesDisplay}>{assignedVillagesDisplay}</p>
          </div>
        </div>
      </header>

      <section className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 md:max-w-md bg-surface border border-outline-variant rounded-full shadow-sm">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none rounded-full py-3.5 pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-shadow" 
                placeholder="Search Name, EPIC, or House No." 
                type="text"
              />
          </div>
          <div className="relative min-w-[200px]">
            <select 
              value={selectedVillage} 
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full appearance-none bg-surface border border-outline-variant rounded-lg py-3.5 pl-4 pr-10 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="All">All Villages</option>
              {uniqueVillagesList.map(village => (
                <option key={village} value={village}>{village}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide -mx-gutter px-gutter md:mx-0 md:px-0">
            <button onClick={() => setFilter('All')} className={`rounded-full px-5 py-2 font-label-caps text-label-caps whitespace-nowrap border transition-colors ${filter === 'All' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container'}`}>All ({totalCount})</button>
            <button onClick={() => setFilter('Pending')} className={`rounded-full px-5 py-2 font-label-caps text-label-caps whitespace-nowrap border transition-colors ${filter === 'Pending' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container'}`}>Pending ({pendingCount})</button>
            <button onClick={() => setFilter('Completed')} className={`rounded-full px-5 py-2 font-label-caps text-label-caps whitespace-nowrap border transition-colors ${filter === 'Completed' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container'}`}>Completed ({completedCount})</button>
          </div>
        </section>

        <section className="mt-6 pb-8">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-4 px-4 border-b border-outline-variant/30 pb-2">VOTER DIRECTORY</h2>
          
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm mx-4 md:mx-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-4 font-medium text-on-surface-variant">Photo</th>
                    <th className="px-6 py-4 font-medium text-on-surface-variant">Name</th>
                    <th className="px-6 py-4 font-medium text-on-surface-variant">EPIC No.</th>
                    <th className="px-6 py-4 font-medium text-on-surface-variant">House No.</th>
                    <th className="px-6 py-4 font-medium text-on-surface-variant">Village</th>
                    <th className="px-6 py-4 font-medium text-on-surface-variant">Status</th>
                    <th className="px-6 py-4 font-medium text-on-surface-variant text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center p-8 text-on-surface-variant">Loading voters...</td>
                    </tr>
                  ) : filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-8 text-on-surface-variant bg-surface-container-lowest">
                        No voters found for the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVoters.map(voter => (
                      <tr 
                        key={voter._id} 
                        onClick={() => openSurvey(voter)}
                        className="hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-3">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant text-on-surface-variant">
                            {voter.photo ? (
                              <img src={getImageUrl(voter.photo)} alt="voter" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-[20px]">person</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 font-medium text-on-surface group-hover:text-primary transition-colors">
                          {voter.name}
                        </td>
                        <td className="px-6 py-3 text-on-surface-variant">
                          {voter.epicNumber}
                        </td>
                        <td className="px-6 py-3 text-on-surface-variant">
                          {voter.houseNumber}
                        </td>
                        <td className="px-6 py-3 text-on-surface-variant">
                          {voter.locationId?.village || '-'}
                        </td>
                        <td className="px-6 py-3">
                          {voter.surveyStatus === 'Completed' ? (
                            <div className="inline-flex bg-primary-fixed/20 text-on-primary-fixed px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border border-primary-fixed items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] icon-fill">check_circle</span> Done
                            </div>
                          ) : (
                            <div className="inline-flex bg-surface-container text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase border border-outline-variant">
                              Pending
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button className="text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium text-sm flex items-center justify-end w-full">
                            Survey <span className="material-symbols-outlined text-[18px] ml-1">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
    </div>
  );
};

export default EmployeeVoters;
