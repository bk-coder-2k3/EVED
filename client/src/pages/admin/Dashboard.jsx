import { useState, useEffect } from 'react';
import api from '../../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-symbols-outlined text-[32px] animate-spin text-primary">sync</span>
      </div>
    );
  }

  // Fallback bindings if stats is missing anything
  const totalVoters = stats?.totalVoters || 0;
  const completedSurveys = stats?.completedSurveys || 0;
  const surveyCompletionPercent = totalVoters === 0 ? 0 : Math.round((completedSurveys / totalVoters) * 100 * 10) / 10;
  
  const totalPDFs = stats?.totalPDFs || 0;
  const completedPDFs = stats?.completedPDFs || 0;
  const processingPDFs = stats?.processingPDFs || 0;
  const failedPDFs = stats?.failedPDFs || 0;
  
  const totalEmployees = stats?.totalEmployees || 0;
  
  const hierarchy = stats?.hierarchy || { zonals: 0, taluks: 0, villages: 0 };
  
  const recentActivity = stats?.recentActivity || [];

  return (
    <div className="space-y-container-padding pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-metric-sm text-metric-sm text-on-background">Dashboard</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-2xl">Overview of voter extraction, field surveys and operational progress.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={fetchStats} className="flex items-center bg-surface border border-outline-variant rounded-lg px-3 py-1.5 shadow-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px] mr-2 text-on-surface-variant">sync</span>
            <span>Refresh</span>
          </button>
          <div className="flex items-center bg-surface border border-outline-variant rounded-lg px-3 py-1.5 shadow-sm text-body-sm text-on-surface">
            <span className="material-symbols-outlined text-[18px] mr-2 text-on-surface-variant">calendar_today</span>
            <span>Current Cycle</span>
          </div>
          <button className="flex items-center bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps text-label-caps shadow-sm hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-[16px] mr-1.5">download</span>
            EXPORT
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Card 1 */}
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL VOTERS</span>
            <div className="p-1.5 rounded-md bg-primary-fixed/30 text-primary">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-metric-sm text-metric-sm text-on-surface">{totalVoters.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center text-body-sm">
            <span className="text-emerald-600 flex items-center font-medium">
              <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span> Extracted
            </span>
            <span className="text-on-surface-variant ml-1.5">via active jobs</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-container">
            <div className="h-full bg-primary w-[100%] rounded-r-full"></div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant">PDFS PROCESSED</span>
            <div className="p-1.5 rounded-md bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-metric-sm text-metric-sm text-on-surface">{totalPDFs.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center text-body-sm">
            <span className="text-emerald-600 flex items-center font-medium">
              <span className="material-symbols-outlined text-[14px] mr-0.5">check_circle</span> {completedPDFs} completed
            </span>
            <span className="text-on-surface-variant ml-1.5">in queue: {processingPDFs}</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-container">
            <div className="h-full bg-secondary" style={{ width: `${totalPDFs > 0 ? (completedPDFs / totalPDFs) * 100 : 0}%` }}></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant">ACTIVE EMPLOYEES</span>
            <div className="p-1.5 rounded-md bg-tertiary-fixed/40 text-on-tertiary-fixed">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-metric-sm text-metric-sm text-on-surface">{totalEmployees.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center text-body-sm">
            <span className="text-on-surface-variant flex items-center">
              Field Agents
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-container">
             <div className="h-full bg-tertiary-fixed-dim w-[100%] rounded-r-full"></div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant">SURVEY COMPLETION</span>
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-800">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-metric-sm text-metric-sm text-on-surface">{surveyCompletionPercent}%</span>
          </div>
          <div className="mt-2 flex items-center text-body-sm">
            <span className="text-emerald-600 flex items-center font-medium">
              <span className="material-symbols-outlined text-[14px] mr-0.5">check</span> {completedSurveys.toLocaleString()}
            </span>
            <span className="text-on-surface-variant ml-1.5">voters surveyed</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-container">
            <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: `${surveyCompletionPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Analytics & Activity Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Survey Progress Chart (Col Span 2) */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Survey Progress</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Completion status across administrative levels.</p>
            </div>
            <div className="flex items-center space-x-4 text-body-sm">
              <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-primary mr-1.5"></div> Completed</div>
              <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-surface-container-highest mr-1.5"></div> Pending</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div>
              <div className="flex justify-between text-body-sm font-medium mb-1.5">
                <span className="text-on-surface">Zonals ({hierarchy.zonals} Total)</span>
                <span className="text-on-surface-variant">{surveyCompletionPercent}% Overall</span>
              </div>
              <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{width: `${surveyCompletionPercent}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-body-sm font-medium mb-1.5">
                <span className="text-on-surface">Taluks ({hierarchy.taluks} Total)</span>
                <span className="text-on-surface-variant">{surveyCompletionPercent}% Overall</span>
              </div>
              <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{width: `${surveyCompletionPercent}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-body-sm font-medium mb-1.5">
                <span className="text-on-surface">Villages ({hierarchy.villages} Total)</span>
                <span className="text-on-surface-variant">{surveyCompletionPercent}% Overall</span>
              </div>
              <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{width: `${surveyCompletionPercent}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed (Col Span 1) */}
        <div className="bg-surface rounded-xl border border-outline-variant shadow-sm flex flex-col h-[400px]">
          <div className="p-5 border-b border-outline-variant/50 flex justify-between items-center">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Recent Activity</h2>
            <button onClick={fetchStats} className="text-primary text-body-sm font-medium hover:underline">Refresh</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {recentActivity.length === 0 ? (
              <div className="text-center text-on-surface-variant py-8">
                <span className="material-symbols-outlined text-4xl opacity-30 mb-2">history</span>
                <p>No recent activity.</p>
              </div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={`${activity.id}-${index}`} className="flex items-start">
                  <div className={`mt-0.5 mr-3 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${activity.type === 'pdf_completed' || activity.type === 'survey_completed' ? 'bg-emerald-100 text-emerald-700' : 
                      activity.type === 'pdf_failed' ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                    <span className="material-symbols-outlined text-[16px] icon-fill">
                      {activity.type === 'pdf_completed' ? 'task_alt' : 
                       activity.type === 'survey_completed' ? 'how_to_reg' : 
                       activity.type === 'pdf_failed' ? 'warning' : 'history'}
                    </span>
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface"><span className="font-medium">{activity.title}</span> {activity.details}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      {new Date(activity.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {activity.source}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
