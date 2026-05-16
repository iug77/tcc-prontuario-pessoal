import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [paciente, setPaciente] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [totalPermissoesAtivas, setTotalPermissoesAtivas] = useState(0);
  const [totalMensagens, setTotalMensagens] = useState(0);
  const [filtroRapido, setFiltroRapido] = useState('Todos');

  const primeiroNome = (paciente?.nome || 'Guilherme').trim().split(' ')[0] || 'Guilherme';

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
          fetch(`${API_URL}/api/pacientes/dashboard`, {
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
          setErro(dadosDashboard.erro || 'Não foi possível carregar o dashboard.');

          if (respostaDashboard.status === 401 || respostaDashboard.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            navigate('/');
          }

          return;
        }

        setPaciente(dadosDashboard.paciente);
        setRegistros(dadosDashboard.registros || []);
        setTotalPermissoesAtivas(dadosDashboard.totalPermissoesAtivas || 0);
        setTotalMensagens(dadosMensagens.totalMensagens || 0);
      } catch (error) {
        console.error('Erro ao carregar dashboard do paciente:', error);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  const formatarTipoRegistro = (tipo) => {
    if (!tipo) {
      return 'Registro';
    }

    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  };

  const formatarDataRegistro = (dataIso) => {
    if (!dataIso) {
      return 'Data não informada';
    }

    return new Date(dataIso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const registrosFiltrados = registros.filter((registro) => {
    if (filtroRapido === 'Todos') {
      return true;
    }

    const tipo = (registro?.tipo || '').toLowerCase();

    if (filtroRapido === 'Exames') {
      return tipo.includes('exame');
    }

    if (filtroRapido === 'Receitas') {
      return tipo.includes('receita');
    }

    if (filtroRapido === 'Prontuários') {
      return tipo.includes('prontuario') || tipo.includes('prontuário');
    }

    return true;
  });

  return (
    <div className="app-page">
      <div className="app-container max-w-6xl">

        {/* Header / Nav */}
        <header className="card border-0 shadow-sm mb-6">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="avatar avatar-primary">PP</div>
              <div>
                <p className="title" style={{ fontSize: 18 }}>Painel de Saúde</p>
                <p className="text-sm text-muted">Acompanhe seus registros e status da conta</p>
              </div>
            </div>

            <nav className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => navigate('/permissoes')}
                className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
              >
                Permissões
              </button>
              <button
                type="button"
                onClick={() => navigate('/auditoria')}
                className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
              >
                Logs (LGPD)
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

        {/* Saudação + ações principais */}
        <section className="card border-0 shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Olá, {primeiroNome}</h1>
          <p className="text-sm text-muted font-medium mt-1">
            Aqui está o resumo da sua saúde.
          </p>

          <div className="mt-3">
            <span className="tag tag-success">Permissões ativas: {totalPermissoesAtivas}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/novo-registro')}
              className="btn btn-primary"
            >
              + Novo Registro
            </button>
            <button
              type="button"
              onClick={() => {
                setTotalMensagens(0);
                navigate('/chat');
              }}
              className="btn btn-outline"
            >
              Mensagens {totalMensagens > 0 && `(${totalMensagens})`}
            </button>
            <button
              type="button"
              onClick={() => navigate('/meus-registros')}
              className="btn btn-outline"
            >
              Ver Registros
            </button>
          </div>

          {erro && (
            <div className="mt-4">
              <div className="alert alert-danger">{erro}</div>
            </div>
          )}
        </section>

        {/* Conteúdo principal (2/3 + 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2">
            <div className="card border-0 shadow-sm p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-extrabold tracking-tight">Registros Recentes</h2>
                <button
                  type="button"
                  onClick={() => navigate('/meus-registros')}
                  className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
                >
                  Ver todos
                </button>
              </div>

              {/* Filtros rápidos */}
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {['Todos', 'Exames', 'Receitas', 'Prontuários'].map((opcao) => {
                  const ativo = filtroRapido === opcao;

                  return (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => setFiltroRapido(opcao)}
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

              {carregando && <p className="text-sm text-muted">Carregando registros...</p>}

              {!carregando && !erro && registrosFiltrados.length === 0 && (
                <div className="bg-surface rounded-xl shadow-sm p-8 text-center">
                  <div className="mx-auto w-12 h-12 text-muted" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M7 14h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="font-extrabold tracking-tight mt-3">Nenhum registro encontrado</p>
                  <p className="text-sm text-muted mt-1">
                    Tente trocar o filtro ou adicione seu primeiro documento.
                  </p>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => navigate('/novo-registro')}
                      className="btn btn-outline"
                    >
                      Adicionar primeiro documento
                    </button>
                  </div>

                  {/**
                   * Empty State (referência):
                   * - Ícone suave
                   * - Texto amigável
                   * - CTA secundário
                   */}
                </div>
              )}

              {!carregando && !erro && registrosFiltrados.length > 0 && (
                <div className="space-y-3">
                  {registrosFiltrados.slice(0, 5).map((registro) => (
                    <div
                      key={registro.id}
                      className="bg-surface rounded-xl shadow-sm p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-muted" aria-hidden="true">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 3h6a2 2 0 0 1 2 2v16H7V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                            <path d="M9 7h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold">{formatarTipoRegistro(registro.tipo)}</p>
                          <p className="text-xs text-muted">{formatarDataRegistro(registro.data)}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/meus-registros', { state: { registroId: registro.id } })}
                        className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2"
                        aria-label="Abrir registro"
                        title="Abrir"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          <aside className="lg:col-span-1">
            <div className="card border-0 shadow-sm p-6">
              <h2 className="text-lg font-extrabold tracking-tight">Resumo da Conta</h2>
              <p className="text-sm text-muted mt-1">Indicadores rápidos do seu acesso</p>

              <div className="divider my-4" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Total de Registros</span>
                  <span className="tag tag-primary">{registros.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Compartilhamento de Dados</span>
                  <span className={`tag ${totalPermissoesAtivas > 0 ? 'tag-success' : 'tag-danger'}`}>
                    {totalPermissoesAtivas > 0 ? 'Ativo' : 'Desativado'}
                  </span>
                </div>

                {totalPermissoesAtivas > 0 && (
                  <div className="mt-2 bg-surface rounded-xl shadow-sm p-4">
                    <p className="text-sm font-extrabold tracking-tight">Quem tem acesso agora</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="avatar">DG</div>
                        <div>
                          <p className="text-sm font-semibold">Dr. Gabriel</p>
                          <p className="text-xs text-muted">Cardiologia</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted mt-3">
                      (Exemplo) Lista baseada nas permissões ativas.
                    </p>
                  </div>
                )}

                <div className="mt-2 bg-surface rounded-xl shadow-sm p-4">
                  <p className="text-sm font-extrabold tracking-tight">Últimos Acessos</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted">Visualizado há 2h por Dr. Gabriel</p>
                  </div>
                  <p className="text-xs text-muted mt-3">
                    (Exemplo) Em breve: auditoria real de acessos.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


