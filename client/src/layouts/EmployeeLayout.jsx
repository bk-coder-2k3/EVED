import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/employee-dashboard', icon: 'dashboard' },
  { name: 'Voter Data', path: '/employee-voters', icon: 'data_usage' }
];

export default function EmployeeLayout() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased flex h-screen w-full overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 w-64 bg-primary-container text-on-primary-container shadow-sm border-r border-outline-variant/10 z-50">
        
        {/* Logo */}
        <div className="h-20 flex items-center px-6 mt-2">
          <div className="w-8 h-8 rounded bg-surface flex items-center justify-center mr-3 shadow-sm text-primary-container">
            <span className="material-symbols-outlined icon-fill text-[18px]">account_balance</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm font-bold tracking-tight text-surface">EVED</span>
            <span className="text-[10px] text-surface-variant/80">Electoral Management</span>
          </div>
        </div>



        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
                  isActive
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-on-primary-container/70 hover:bg-surface/10 hover:text-surface'
                }`
              }
            >
              <span className={`material-symbols-outlined mr-4 text-[20px] ${item.path !== '#' && 'icon-fill'}`}>{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 md:ml-64 bg-surface-container-lowest">
        
        {/* Top Header */}
        <header className="flex justify-between items-center w-full py-4 px-4 md:px-8 sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant shadow-sm shrink-0">
          
          <div className="flex-1"></div>

          {/* Right Actions */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className={`flex items-center space-x-2 py-1.5 pl-4 pr-2 rounded-full border transition-colors ${
                  isProfileDropdownOpen 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-outline-variant hover:bg-surface-container text-on-surface'
                }`}
              >
                <span className="font-label-caps text-label-caps px-1">{user?.name || 'PROFILE'}</span>
                <div className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'E'}
                </div>
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-outline-variant z-50 overflow-hidden">
                    <div className="py-1">
                      <NavLink
                        to="/employee-profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined mr-2 text-[18px]">person</span>
                        Profile
                      </NavLink>
                      <button
                        onClick={() => { setIsProfileDropdownOpen(false); handleLogout(); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined mr-2 text-[18px]">logout</span>
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Bottom Nav (Fallback for smaller screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-4 bg-surface rounded-t-xl border-t border-outline-variant shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <NavLink to="/employee-dashboard" className={({isActive}) => `flex flex-col items-center justify-center rounded-lg px-4 py-1 w-20 transition-colors ${isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`}>
          <span className={`material-symbols-outlined ${true ? 'icon-fill' : ''}`}>dashboard</span>
          <span className="text-[10px] uppercase font-bold mt-1 tracking-wider">Home</span>
        </NavLink>
        <NavLink to="/employee-voters" className={({isActive}) => `flex flex-col items-center justify-center rounded-lg px-4 py-1 w-20 transition-colors ${isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`}>
          <span className={`material-symbols-outlined ${true ? 'icon-fill' : ''}`}>groups</span>
          <span className="text-[10px] uppercase font-bold mt-1 tracking-wider">Voters</span>
        </NavLink>
      </nav>
      
    </div>
  );
}
