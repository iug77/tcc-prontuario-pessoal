import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

/* ── Icons ─────────────────────────────────────────────── */
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar-item-icon">
    <path d={d} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const icons = {
  home:    'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z M9 22V12h6v10',
  file:    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  lock:    'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z M7 11V7a5 5 0 0 1 10 0v4',
  chat:    'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z',
  shield:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  list:    'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  user:    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  logout:  'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  menu:    'M3 12h18 M3 6h18 M3 18h18',
  cross:   'M18 6 6 18 M6 6l12 12',
  heart:   'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z',
};

const NAV_PACIENTE = [
  { label: 'Dashboard',  path: '/dashboard',       icon: 'home'   },
  { label: 'Registros',  path: '/meus-registros',  icon: 'file'   },
  { label: 'Permissões', path: '/permissoes',       icon: 'lock'   },
  { label: 'Mensagens',  path: '/chat',             icon: 'chat',  badge: true },
  { label: 'Logs LGPD',  path: '/auditoria',        icon: 'shield' },
];

const NAV_PROFISSIONAL = [
  { label: 'Dashboard',  path: '/dashboard-profissional', icon: 'home'  },
  { label: 'Mensagens',  path: '/chat',                   icon: 'chat', badge: true },
  { label: 'Auditoria',  path: '/auditoria',              icon: 'list'  },
];

/* ── AppLayout ─────────────────────────────────────────── */
export default function AppLayout({ children, title }) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [totalMensagens, setTotalMensagens] = useState(0);

  const sessaoRaw = localStorage.getItem('usuario');
  const sessao    = sessaoRaw ? JSON.parse(sessaoRaw) : {};
  const tipo      = sessao?.tipo || 'paciente';
  const nome      = sessao?.nome || '';
  const primeiroNome = nome.trim().split(' ')[0] || 'Usuário';

  const navItems = tipo === 'profissional' ? NAV_PROFISSIONAL : NAV_PACIENTE;

  const iniciais = (n = '') =>
    String(n).trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?';

  /* Poll mensagens */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const buscar = async () => {
      try {
        const r = await fetch(`${API_URL}/api/chat/contar`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok) setTotalMensagens(d.totalMensagens || 0);
      } catch { /* silently ignore */ }
    };

    buscar();
    const id = setInterval(buscar, 10000);
    return () => clearInterval(id);
  }, []);

  /* Clear badge on chat */
  useEffect(() => {
    if (location.pathname === '/chat') setTotalMensagens(0);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.25)"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-logo-text">Prontuário</div>
          <div className="sidebar-logo-sub">{tipo === 'profissional' ? 'Área Profissional' : 'Painel do Paciente'}</div>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map((item) => {
          const active  = isActive(item.path);
          const hasBadge = item.badge && totalMensagens > 0;
          return (
            <button
              key={item.path}
              type="button"
              className={`sidebar-item${active ? ' active' : ''}`}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
            >
              <Icon d={icons[item.icon]} />
              {item.label}
              {hasBadge && <span className="sidebar-badge">{totalMensagens}</span>}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          type="button"
          className={`sidebar-item${isActive('/meu-perfil') ? ' active' : ''}`}
          onClick={() => { navigate('/meu-perfil'); setMobileOpen(false); }}
          style={{ marginBottom: 4 }}
        >
          <Icon d={icons.user} />
          Meu Perfil
        </button>

        <button
          type="button"
          className="sidebar-user"
          onClick={() => { navigate('/meu-perfil'); setMobileOpen(false); }}
        >
          <div
            className="avatar"
            style={{ background: 'rgba(124,58,237,0.25)', color: '#c4b5fd', width: 32, height: 32, fontSize: 11 }}
          >
            {iniciais(nome)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{primeiroNome}</div>
            <div className="sidebar-user-role">{tipo === 'profissional' ? 'Profissional' : 'Paciente'}</div>
          </div>
        </button>

        <button
          type="button"
          className="sidebar-item"
          onClick={handleLogout}
          style={{ marginTop: 2 }}
        >
          <Icon d={icons.logout} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      {/* Sidebar — desktop */}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        <SidebarContent />
      </aside>

      {/* Overlay — mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay mobile-open"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="shell-content">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button
            type="button"
            className="hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              {mobileOpen
                ? <path d="M18 6 6 18 M6 6l12 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                : <path d="M3 12h18 M3 6h18 M3 18h18"  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              }
            </svg>
          </button>
          <span className="mobile-topbar-title">Prontuário</span>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
