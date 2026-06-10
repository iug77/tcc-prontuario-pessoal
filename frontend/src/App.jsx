import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { Component, lazy, Suspense } from 'react';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { erro: null }; }
  static getDerivedStateFromError(e) { return { erro: e?.message || 'Erro desconhecido' }; }
  componentDidCatch(e, info) { console.error('[ErrorBoundary]', e, info); }
  render() {
    if (this.state.erro) {
      return (
        <div style={{ padding: 40, textAlign: 'center', background: 'rgb(248 250 252)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 16 }}>Esta página encontrou um erro</p>
          <pre style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 14px', borderRadius: 6, fontSize: 12, maxWidth: 480, whiteSpace: 'pre-wrap' }}>{this.state.erro}</pre>
          <button onClick={() => this.setState({ erro: null })} style={{ padding: '8px 20px', borderRadius: 6, background: '#6d28d9', color: 'white', border: 'none', cursor: 'pointer' }}>Tentar novamente</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import NovoRegistro from './pages/novoregistro';
import Permissoes from './pages/Permissoes';
import Auditoria from './pages/Auditoria';
import Chat from './pages/Chat';
import DashboardProfissional from './pages/DashboardProfissional';
import Visualizador from './pages/Visualizador';
import MeusRegistros from './pages/MeusRegistros';
import AdminDashboard from './pages/AdminDashboard';
import MeuPerfil from './pages/MeuPerfil';
import PerfilProfissional from './pages/PerfilProfissional';
import PerfilPaciente from './pages/PerfilPaciente';
import EditarRegistro from './pages/EditarRegistro';

const TendenciasClinicas = lazy(() => import('./pages/TendenciasClinicas'));

const obterSessao = () => {
  const token = localStorage.getItem('token');
  const usuarioBruto = localStorage.getItem('usuario');

  if (!token || !usuarioBruto) {
    return null;
  }

  try {
    const usuario = JSON.parse(usuarioBruto);

    if (!usuario?.tipo) {
      return null;
    }

    return { token, usuario };
  } catch {
    return null;
  }
};

function PublicRoute({ children }) {
  const sessao = obterSessao();

  if (sessao?.usuario?.tipo === 'paciente') {
    return <Navigate to="/dashboard" replace />;
  }

  if (sessao?.usuario?.tipo === 'profissional') {
    return <Navigate to="/dashboard-profissional" replace />;
  }

  return children;
}

function PrivateRoute({ children, tiposPermitidos }) {
  const sessao = obterSessao();

  if (!sessao) {
    return <Navigate to="/" replace />;
  }

  if (!tiposPermitidos.includes(sessao.usuario.tipo)) {
    const rotaPadrao = sessao.usuario.tipo === 'profissional' ? '/dashboard-profissional' : '/dashboard';
    return <Navigate to={rotaPadrao} replace />;
  }

  return children;
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={(
            <PublicRoute>
              <Login />
            </PublicRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <PrivateRoute tiposPermitidos={['paciente']}>
              <Dashboard />
            </PrivateRoute>
          )}
        />
        <Route
          path="/novo-registro"
          element={(
            <PrivateRoute tiposPermitidos={['paciente']}>
              <NovoRegistro />
            </PrivateRoute>
          )}
        />
        <Route
          path="/meus-exames"
          element={(
            <PrivateRoute tiposPermitidos={['paciente']}>
              <MeusRegistros />
            </PrivateRoute>
          )}
        />
        <Route
          path="/meus-registros"
          element={(
            <PrivateRoute tiposPermitidos={['paciente']}>
              <MeusRegistros />
            </PrivateRoute>
          )}
        />
        <Route
          path="/permissoes"
          element={(
            <PrivateRoute tiposPermitidos={['paciente']}>
              <Permissoes />
            </PrivateRoute>
          )}
        />
        <Route
          path="/auditoria"
          element={(
            <PrivateRoute tiposPermitidos={['paciente', 'profissional']}>
              <Auditoria />
            </PrivateRoute>
          )}
        />
        <Route
          path="/chat"
          element={(
            <PrivateRoute tiposPermitidos={['paciente', 'profissional']}>
              <Chat />
            </PrivateRoute>
          )}
        />
        <Route
          path="/dashboard-profissional"
          element={(
            <PrivateRoute tiposPermitidos={['profissional']}>
              <DashboardProfissional />
            </PrivateRoute>
          )}
        />
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />
        <Route
          path="/visualizador"
          element={(
            <PrivateRoute tiposPermitidos={['profissional']}>
              <Visualizador />
            </PrivateRoute>
          )}
        />
        <Route
          path="/meu-perfil"
          element={(
            <PrivateRoute tiposPermitidos={['paciente', 'profissional']}>
              <MeuPerfil />
            </PrivateRoute>
          )}
        />
        <Route
          path="/perfil/profissional/:id"
          element={(
            <PrivateRoute tiposPermitidos={['paciente', 'profissional']}>
              <PerfilProfissional />
            </PrivateRoute>
          )}
        />
        <Route
          path="/perfil/paciente/:id"
          element={(
            <PrivateRoute tiposPermitidos={['profissional']}>
              <PerfilPaciente />
            </PrivateRoute>
          )}
        />
        <Route
          path="/tendencias"
          element={(
            <PrivateRoute tiposPermitidos={['paciente']}>
              <ErrorBoundary>
                <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Carregando...</div>}>
                  <TendenciasClinicas />
                </Suspense>
              </ErrorBoundary>
            </PrivateRoute>
          )}
        />
        <Route
          path="/editar-registro/:registroId"
          element={(
            <PrivateRoute tiposPermitidos={['paciente']}>
              <EditarRegistro />
            </PrivateRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;