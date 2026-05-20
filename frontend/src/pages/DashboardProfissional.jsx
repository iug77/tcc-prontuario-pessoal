import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardProfissional() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [profissional, setProfissional] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [totalMensagens, setTotalMensagens] = useState(0);
  const [pagina, setPagina] = useState(1);

  const TAMANHO_PAGINA = 10;

  const primeiroNome = (profissional?.nome || 'Gabriel').trim().split(' ')[0] || 'Gabriel';

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    const carregarDashboard = async () => {
      try {
        setCarregando(true);
        setErro('');

        const [respostaDashboard, respostaMensagens] = await Promise.all([
          fetch(`${API_URL}/api/profissionais/dashboard`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/api/chat/contar`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        const dadosDashboard = await respostaDashboard.json();
        const dadosMensagens = await respostaMensagens.json();

        if (!respostaDashboard.ok) {
          setErro(dadosDashboard.erro || 'Não foi possível carregar os dados do dashboard.');

          if (respostaDashboard.status === 401 || respostaDashboard.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            navigate('/');
          }

          return;
        }

        setProfissional(dadosDashboard.profissional);
        setPacientes(dadosDashboard.pacientes || []);
        setTotalMensagens(dadosMensagens.totalMensagens || 0);
      } catch (error) {
        console.error('Erro ao carregar dashboard profissional:', error);
        setErro('Erro de conexão com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDashboard();

    const intervalo = setInterval(async () => {
      try {
        const tokenAtual = localStorage.getItem('token');
        if (!tokenAtual) return;

        const respostaMensagens = await fetch(`${API_URL}/api/chat/contar`, {
          headers: {
            Authorization: `Bearer ${tokenAtual}`
          }
        });

        const dadosMensagens = await respostaMensagens.json();
        if (respostaMensagens.ok) {
          setTotalMensagens(dadosMensagens.totalMensagens || 0);
        }
      } catch {
        // Evita ruído de erro em polling
      }
    }, 8000);

    return () => clearInterval(intervalo);
  }, [navigate]);

  const pacientesFiltrados = useMemo(() => {
    const textoBusca = busca.trim().toLowerCase();

    if (!textoBusca) {
      return pacientes;
    }

    return pacientes.filter((paciente) =>
      paciente.nome.toLowerCase().includes(textoBusca) ||
      paciente.email.toLowerCase().includes(textoBusca)
    );
  }, [busca, pacientes]);

  const totalPaginas = Math.max(1, Math.ceil(pacientesFiltrados.length / TAMANHO_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * TAMANHO_PAGINA;
  const fim = inicio + TAMANHO_PAGINA;
  const pacientesPaginados = pacientesFiltrados.slice(inicio, fim);

  useEffect(() => {
    setPagina(1);
  }, [busca]);

  const formatarExpiracao = (dataIso, status) => {
    if (!dataIso) {
      return 'Sem expiração';
    }

    if (status === 'Inativo') {
      return 'Expirado';
    }

    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  const classeTagPermissao = (permissao) => {
    if (permissao === 'Leitura e Escrita') {
      return 'tag tag-success';
    }

    return 'tag';
  };

  const classeTagExpiracao = (dataIso, status) => {
    if (!dataIso) {
      return 'tag';
    }

    if (status === 'Inativo') {
      return 'tag tag-danger';
    }

    return 'tag tag-success';
  };

  const solicitacoesPendentes = [
    {
      id: 'req-1',
      paciente: 'Ana Souza',
      dataSolicitacao: '14/05/2026',
      status: 'Aguardando Liberação'
    },
    {
      id: 'req-2',
      paciente: 'Marcos Lima',
      dataSolicitacao: '12/05/2026',
      status: 'Aguardando Liberação'
    }
  ];

  return (
    <div className="app-page">
      <div className="app-container max-w-5xl space-y-6">

        {/* Top Nav */}
        <header className="card border-0 shadow-sm">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="avatar avatar-primary">DP</div>
              <div>
                <p className="title" style={{ fontSize: 18 }}>Dashboard do Profissional</p>
                <p className="text-sm text-muted">Gerencie acessos e prontuários</p>
              </div>
            </div>

            <nav className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => navigate('/auditoria')}
                className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
              >
                Auditoria
              </button>

              <button
                type="button"
                onClick={() => {
                  setTotalMensagens(0);
                  navigate('/chat');
                }}
                className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
              >
                Mensagens
                {totalMensagens > 0 && <span className="tag tag-primary">{totalMensagens}</span>}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
              >
                Sair
              </button>
            </nav>
          </div>
        </header>

        {/* Card de Perfil do Profissional */}
        <section className="card strip-success p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Olá, {primeiroNome}</h1>
              <p className="text-sm text-muted font-medium mt-1">
                CRM: {profissional?.crm || 'Não informado'} | Especialidade: {profissional?.especialidade || 'Não informada'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <div className="bg-surface rounded-xl shadow-sm p-4 min-w-[160px]">
                <p className="text-xs text-muted font-semibold">Pacientes Ativos</p>
                <p className="text-2xl font-extrabold tracking-tight mt-1">12</p>
              </div>
              <div className="bg-surface rounded-xl shadow-sm p-4 min-w-[160px]">
                <p className="text-xs text-muted font-semibold">Acessos Pendentes</p>
                <p className="text-2xl font-extrabold tracking-tight mt-1">3</p>
              </div>
            </div>
          </div>
        </section>

        {/* Lista de Pacientes Compartilhados */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-lg font-extrabold tracking-tight">Pacientes com Acesso Concedido</h2>
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
                placeholder="Buscar paciente..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input w-72 pl-10"
              />
            </div>
          </div>

          {carregando && (
            <div className="p-6 text-sm text-muted">Carregando dados do dashboard...</div>
          )}

          {!carregando && erro && (
            <div className="p-6 border-t border-[rgb(var(--border))]">
              <div className="alert alert-danger">{erro}</div>
            </div>
          )}

          {!carregando && !erro && (
            <div className="overflow-x-auto">
            <table className="table table-strong">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Nível de Permissão</th>
                  <th>Expiração</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.length === 0 && (
                  <tr>
                    <td className="text-sm text-muted" colSpan={4}>
                      Nenhum paciente encontrado para este profissional.
                    </td>
                  </tr>
                )}

                {pacientesPaginados.map((paciente) => (
                  <tr
                    key={paciente.permissaoId}
                    className={`${paciente.status === 'Inativo' ? 'opacity-60' : ''}`}
                  >
                    <td>
                      <p className="font-extrabold tracking-tight">{paciente.nome}</p>
                      <p className="text-muted text-xs">{paciente.email}</p>
                    </td>
                    <td>
                      <span className={classeTagPermissao(paciente.permissao)}>
                        {paciente.permissao}
                      </span>
                    </td>
                    <td>
                      <span className={classeTagExpiracao(paciente.expiraEm, paciente.status)}>
                        {formatarExpiracao(paciente.expiraEm, paciente.status)}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => paciente.status === 'Ativo' && navigate('/visualizador', { state: { pacienteId: paciente.pacienteId } })}
                          disabled={paciente.status === 'Inativo'}
                          className={`btn ${paciente.status === 'Inativo' ? 'btn-outline' : 'btn-primary'}`}
                        >
                          Prontuário
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Rodapé / Paginação */}
          {!carregando && !erro && pacientesFiltrados.length > 0 && (
            <div className="bg-surface-2 p-4 border-t border-[rgb(var(--border))] text-sm text-muted flex flex-wrap gap-3 justify-between items-center">
              <p>
                Mostrando {Math.min(inicio + 1, pacientesFiltrados.length)}–{Math.min(fim, pacientesFiltrados.length)} de {pacientesFiltrados.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual <= 1}
                >
                  &lt; Anterior
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual >= totalPaginas}
                >
                  Próximo &gt;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Solicitações de Acesso Pendentes */}
        <section className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-lg font-extrabold tracking-tight">Solicitações de Acesso Pendentes</h2>
            <span className="tag tag-warning">{solicitacoesPendentes.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-strong">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Data da Solicitação</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoesPendentes.map((solicitacao) => (
                  <tr key={solicitacao.id}>
                    <td className="font-semibold">{solicitacao.paciente}</td>
                    <td>{solicitacao.dataSolicitacao}</td>
                    <td>
                      <span className="tag tag-warning">{solicitacao.status}</span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
                      >
                        Reenviar Solicitação
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-surface-2 p-4 border-t border-[rgb(var(--border))] text-xs text-muted">
            Itens de exemplo para demonstrar a lógica de autorização (pendente até o paciente aprovar).
          </div>
        </section>

      </div>
    </div>
  );
}


