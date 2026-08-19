import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'Voter Data', path: '/voters', icon: 'how_to_reg' },
  { name: 'PDF Extraction', path: '/extraction', icon: 'picture_as_pdf' },
  { name: 'Hierarchy', path: '/hierarchy', icon: 'account_tree' },
  { name: 'Employees', path: '/employees', icon: 'badge' }
];

export default function DashboardLayout() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-hidden flex h-screen w-full">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar */}
      <aside className={`flex flex-col h-screen fixed left-0 top-0 overflow-y-auto w-sidebar-width z-50 bg-primary-container text-primary-fixed-dim font-body-md shadow-sm docked border-r border-outline-variant/20 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Header */}
        <div className="h-16 flex items-center px-6 mb-6 mt-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mr-3 shadow-sm">
            <span className="material-symbols-outlined text-on-primary icon-fill text-[18px]">how_to_vote</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-lg text-headline-lg font-bold text-on-primary leading-none tracking-tight">EVED</span>
            <span className="text-[10px] uppercase tracking-wider text-on-primary-container opacity-80 mt-1">Electoral Management</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-colors font-medium ml-1 ${
                  isActive
                    ? 'border-l-4 border-primary bg-secondary-container/10 text-on-primary font-bold hover:bg-primary/20 scale-95 duration-150'
                    : 'text-on-secondary-container/70 hover:bg-primary/20'
                }`
              }
            >
              <span className={`material-symbols-outlined mr-3 text-[20px] ${true /* make logic if active later */ ? 'icon-fill' : ''}`}>{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>


      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 md:ml-sidebar-width overflow-y-auto bg-background">
        {/* TopNavBar */}
        <header className="flex justify-between md:justify-end items-center w-full py-4 px-container-padding sticky top-0 z-40 bg-surface/90 backdrop-blur-md text-on-surface font-body-sm shadow-sm border-b border-outline-variant">
          
          {/* Hamburger Menu (Mobile Only) */}
          <button 
            className="md:hidden p-2 -ml-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>


          {/* Right: Actions */}
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
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-outline-variant z-50 overflow-hidden">
                    <div className="py-1">
                      <NavLink
                        to="/profile"
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

        {/* Dynamic Content */}
        <main className="flex-1 p-container-padding space-y-container-padding">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
