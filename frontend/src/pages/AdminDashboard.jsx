import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'admin_token_v1';

const formatarData = (dataIso) => {
  if (!dataIso) return '-';

  const data = dataIso instanceof Date ? dataIso : new Date(dataIso);
  if (Number.isNaN(data.getTime())) {
    return '-';
  }

  return data.toLocaleDateString('pt-BR');
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

  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [erroUsuarios, setErroUsuarios] = useState('');

  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [erroDetalhes, setErroDetalhes] = useState('');
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  const [adminLogin, setAdminLogin] = useState('');
  const [adminSenha, setAdminSenha] = useState('');
  const [adminErro, setAdminErro] = useState('');
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY) || '');

  const adminAutenticado = Boolean(adminToken);

  const handleAdminSubmit = async (evento) => {
    evento.preventDefault();
    setAdminErro('');

    try {
      const resposta = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: adminLogin.trim(),
          senha: adminSenha
        })
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        setAdminErro(dados.erro || 'Não foi possível autenticar no admin.');
        return;
      }

      if (!dados?.token) {
        setAdminErro('Resposta inválida do servidor (token ausente).');
        return;
      }

      sessionStorage.setItem(ADMIN_TOKEN_KEY, dados.token);
      setAdminToken(dados.token);
      setAdminLogin('');
      setAdminSenha('');
    } catch (error) {
      console.error('Erro ao autenticar admin:', error);
      setAdminErro('Erro de conexão com o servidor.');
    }
  };

  const handleAdminSair = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken('');
    setAdminErro('');
    navigate('/');
  };

  const handleFecharDetalhes = () => {
    setUsuarioSelecionado(null);
    setErroDetalhes('');
    setCarregandoDetalhes(false);
    setAtualizandoStatus(false);
  };

  const carregarUsuariosAdmin = async () => {
    try {
      setCarregandoUsuarios(true);
      setErroUsuarios('');

      const resposta = await fetch(`${API_URL}/api/admin/usuarios`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        const erroApi = dados.erro || 'Não foi possível carregar os usuários.';
        setErroUsuarios(erroApi);

        if (resposta.status === 401 || resposta.status === 403) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminToken('');
        }

        return;
      }

      setUsuarios(Array.isArray(dados.usuarios) ? dados.usuarios : []);
    } catch (error) {
      console.error('Erro ao carregar usuários admin:', error);
      setErroUsuarios('Erro de conexão com o servidor.');
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  const handleGerenciar = async (usuarioBase) => {
    if (!usuarioBase?.id || !usuarioBase?.tipo) {
      return;
    }

    setErroDetalhes('');
    setCarregandoDetalhes(true);
    setUsuarioSelecionado(null);

    try {
      const resposta = await fetch(`${API_URL}/api/admin/usuarios/${usuarioBase.tipo}/${usuarioBase.id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        const erroApi = dados.erro || 'Não foi possível carregar os detalhes do usuário.';
        setErroDetalhes(erroApi);

        if (resposta.status === 401 || resposta.status === 403) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminToken('');
        }

        return;
      }

      setUsuarioSelecionado(dados?.usuario || null);
    } catch (error) {
      console.error('Erro ao carregar detalhes do usuário:', error);
      setErroDetalhes('Erro de conexão com o servidor.');
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  useEffect(() => {
    if (!adminAutenticado) {
      setUsuarios([]);
      setErroUsuarios('');
      setCarregandoUsuarios(false);
      handleFecharDetalhes();
      return;
    }

    carregarUsuariosAdmin();
  }, [adminAutenticado, adminToken]);

  const atualizarStatusSelecionado = async () => {
    if (!usuarioSelecionado?.id || !usuarioSelecionado?.tipo) {
      return;
    }

    const statusAtual = usuarioSelecionado.status === 'Ativo';
    const proximoAtivo = !statusAtual;

    setAtualizandoStatus(true);
    setErroDetalhes('');

    try {
      const resposta = await fetch(
        `${API_URL}/api/admin/usuarios/${usuarioSelecionado.tipo}/${usuarioSelecionado.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ ativo: proximoAtivo })
        }
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        const erroApi = dados.erro || 'Não foi possível atualizar o status.';
        setErroDetalhes(erroApi);

        if (resposta.status === 401 || resposta.status === 403) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setAdminToken('');
        }

        return;
      }

      // Recarrega detalhes e lista para refletir o novo status
      await Promise.all([
        carregarUsuariosAdmin(),
        handleGerenciar({ id: usuarioSelecionado.id, tipo: usuarioSelecionado.tipo })
      ]);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setErroDetalhes('Erro de conexão com o servidor.');
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      if (aba === 'Pacientes' && usuario.tipo !== 'paciente') return false;
      if (aba === 'Profissionais' && usuario.tipo !== 'profissional') return false;

      if (!texto) return true;

      return (
        usuario.nome.toLowerCase().includes(texto) ||
        usuario.email.toLowerCase().includes(texto)
      );
    });
  }, [aba, busca, usuarios]);

  const totalUsuarios = usuarios.length;
  const totalPacientes = usuarios.filter((u) => u.tipo === 'paciente').length;
  const totalProfissionais = usuarios.filter((u) => u.tipo === 'profissional').length;
  const totalAtivos = usuarios.filter((u) => u.status === 'Ativo').length;

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

        {(carregandoDetalhes || erroDetalhes || usuarioSelecionado) && (
          <section className="card border-0 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">Gerenciar Usuário</h2>
                <p className="text-sm text-muted">Detalhes e métricas do usuário selecionado.</p>
              </div>
              <button
                type="button"
                onClick={handleFecharDetalhes}
                className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
              >
                Fechar
              </button>
            </div>

            {carregandoDetalhes && (
              <div className="mt-4 text-sm text-muted">Carregando detalhes...</div>
            )}

            {!carregandoDetalhes && erroDetalhes && (
              <div className="mt-4 alert alert-danger">
                <p className="text-sm font-semibold">{erroDetalhes}</p>
              </div>
            )}

            {!carregandoDetalhes && !erroDetalhes && usuarioSelecionado && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface rounded-xl shadow-sm p-4">
                  <p className="text-xs text-muted font-semibold">Nome</p>
                  <p className="text-base font-extrabold tracking-tight mt-1">{usuarioSelecionado.nome}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={tagTipo(usuarioSelecionado.tipo)}>
                      {usuarioSelecionado.tipo === 'paciente' ? 'Paciente' : 'Profissional'}
                    </span>
                    {usuarioSelecionado.tipo === 'profissional' && usuarioSelecionado.crm && (
                      <span className="tag">CRM: {usuarioSelecionado.crm}</span>
                    )}
                    {usuarioSelecionado.tipo === 'profissional' && usuarioSelecionado.especialidade && (
                      <span className="tag">{usuarioSelecionado.especialidade}</span>
                    )}
                  </div>
                </div>

                <div className="bg-surface rounded-xl shadow-sm p-4">
                  <p className="text-xs text-muted font-semibold">E-mail</p>
                  <p className="text-sm font-semibold mt-1 break-all">{usuarioSelecionado.email}</p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(usuarioSelecionado.email);
                        } catch {
                          // Sem permissão de clipboard
                        }
                      }}
                      className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
                    >
                      Copiar e-mail
                    </button>
                  </div>
                </div>

                <div className="bg-surface rounded-xl shadow-sm p-4">
                  <p className="text-xs text-muted font-semibold">Criado em</p>
                  <p className="text-sm font-semibold mt-1">{formatarData(usuarioSelecionado.criadoEm)}</p>
                </div>

                <div className="bg-surface rounded-xl shadow-sm p-4 md:col-span-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted font-semibold">Status da Conta</p>
                      <div className="mt-2">
                        <span className={tagStatus(usuarioSelecionado.status)}>{usuarioSelecionado.status}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={atualizarStatusSelecionado}
                      disabled={atualizandoStatus}
                      className="btn btn-primary"
                    >
                      {atualizandoStatus
                        ? 'Salvando...'
                        : usuarioSelecionado.status === 'Ativo'
                          ? 'Desativar conta'
                          : 'Ativar conta'}
                    </button>
                  </div>

                  <p className="text-xs text-muted mt-3">
                    Ao desativar, o usuário não consegue mais acessar a API (mesmo com token).
                  </p>
                </div>

                <div className="bg-surface rounded-xl shadow-sm p-4 md:col-span-3">
                  <p className="text-xs text-muted font-semibold">Métricas</p>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {usuarioSelecionado.tipo === 'paciente' ? (
                      <>
                        <div>
                          <p className="text-xs text-muted font-semibold">Registros</p>
                          <p className="text-2xl font-extrabold tracking-tight mt-1">{usuarioSelecionado?.contagens?.registros ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted font-semibold">Permissões</p>
                          <p className="text-2xl font-extrabold tracking-tight mt-1">{usuarioSelecionado?.contagens?.permissoes ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted font-semibold">Mensagens</p>
                          <p className="text-2xl font-extrabold tracking-tight mt-1">{usuarioSelecionado?.contagens?.mensagens ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted font-semibold">Insights IA</p>
                          <p className="text-2xl font-extrabold tracking-tight mt-1">{usuarioSelecionado?.contagens?.insightsIA ?? 0}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-muted font-semibold">Permissões</p>
                          <p className="text-2xl font-extrabold tracking-tight mt-1">{usuarioSelecionado?.contagens?.permissoesRecebidas ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted font-semibold">Mensagens</p>
                          <p className="text-2xl font-extrabold tracking-tight mt-1">{usuarioSelecionado?.contagens?.mensagens ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted font-semibold">Insights Gerados</p>
                          <p className="text-2xl font-extrabold tracking-tight mt-1">{usuarioSelecionado?.contagens?.insightsGerados ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted font-semibold">-</p>
                          <p className="text-sm text-muted mt-2">Ações (bloquear/reativar) podem ser adicionadas depois.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="card border-0 shadow-sm overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Usuários</h2>
              <p className="text-sm text-muted">Pacientes e profissionais cadastrados no sistema.</p>
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
                {carregandoUsuarios && (
                  <tr>
                    <td className="text-sm text-muted" colSpan={6}>
                      Carregando usuários...
                    </td>
                  </tr>
                )}

                {!carregandoUsuarios && erroUsuarios && (
                  <tr>
                    <td className="text-sm" colSpan={6}>
                      <div className="alert alert-danger">
                        <p className="text-sm font-semibold">{erroUsuarios}</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!carregandoUsuarios && !erroUsuarios && usuariosFiltrados.length === 0 && (
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
                        onClick={() => handleGerenciar(usuario)}
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
            Dados carregados via API: <span className="font-semibold">/api/admin/usuarios</span>.
          </div>
        </section>
      </div>
    </div>
  );
}
