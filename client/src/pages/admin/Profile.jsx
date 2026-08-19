import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/api';

export default function Profile() {
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-primary/80 to-primary-container relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-surface rounded-full border-4 border-surface flex items-center justify-center shadow-sm">
              <span className="text-4xl font-bold text-primary">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 px-8 pb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">{user?.name}</h1>
              <p className="text-on-surface-variant capitalize">{user?.role} Account</p>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg font-medium hover:bg-primary-container/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Profile
              </button>
            )}
          </div>

          {status.message && (
            <div className={`p-4 mb-6 rounded-lg ${status.type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-emerald-100 text-emerald-800'}`}>
              {status.message}
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-medium">Full Name</p>
                  <p className="text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-medium">Email Address</p>
                  <p className="text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">{user?.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-medium">Mobile Number</p>
                  <p className="text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">{user?.mobile || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant mb-1 font-medium">Account Role</p>
                  <p className="text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Mobile Number</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current"
                    className="w-full p-3 rounded-lg border border-outline-variant bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 bg-surface-container text-on-surface rounded-lg font-medium hover:bg-surface-container-high transition-colors"
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
