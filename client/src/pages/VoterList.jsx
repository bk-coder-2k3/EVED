import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../api';
import { Search, ChevronLeft, ChevronRight, Edit, MapPin, X, Check, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';

export default function VoterList() {
  const [voters, setVoters] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('serialNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Selection state
  const [selectedVoters, setSelectedVoters] = useState(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Location State for Modal
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

  useEffect(() => {
    fetchVoters();
    fetchZonals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, filterGender, filterStatus, sortBy, sortOrder]);

  const fetchVoters = async () => {
    try {
      const res = await api.get('/voters', {
        params: {
          page,
          limit,
          name: searchQuery,
          gender: filterGender,
          status: filterStatus,
          sortBy,
          order: sortOrder
        }
      });
      setVoters(res.data.data);
      setTotal(res.data.pagination.total);
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

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedVoters);
      voters.forEach(v => newSelected.add(v._id));
      setSelectedVoters(newSelected);
    } else {
      const newSelected = new Set(selectedVoters);
      voters.forEach(v => newSelected.delete(v._id));
      setSelectedVoters(newSelected);
    }
  };

  const toggleSelectVoter = (id) => {
    const newSelected = new Set(selectedVoters);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVoters(newSelected);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1); // Reset to page 1 on sort change
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-400" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-500" /> : <ArrowDown className="w-3 h-3 ml-1 text-indigo-500" />;
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

  const handleAssignSubmit = async () => {
    if (!selLocationId || selectedVoters.size === 0) return;
    setAssigning(true);
    try {
      await api.put('/voters/assign-location', {
        voterIds: Array.from(selectedVoters),
        locationId: selLocationId
      });
      setIsModalOpen(false);
      setSelectedVoters(new Set()); // clear selection
      fetchVoters();
      alert('Voters assigned to village successfully!');
    } catch (err) {
      console.error(err);
      alert('Error assigning location');
    } finally {
      setAssigning(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const isAllOnPageSelected = voters.length > 0 && voters.every(v => selectedVoters.has(v._id));

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
          Voter Directory
          {selectedVoters.size > 0 && (
            <span className="ml-4 text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-3 py-1 rounded-full">
              {selectedVoters.size} Selected
            </span>
          )}
        </h1>
        <div className="flex items-center space-x-3">
          {selectedVoters.size > 0 && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary py-2 flex items-center shadow-lg transform hover:scale-105 transition-all"
            >
              <MapPin className="w-4 h-4 mr-2" /> Assign Village
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl border flex items-center transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}
          >
            <Filter className="w-4 h-4 mr-2" /> Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Name or EPIC..." 
                  value={searchQuery}
                  onChange={handleSearch}
                  className="input-field pl-9 h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Gender</label>
              <select 
                value={filterGender} 
                onChange={(e) => { setFilterGender(e.target.value); setPage(1); }}
                className="input-field h-9 text-sm"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Assignment Status</label>
              <select 
                value={filterStatus} 
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="input-field h-9 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="assigned">Assigned to Village</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel flex-1 flex flex-col overflow-hidden relative shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 shadow-sm backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500 w-10 border-b border-slate-200 dark:border-slate-700">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    checked={isAllOnPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700">Photo</th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none" onClick={() => handleSort('serialNumber')}>
                  <div className="flex items-center">Serial No. {renderSortIcon('serialNumber')}</div>
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none" onClick={() => handleSort('epicNumber')}>
                  <div className="flex items-center">EPIC No. {renderSortIcon('epicNumber')}</div>
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Name {renderSortIcon('name')}</div>
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700">Village</th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700">Relation</th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none" onClick={() => handleSort('houseNumber')}>
                  <div className="flex items-center">House No. {renderSortIcon('houseNumber')}</div>
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none" onClick={() => handleSort('age')}>
                  <div className="flex items-center">Age / Gender {renderSortIcon('age')}</div>
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 border-b border-slate-200 dark:border-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {voters.map(voter => (
                <tr 
                  key={voter._id} 
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedVoters.has(voter._id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                >
                  <td className="px-4 py-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      checked={selectedVoters.has(voter._id)}
                      onChange={() => toggleSelectVoter(voter._id)}
                    />
                  </td>
                  <td className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
                    {voter.photo ? (
                      <img src={getImageUrl(voter.photo)} alt="voter" className="w-10 h-12 object-cover rounded-md shadow-sm bg-slate-200" />
                    ) : (
                      <div className="w-10 h-12 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">{voter.serialNumber}</td>
                  <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-semibold">{voter.epicNumber}</td>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {voter.name}
                  </td>
                  <td className="px-4 py-2">
                    {voter.locationId ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-medium dark:bg-emerald-900/30 dark:text-emerald-400">
                        {voter.locationId.village}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{voter.relationName} <span className="text-xs opacity-60">({voter.relationType})</span></td>
                  <td className="px-4 py-2 font-medium">{voter.houseNumber}</td>
                  <td className="px-4 py-2">{voter.age} / {voter.gender}</td>
                  <td className="px-4 py-2">
                    <Link to={`/voters/${voter._id}`} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg inline-block transition-colors">
                      <Edit className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between bg-white dark:bg-slate-900 rounded-b-xl">
          <p className="text-sm text-slate-500">Showing {voters.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} entries</p>
          <div className="flex space-x-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="btn-secondary py-1 px-3 flex items-center disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </button>
            <span className="py-1 px-3 text-sm font-medium border border-transparent bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center min-w-[3rem]">{page}</span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary py-1 px-3 flex items-center disabled:opacity-50"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
                Assign Village to {selectedVoters.size} Voters
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zonal</label>
                <select value={selZonal} onChange={handleZonalChange} className="input-field" disabled={assigning}>
                  <option value="">Select Zonal</option>
                  {zonals.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Taluk</label>
                <select value={selTaluk} onChange={handleTalukChange} className="input-field" disabled={!selZonal || assigning}>
                  <option value="">Select Taluk</option>
                  {taluks.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gram Panchayat</label>
                <select value={selGram} onChange={handleGramChange} className="input-field" disabled={!selTaluk || assigning}>
                  <option value="">Select Gram</option>
                  {grams.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Booth</label>
                <select value={selBooth} onChange={handleBoothChange} className="input-field" disabled={!selGram || assigning}>
                  <option value="">Select Booth</option>
                  {booths.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Village</label>
                <select value={selLocationId} onChange={handleVillageChange} className="input-field border-indigo-300 focus:ring-indigo-500" disabled={!selBooth || assigning}>
                  <option value="">Select Village</option>
                  {villages.map(v => <option key={v._id} value={v._id}>{v.village}</option>)}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors"
                disabled={assigning}
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignSubmit}
                disabled={!selLocationId || assigning}
                className={`px-6 py-2 rounded-xl text-white font-medium flex items-center transition-all ${
                  !selLocationId || assigning ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                }`}
              >
                {assigning ? (
                  'Assigning...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" /> Confirm Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
