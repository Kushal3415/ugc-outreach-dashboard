import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',          label: 'Dashboard',   icon: '📊' },
  { to: '/leads',     label: 'Leads',       icon: '👥' },
  { to: '/templates', label: 'Templates',   icon: '📝' },
  { to: '/logs',      label: 'Email Logs',  icon: '📨' },
  { to: '/settings',  label: 'Settings',    icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">UGC Outreach</h1>
        <p className="text-xs text-gray-400 mt-1">Outreach Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">v1.0.0 · UGC Outreach</p>
      </div>
    </aside>
  );
}
