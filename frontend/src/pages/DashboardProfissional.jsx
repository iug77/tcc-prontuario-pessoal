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

  const abrirWhatsApp = (telefone) => {
    const numero = telefone.replace(/\D/g, '');
    const numeroFormatado = numero.startsWith('55') ? numero : `55${numero}`;
    window.open(`https://wa.me/${numeroFormatado}`, '_blank', 'noopener,noreferrer');
  };

  const totalPacientesAtivos = pacientes.filter((p) => p.status === 'Ativo').length;

  const limiteExpirando = useMemo(() => {
    const agora = new Date();
    const limite = new Date(agora);
    limite.setDate(limite.getDate() + 7);
    return limite;
  }, []);

  const permissoesExpirandoEmBreve = useMemo(() => {
    return pacientes
      .filter((p) => p.status === 'Ativo' && p.expiraEm)
      .filter((p) => {
        const data = new Date(p.expiraEm);
        return !Number.isNaN(data.getTime()) && data <= limiteExpirando;
      })
      .sort((a, b) => new Date(a.expiraEm).getTime() - new Date(b.expiraEm).getTime())
      .slice(0, 5);
  }, [limiteExpirando, pacientes]);

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
                <p className="text-2xl font-extrabold tracking-tight mt-1">{totalPacientesAtivos}</p>
              </div>
              <div className="bg-surface rounded-xl shadow-sm p-4 min-w-[160px]">
                <p className="text-xs text-muted font-semibold">Expirando em 7 dias</p>
                <p className="text-2xl font-extrabold tracking-tight mt-1">{permissoesExpirandoEmBreve.length}</p>
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
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold tracking-tight">{paciente.nome}</p>
                        {paciente.telefone && (
                          <button
                            type="button"
                            onClick={() => abrirWhatsApp(paciente.telefone)}
                            title="Abrir WhatsApp"
                            aria-label={`WhatsApp de ${paciente.nome}`}
                            className="text-[#25D366] hover:text-[#128C7E] transition-colors flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                            </svg>
                          </button>
                        )}
                      </div>
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

        {/* Permissões expirando em breve */}
        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Permissões expirando em breve</h2>
              <p className="text-sm text-muted">Acessos concedidos pelos pacientes (sem etapa de aceite).</p>
            </div>
            <span className="tag tag-warning">{permissoesExpirandoEmBreve.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-strong">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Permissão</th>
                  <th>Expiração</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {permissoesExpirandoEmBreve.length === 0 && (
                  <tr>
                    <td className="text-sm text-muted" colSpan={4}>
                      Nenhuma permissão expira nos próximos 7 dias.
                    </td>
                  </tr>
                )}

                {permissoesExpirandoEmBreve.map((permissao) => (
                  <tr key={permissao.permissaoId}>
                    <td>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{permissao.nome}</p>
                        {permissao.telefone && (
                          <button
                            type="button"
                            onClick={() => abrirWhatsApp(permissao.telefone)}
                            title="Abrir WhatsApp"
                            aria-label={`WhatsApp de ${permissao.nome}`}
                            className="text-[#25D366] hover:text-[#128C7E] transition-colors flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted">{permissao.email}</p>
                    </td>
                    <td>
                      <span className={classeTagPermissao(permissao.permissao)}>{permissao.permissao}</span>
                    </td>
                    <td>
                      <span className={classeTagExpiracao(permissao.expiraEm, permissao.status)}>
                        {formatarExpiracao(permissao.expiraEm, permissao.status)}
                      </span>
                    </td>
                    <td>
                      <span className={permissao.status === 'Ativo' ? 'tag tag-success' : 'tag tag-danger'}>
                        {permissao.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-surface-2 p-4 border-t border-[rgb(var(--border))] text-xs text-muted">
            Lista baseada em permissões ativas com expiração próxima.
          </div>
        </section>

      </div>
    </div>
  );
}


