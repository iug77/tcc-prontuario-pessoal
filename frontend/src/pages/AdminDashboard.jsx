import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_SESSION_KEY = 'admin_session_authed_v1';

const usuariosExemplo = [
  {
    id: 'p-1',
    tipo: 'paciente',
    nome: 'Guilherme Souza',
    email: 'guilherme@email.com',
    status: 'Ativo',
    criadoEm: '2026-05-10'
  },
  {
    id: 'p-2',
    tipo: 'paciente',
    nome: 'Ana Pereira',
    email: 'ana@email.com',
    status: 'Ativo',
    criadoEm: '2026-05-02'
  },
  {
    id: 'p-3',
    tipo: 'paciente',
    nome: 'Marcos Lima',
    email: 'marcos@email.com',
    status: 'Inativo',
    criadoEm: '2026-04-28'
  },
  {
    id: 'm-1',
    tipo: 'profissional',
    nome: 'Dr. Gabriel',
    email: 'gabriel@clinica.com',
    status: 'Ativo',
    criadoEm: '2026-04-15'
  },
  {
    id: 'm-2',
    tipo: 'profissional',
    nome: 'Dra. Camila Rocha',
    email: 'camila@clinica.com',
    status: 'Ativo',
    criadoEm: '2026-04-01'
  }
];

const formatarData = (dataIso) => {
  if (!dataIso) return '-';

  return new Date(`${dataIso}T00:00:00`).toLocaleDateString('pt-BR');
};

const tagStatus = (status) => {
  if (status === 'Ativo') return 'tag tag-success';
  if (status === 'Inativo') return 'tag tag-danger';
  return 'tag';
};

const tagTipo = (tipo) => {
  if (tipo === 'profissional') return 'tag tag-primary';
  if (tipo === 'paciente') return 'tag';
  return 'tag';
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState('Todos');

  const [adminLogin, setAdminLogin] = useState('');
  const [adminSenha, setAdminSenha] = useState('');
  const [adminErro, setAdminErro] = useState('');
  const [adminAutenticado, setAdminAutenticado] = useState(
    sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'
  );

  const handleAdminSubmit = (evento) => {
    evento.preventDefault();
    setAdminErro('');

    const login = adminLogin.trim();
    const senha = adminSenha;

    if (login === 'admin' && senha === 'admin') {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      setAdminAutenticado(true);
      setAdminLogin('');
      setAdminSenha('');
      return;
    }

    setAdminErro('Login ou senha inválidos.');
  };

  const handleAdminSair = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminAutenticado(false);
    setAdminErro('');
    navigate('/');
  };

  if (!adminAutenticado) {
    return (
      <div className="app-page">
        <div className="app-container max-w-xl">
          <section className="card border-0 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar avatar-primary">AD</div>
              <div>
                <p className="title" style={{ fontSize: 18 }}>Acesso ao Painel Admin</p>
                <p className="text-sm text-muted">Área restrita ao dono do aplicativo</p>
              </div>
            </div>

            {adminErro && (
              <div className="alert alert-danger mb-4">
                <p className="text-sm font-semibold">{adminErro}</p>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Login</label>
                <input
                  type="text"
                  value={adminLogin}
                  onChange={(e) => setAdminLogin(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="input mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Senha</label>
                <input
                  type="password"
                  value={adminSenha}
                  onChange={(e) => setAdminSenha(e.target.value)}
                  placeholder="admin"
                  autoComplete="current-password"
                  className="input mt-2"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Entrar
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  const usuariosFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return usuariosExemplo.filter((usuario) => {
      if (aba === 'Pacientes' && usuario.tipo !== 'paciente') return false;
      if (aba === 'Profissionais' && usuario.tipo !== 'profissional') return false;

      if (!texto) return true;

      return (
        usuario.nome.toLowerCase().includes(texto) ||
        usuario.email.toLowerCase().includes(texto)
      );
    });
  }, [aba, busca]);

  const totalUsuarios = usuariosExemplo.length;
  const totalPacientes = usuariosExemplo.filter((u) => u.tipo === 'paciente').length;
  const totalProfissionais = usuariosExemplo.filter((u) => u.tipo === 'profissional').length;
  const totalAtivos = usuariosExemplo.filter((u) => u.status === 'Ativo').length;

  return (
    <div className="app-page">
      <div className="app-container max-w-6xl space-y-6">
        <header className="card border-0 shadow-sm">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="avatar avatar-primary">AD</div>
              <div>
                <p className="title" style={{ fontSize: 18 }}>Painel Admin</p>
                <p className="text-sm text-muted">Gerencie pacientes e profissionais</p>
              </div>
            </div>

            <nav className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={handleAdminSair}
                className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
              >
                Sair do Admin
              </button>
            </nav>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card border-0 shadow-sm p-5">
            <p className="text-xs text-muted font-semibold">Total de Usuários</p>
            <p className="text-2xl font-extrabold tracking-tight mt-1">{totalUsuarios}</p>
          </div>
          <div className="card border-0 shadow-sm p-5">
            <p className="text-xs text-muted font-semibold">Pacientes</p>
            <p className="text-2xl font-extrabold tracking-tight mt-1">{totalPacientes}</p>
          </div>
          <div className="card border-0 shadow-sm p-5">
            <p className="text-xs text-muted font-semibold">Profissionais</p>
            <p className="text-2xl font-extrabold tracking-tight mt-1">{totalProfissionais}</p>
          </div>
          <div className="card border-0 shadow-sm p-5">
            <p className="text-xs text-muted font-semibold">Ativos</p>
            <p className="text-2xl font-extrabold tracking-tight mt-1">{totalAtivos}</p>
          </div>
        </section>

        <section className="card border-0 shadow-sm overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Usuários</h2>
              <p className="text-sm text-muted">(Dados de exemplo) Pronto para integrar com o backend.</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="flex items-center gap-2 flex-wrap">
                {['Todos', 'Pacientes', 'Profissionais'].map((opcao) => {
                  const ativo = aba === opcao;

                  return (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => setAba(opcao)}
                      aria-pressed={ativo}
                      className={
                        ativo
                          ? 'px-3 py-1.5 rounded-full text-sm font-semibold bg-[rgb(var(--primary))] text-white'
                          : 'px-3 py-1.5 rounded-full text-sm font-semibold bg-[rgba(var(--text),0.06)] text-[rgb(var(--muted))] hover:bg-[rgba(var(--text),0.09)]'
                      }
                    >
                      {opcao}
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="input w-80 pl-10"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-strong">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td className="text-sm text-muted" colSpan={6}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}

                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="font-semibold">{usuario.nome}</td>
                    <td>
                      <span className={tagTipo(usuario.tipo)}>
                        {usuario.tipo === 'paciente' ? 'Paciente' : 'Profissional'}
                      </span>
                    </td>
                    <td className="text-sm">{usuario.email}</td>
                    <td>
                      <span className={tagStatus(usuario.status)}>{usuario.status}</span>
                    </td>
                    <td className="text-sm text-muted">{formatarData(usuario.criadoEm)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-surface-2 p-4 border-t border-[rgb(var(--border))] text-xs text-muted">
            Para integrar: criar endpoint de admin no backend (listar usuários + ações de bloqueio/reativação).
          </div>
        </section>
      </div>
    </div>
  );
}
