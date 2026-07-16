import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Search, ChevronLeft, ChevronRight, Edit } from 'lucide-react';

export default function VoterList() {
  const [voters, setVoters] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  useEffect(() => {
    fetchVoters();
  }, [page, searchQuery]);

  const fetchVoters = async () => {
    try {
      const res = await api.get(`/voters?page=${page}&limit=${limit}&name=${searchQuery}`);
      setVoters(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Voter Directory</h1>
        <div className="relative w-64">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search names..." 
            value={searchQuery}
            onChange={handleSearch}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500">Photo</th>
                <th className="px-4 py-3 font-medium text-slate-500">Serial No.</th>
                <th className="px-4 py-3 font-medium text-slate-500">EPIC No.</th>
                <th className="px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500">Relation</th>
                <th className="px-4 py-3 font-medium text-slate-500">House No.</th>
                <th className="px-4 py-3 font-medium text-slate-500">Age / Gender</th>
                <th className="px-4 py-3 font-medium text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {voters.map(voter => (
                <tr key={voter._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2">
                    {voter.photo ? (
                      <img src={`http://localhost:5000${voter.photo}`} alt="voter" className="w-10 h-12 object-cover rounded-md shadow-sm bg-slate-200" />
                    ) : (
                       <div className="w-10 h-12 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                    )}
                  </td>
                  <td className="px-4 py-2 font-medium">{voter.serialNumber}</td>
                  <td className="px-4 py-2 text-primary-600 font-semibold">{voter.epicNumber}</td>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{voter.name}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{voter.relationName} <span className="text-xs opacity-60">({voter.relationType})</span></td>
                  <td className="px-4 py-2">{voter.houseNumber}</td>
                  <td className="px-4 py-2">{voter.age} / {voter.gender}</td>
                  <td className="px-4 py-2">
                    <Link to={`/voters/${voter._id}`} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg inline-block">
                      <Edit className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500">Showing {Math.min(voters.length, limit)} of {total} entries</p>
          <div className="flex space-x-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="btn-secondary py-1 px-3 flex items-center disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </button>
            <span className="py-1 px-3 text-sm font-medium border border-transparent">{page} / {totalPages || 1}</span>
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
    </div>
  );
}
