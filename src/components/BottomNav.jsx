import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, ScanLine, BarChart2, Settings, Receipt, Plus } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/bills', icon: FileText, label: 'Bills' },
  { path: '/scan', icon: ScanLine, label: 'Scan' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  if (location.pathname === '/login') return null;

  return (
    <nav
      id="app-nav"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-[var(--bottom-nav-height)] bg-[var(--bg-card)] border-t border-[var(--border)] pb-[env(safe-area-inset-bottom,0px)] md:top-0 md:bottom-0 md:right-auto md:w-[var(--sidebar-width)] md:h-dvh md:flex-col md:items-stretch md:justify-start md:p-6 md:gap-2 md:border-t-0 md:border-r"
    >
      <div className="hidden md:flex items-center gap-3 px-3 py-2 mb-4 text-[var(--text-primary)] text-lg font-bold tracking-tight">
        <Receipt size={22} strokeWidth={1.5} className="text-[var(--accent)]" />
        <span>BillStash</span>
      </div>

      <NavLink
        to="/scan"
        className="hidden md:flex items-center justify-center gap-2 p-3 mb-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors"
      >
        <Plus size={18} />
        <span>New Bill</span>
      </NavLink>

      <div className="contents md:flex md:flex-col md:gap-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors md:flex-row md:justify-start md:gap-3 md:flex-none md:p-3 md:rounded-lg ${
                isActive
                  ? 'text-[var(--accent)] md:bg-[var(--accent-subtle)] md:text-[var(--accent)]'
                  : 'md:hover:bg-[var(--bg-hover)] md:hover:text-[var(--text-primary)]'
              }`
            }
            end={path === '/'}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] md:text-sm font-medium tracking-tight">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
