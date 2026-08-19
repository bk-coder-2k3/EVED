import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const completedCount = voters.filter(v => v.surveyStatus === 'Completed').length;
  const totalCount = voters.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Extract unique locations and households
  const assignedVillagesCount = user?.assignedVillages?.length || 0;

  // Estimate active hours based on completed surveys (~15 mins each)
  const activeHours = (completedCount * 0.25).toFixed(1);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-[32px] animate-spin text-primary">sync</span>
        <p className="mt-4 text-on-surface-variant font-body-md">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto pb-24 md:pb-8">
      {/* Header section */}
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Welcome back, {user?.name || 'Rajesh'}</h1>
        <p className="text-on-surface-variant mt-1 text-body-md">Here's your overview for today.</p>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Completion */}
        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">TOTAL COMPLETION</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">incomplete_circle</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-on-surface">{progressPercent}%</span>
              <span className="text-sm font-medium text-on-surface-variant">({completedCount} / {totalCount})</span>
            </div>
            <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-on-surface rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: Assigned Villages */}
        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">ASSIGNED VILLAGES</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-on-surface">{assignedVillagesCount}</span>
              <span className="text-sm font-medium text-on-surface-variant">{assignedVillagesCount === 1 ? 'Location' : 'Locations'}</span>
            </div>
            <p className="text-sm text-on-surface-variant">Covers {totalCount} Voters</p>
          </div>
        </div>

        {/* Card 3: Active Hours */}
        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">ACTIVE HOURS</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-on-surface">{activeHours}</span>
              <span className="text-sm font-medium text-on-surface-variant">hrs</span>
            </div>
            <p className="text-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Based on completed surveys
            </p>
          </div>
        </div>
      </div>




    </div>
  );
};

export default EmployeeDashboard;
