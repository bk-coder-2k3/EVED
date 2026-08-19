import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/api';

export default function EmployeeProfile() {
  const { user, refreshProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    password: ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    
    try {
      const updatePayload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile
      };
      if (formData.password) {
        updatePayload.password = formData.password;
      }
      
      await api.put('/auth/me', updatePayload);
      await refreshProfile();
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
      setFormData(prev => ({ ...prev, password: '' })); // clear password field
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto py-4 md:py-8 px-4 md:px-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Your Profile</h1>
        <p className="text-on-surface-variant mt-1 text-body-md">Manage your account details and credentials.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden max-w-3xl">
        {/* Header Cover */}
        <div className="h-32 bg-[#1c2235] relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10">
            <span className="material-symbols-outlined text-[150px]">badge</span>
          </div>
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-surface rounded-full border-4 border-surface flex items-center justify-center shadow-sm">
              <span className="text-4xl font-bold text-on-surface">{user?.name?.[0]?.toUpperCase() || 'E'}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 px-4 md:px-8 pb-4 md:pb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-on-surface">{user?.name}</h2>
              <p className="text-on-surface-variant flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                {user?.employeeId || 'Employee Account'}
              </p>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Profile
              </button>
            )}
          </div>

          {status.message && (
            <div className={`p-4 mb-6 rounded-lg font-medium text-sm ${status.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-emerald-100 text-emerald-800'}`}>
              {status.message}
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-bold uppercase tracking-wider text-[11px]">Full Name</p>
                  <p className="text-on-surface font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-bold uppercase tracking-wider text-[11px]">Employee ID</p>
                  <p className="text-on-surface font-medium">{user?.employeeId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-bold uppercase tracking-wider text-[11px]">Email Address</p>
                  <p className="text-on-surface font-medium">{user?.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-bold uppercase tracking-wider text-[11px]">Mobile Number</p>
                  <p className="text-on-surface font-medium">{user?.mobile || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-bold uppercase tracking-wider text-[11px]">Age</p>
                  <p className="text-on-surface font-medium">{user?.age || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-[#1c2235]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-[#1c2235]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-[#1c2235]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current"
                    className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-[#1c2235]"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#1c2235] text-surface rounded-lg font-bold text-sm hover:bg-[#2a324a] transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-surface border border-outline-variant text-on-surface rounded-lg font-medium text-sm hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
