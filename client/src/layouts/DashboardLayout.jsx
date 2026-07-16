import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileUp, List, Users, Settings, Database } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload PDF', path: '/upload', icon: FileUp },
  { name: 'Processing Queue', path: '/queue', icon: List },
  { name: 'Imported PDFs', path: '/pdfs', icon: Database },
  { name: 'Voter List', path: '/voters', icon: Users },
  { name: 'Template Editor', path: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 flex flex-col shadow-2xl z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
            PDF Voter Extractor
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Control Panel</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
