import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import NovoRegistro from './pages/novoregistro';
import Permissoes from './pages/Permissoes';
import Auditoria from './pages/Auditoria';
import Chat from './pages/Chat';
import DashboardProfissional from './pages/DashboardProfissional';
import Visualizador from './pages/Visualizador';

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
          path="/visualizador"
          element={(
            <PrivateRoute tiposPermitidos={['profissional']}>
              <Visualizador />
            </PrivateRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;