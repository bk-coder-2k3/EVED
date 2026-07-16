import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';

export default function VoterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [voter, setVoter] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchVoter();
  }, [id]);

  const fetchVoter = async () => {
    try {
      const res = await api.get(`/voters/${id}`);
      setVoter(res.data);
      setFormData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await api.put(`/voters/${id}`, formData);
      setVoter(res.data);
      alert('Voter updated successfully');
    } catch (err) {
      console.error(err);
      alert('Error updating voter');
    }
  };

  if (!voter) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
         <button onClick={() => navigate('/voters')} className="text-slate-500 hover:text-slate-800 flex items-center">
            <ArrowLeft className="w-5 h-5 mr-1" /> Back to List
         </button>
         <div className="flex gap-4">
           {voter.prevId && (
             <button onClick={() => navigate(`/voters/${voter.prevId}`)} className="btn-secondary py-2 px-4">
               Previous Voter
             </button>
           )}
           {voter.nextId && (
             <button onClick={() => navigate(`/voters/${voter.nextId}`)} className="btn-secondary py-2 px-4">
               Next Voter
             </button>
           )}
           <button onClick={handleSave} className="btn-primary flex items-center">
              <Save className="w-4 h-4 mr-2" /> Save Corrections
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Editor Form */}
        <div className="glass-panel p-8 space-y-4">
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white border-b pb-4 mb-4">Edit Extracted Data</h2>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm text-slate-600 mb-1">EPIC Number</label>
               <input type="text" name="epicNumber" value={formData.epicNumber || ''} onChange={handleChange} className="input-field" />
             </div>
             <div>
               <label className="block text-sm text-slate-600 mb-1">Serial Number</label>
               <input type="number" name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="input-field" />
             </div>
           </div>

           <div>
             <label className="block text-sm text-slate-600 mb-1">Voter Name</label>
             <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="input-field font-medium text-lg text-indigo-600" />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm text-slate-600 mb-1">Relation Name</label>
               <input type="text" name="relationName" value={formData.relationName || ''} onChange={handleChange} className="input-field" />
             </div>
             <div>
               <label className="block text-sm text-slate-600 mb-1">Relation Type</label>
               <select name="relationType" value={formData.relationType || ''} onChange={handleChange} className="input-field">
                 <option value="Father">Father</option>
                 <option value="Husband">Husband</option>
                 <option value="Mother">Mother</option>
                 <option value="Other">Other</option>
               </select>
             </div>
           </div>

           <div>
             <label className="block text-sm text-slate-600 mb-1">House Number</label>
             <input type="text" name="houseNumber" value={formData.houseNumber || ''} onChange={handleChange} className="input-field" />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm text-slate-600 mb-1">Age</label>
               <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="input-field" />
             </div>
             <div>
               <label className="block text-sm text-slate-600 mb-1">Gender</label>
               <select name="gender" value={formData.gender || ''} onChange={handleChange} className="input-field">
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
                 <option value="Other">Other</option>
               </select>
             </div>
           </div>
        </div>

        {/* Source Image Viewer */}
        <div className="glass-panel p-8 bg-slate-100 dark:bg-slate-800 flex flex-col items-center">
           <h3 className="font-semibold text-slate-500 mb-4 uppercase tracking-wider text-sm">Source Image Reference</h3>
           <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-lg border-4 border-white mb-6">
             <img src={`http://localhost:5000${voter.voterCardImage}`} alt="Full Voter Card" className="w-full h-auto" />
           </div>
           
           <h3 className="font-semibold text-slate-500 mb-4 uppercase tracking-wider text-sm">Extracted Photo</h3>
           <div className="w-32 h-40 rounded-xl overflow-hidden shadow-lg border-4 border-white">
             <img src={`http://localhost:5000${voter.photo}`} alt="Voter Face" className="w-full h-full object-cover" />
           </div>
        </div>

      </div>
    </div>
  );
}
