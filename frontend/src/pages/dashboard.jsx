import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

export default function Dashboard() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [paciente, setPaciente] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [totalPermissoesAtivas, setTotalPermissoesAtivas] = useState(0);
  const [acessosAtuais, setAcessosAtuais] = useState([]);
  const [ultimosAcessos, setUltimosAcessos] = useState([]);
  const [filtroRapido, setFiltroRapido] = useState('Todos');

  const primeiroNome = (paciente?.nome || '').trim().split(' ')[0] || 'Usuário';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const carregarDashboard = async () => {
      try {
        setCarregando(true);
        setErro('');

        const respostaDashboard = await fetch(`${API_URL}/api/pacientes/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const dadosDashboard = await respostaDashboard.json();

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
        setAcessosAtuais(Array.isArray(dadosDashboard.acessosAtuais) ? dadosDashboard.acessosAtuais : []);
        setUltimosAcessos(Array.isArray(dadosDashboard.ultimosAcessos) ? dadosDashboard.ultimosAcessos : []);
      } catch (error) {
        console.error('Erro ao carregar dashboard do paciente:', error);
        setErro('Erro de conexão com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDashboard();
  }, [navigate]);

  const formatarTipoRegistro = (tipo) => {
    if (!tipo) return 'Registro';
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  };

  const formatarDataRegistro = (dataIso) => {
    if (!dataIso) return 'Data não informada';
    return new Date(dataIso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const iniciaisNome = (nome = '') => {
    const partes = String(nome).trim().split(' ').filter(Boolean);
    if (partes.length === 0) return '??';
    return partes.slice(0, 2).map((parte) => parte.charAt(0).toUpperCase()).join('') || '??';
  };

  const abrirWhatsApp = (telefone) => {
    const numero = telefone.replace(/\D/g, '');
    const numeroFormatado = numero.startsWith('55') ? numero : `55${numero}`;
    window.open(`https://wa.me/${numeroFormatado}`, '_blank', 'noopener,noreferrer');
  };

  const formatarTempoRelativo = (dataIso) => {
    if (!dataIso) return '-';
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return '-';
    const diffMs = Date.now() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `há ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `há ${diffD}d`;
  };

  const registrosFiltrados = registros.filter((registro) => {
    if (filtroRapido === 'Todos') return true;
    const tipo = (registro?.tipo || '').toLowerCase();
    if (filtroRapido === 'Exames') return tipo.includes('exame');
    if (filtroRapido === 'Receitas') return tipo.includes('receita');
    if (filtroRapido === 'Prontuários') return tipo.includes('prontuario') || tipo.includes('prontuário');
    return true;
  });

  return (
    <AppLayout>
      <div className="page-wrapper page-wrapper-lg">

        {/* Saudação */}
        <section className="card strip-primary p-6 mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Olá, {carregando ? '...' : primeiroNome}
          </h1>
          <p className="text-sm text-muted font-medium mt-1">Aqui está o resumo da sua saúde.</p>

          <div className="mt-3">
            <span className={`tag ${totalPermissoesAtivas > 0 ? 'tag-success' : ''}`}>
              Permissões ativas: {totalPermissoesAtivas}
            </span>
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
              onClick={() => navigate('/meus-registros')}
              className="btn btn-outline"
            >
              Ver Registros
            </button>
            <button
              type="button"
              onClick={() => navigate('/permissoes')}
              className="btn btn-outline"
            >
              Permissões
            </button>
          </div>

          {erro && <div className="alert alert-danger mt-4">{erro}</div>}
        </section>

        {/* Conteúdo principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-extrabold tracking-tight">Registros Recentes</h2>
                <button
                  type="button"
                  onClick={() => navigate('/meus-registros')}
                  className="btn btn-ghost"
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
                      className={
                        ativo
                          ? 'px-3 py-1.5 rounded-full text-sm font-semibold bg-[rgb(var(--primary))] text-white'
                          : 'px-3 py-1.5 rounded-full text-sm font-semibold bg-[rgba(var(--text),0.06)] text-muted hover:text-[rgb(var(--primary))] hover:bg-[rgba(var(--primary),0.08)] transition-colors'
                      }
                    >
                      {opcao}
                    </button>
                  );
                })}
              </div>

              {carregando && <p className="text-sm text-muted">Carregando registros...</p>}

              {!carregando && !erro && registrosFiltrados.length === 0 && (
                <div className="bg-surface-2 rounded-xl p-8 text-center">
                  <div className="mx-auto w-12 h-12 text-muted mb-3">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M7 14h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="font-extrabold tracking-tight">Nenhum registro encontrado</p>
                  <p className="text-sm text-muted mt-1">Tente trocar o filtro ou adicione seu primeiro documento.</p>
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => navigate('/novo-registro')}
                      className="btn btn-outline"
                    >
                      Adicionar primeiro documento
                    </button>
                  </div>
                </div>
              )}

              {!carregando && !erro && registrosFiltrados.length > 0 && (
                <div className="space-y-3">
                  {registrosFiltrados.slice(0, 5).map((registro) => (
                    <button
                      key={registro.id}
                      type="button"
                      onClick={() => navigate('/meus-registros', { state: { registroId: registro.id } })}
                      className="bg-surface rounded-xl p-4 w-full text-left flex items-center justify-between gap-4 cursor-pointer group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md border border-[rgb(var(--border))]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-muted">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M9 3h6a2 2 0 0 1 2 2v16H7V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                            <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold">{formatarTipoRegistro(registro.tipo)}</p>
                          <p className="text-xs text-muted">{formatarDataRegistro(registro.data)}</p>
                        </div>
                      </div>
                      <span className="text-muted transition-transform duration-300 group-hover:translate-x-1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </main>

          <aside className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-lg font-extrabold tracking-tight">Resumo da Conta</h2>
              <p className="text-sm text-muted mt-1">Indicadores rápidos do seu acesso</p>

              <div className="divider my-4" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Total de Registros</span>
                  <span className="tag tag-primary">{registros.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Compartilhamento</span>
                  <span className={`tag ${totalPermissoesAtivas > 0 ? 'tag-success' : 'tag-danger'}`}>
                    {totalPermissoesAtivas > 0 ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {totalPermissoesAtivas > 0 && (
                  <div className="mt-2 bg-surface-2 rounded-xl p-4">
                    <p className="text-sm font-extrabold tracking-tight">Quem tem acesso agora</p>
                    <div className="mt-3 space-y-2">
                      {acessosAtuais.length === 0 ? (
                        <p className="text-sm text-muted">Nenhum profissional com acesso ativo.</p>
                      ) : (
                        acessosAtuais.slice(0, 3).map((permissao) => (
                          <div
                            key={permissao.id}
                            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-[rgba(var(--text),0.04)] transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => navigate(`/perfil/profissional/${permissao?.profissional?.id}`)}
                              className="avatar hover:opacity-80 transition-opacity flex-shrink-0"
                              title={`Ver perfil de ${permissao?.profissional?.nome}`}
                            >
                              {iniciaisNome(permissao?.profissional?.nome)}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/perfil/profissional/${permissao?.profissional?.id}`)}
                                  className="text-sm font-semibold truncate text-left hover:text-[rgb(var(--primary))] hover:underline transition-colors"
                                >
                                  {permissao?.profissional?.nome || 'Profissional'}
                                </button>
                                {permissao?.profissional?.telefone && (
                                  <button
                                    type="button"
                                    onClick={() => abrirWhatsApp(permissao.profissional.telefone)}
                                    title="Abrir WhatsApp"
                                    className="text-[#25D366] hover:text-[#128C7E] transition-colors flex-shrink-0"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-muted">{permissao?.profissional?.especialidade || 'Acesso autorizado'}</p>
                            </div>
                          </div>
                        ))
                      )}
                      {acessosAtuais.length > 3 && (
                        <p className="text-xs text-muted mt-2">Mostrando 3 de {acessosAtuais.length} profissionais.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 bg-surface-2 rounded-xl p-4">
                  <p className="text-sm font-extrabold tracking-tight">Últimos Acessos</p>
                  <div className="mt-2 space-y-1">
                    {ultimosAcessos.length === 0 ? (
                      <p className="text-sm text-muted">Nenhum acesso recente por profissionais.</p>
                    ) : (
                      ultimosAcessos.slice(0, 3).map((acesso) => (
                        <div
                          key={acesso.id}
                          className="text-sm text-muted rounded-md px-2 py-1 hover:bg-[rgba(var(--text),0.04)] transition-colors"
                        >
                          Visualizado {formatarTempoRelativo(acesso.data)} por {acesso?.profissional?.nome || 'Profissional'}
                        </div>
                      ))
                    )}
                  </div>
                  {ultimosAcessos.length > 3 && (
                    <p className="text-xs text-muted mt-2">Mostrando 3 de {ultimosAcessos.length} acessos.</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
