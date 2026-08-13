import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, ScanLine, BarChart2, Settings, Receipt, Plus } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/bills', icon: FileText, label: 'Bills' },
  { path: '/scan', icon: ScanLine, label: 'Scan' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  // Hide on login page
  if (location.pathname === '/login') return null;

  return (
    <nav className="app-nav" id="app-nav">
      <div className="app-nav-brand">
        <Receipt size={22} strokeWidth={1.5} />
        <span>BillStash</span>
      </div>

      <NavLink to="/scan" className="app-nav-new-btn">
        <Plus size={18} />
        <span>New Bill</span>
      </NavLink>

      <div className="app-nav-links">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `app-nav-item ${isActive ? 'active' : ''}`
            }
            end={path === '/'}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="app-nav-label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
