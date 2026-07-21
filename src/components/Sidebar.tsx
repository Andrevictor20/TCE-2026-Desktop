import { NavLink } from 'react-router-dom';

const navItems = [
  {
    section: 'Principal',
    items: [
      { to: '/', icon: '📊', label: 'Dashboard' },
      { to: '/edital', icon: '📋', label: 'Edital Estruturado' },
      { to: '/planner', icon: '📅', label: 'Planner' },
    ],
  },
  {
    section: 'Prática',
    items: [
      { to: '/questions', icon: '❓', label: 'Banco de Questões' },
      { to: '/exams', icon: '📝', label: 'Simulados' },
    ],
  },
  {
    section: 'Estudo',
    items: [
      { to: '/notebooks', icon: '📓', label: 'Notebooks' },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { to: '/settings', icon: '⚙️', label: 'Configurações' },
    ],
  },
];

export default function Sidebar() {
  return (
    <nav className="app-sidebar" id="main-sidebar">
      {navItems.map((section) => (
        <div key={section.section} className="sidebar-section">
          <div className="sidebar-section__label">{section.section}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`
              }
              end={item.to === '/'}
            >
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <div className="sidebar-section" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-md)' }}>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', padding: '0 var(--space-md)' }}>
          Cargo 15 — Auditor TI
          <br />
          TCE/MA 2026
        </div>
      </div>
    </nav>
  );
}
