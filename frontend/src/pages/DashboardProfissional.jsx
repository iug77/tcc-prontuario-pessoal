import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { derivarSubtipo } from '../utils/derivarSubtipo';

export default function DashboardProfissional() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [profissional, setProfissional] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [pendentes, setPendentes] = useState([]);
  const [mostrarTodosPendentes, setMostrarTodosPendentes] = useState(false);
  const [pacientesAlerta, setPacientesAlerta] = useState([]);

  const TAMANHO_PAGINA = 10;

  const primeiroNome = (profissional?.nome || '').trim().split(' ')[0] || 'Profissional';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const carregarDashboard = async () => {
      try {
        setCarregando(true);
        setErro('');

        const [respostaDashboard, respostaPendentes, respostaAlertas] = await Promise.all([
          fetch(`${API_URL}/api/profissionais/dashboard`,           { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/profissionais/pareceres/pendentes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/profissionais/pacientes/alertas`,   { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const dadosDashboard = await respostaDashboard.json();

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

        if (respostaPendentes.ok) {
          const dadosPendentes = await respostaPendentes.json();
          setPendentes(dadosPendentes.pendentes || []);
        }
        if (respostaAlertas.ok) {
          const dadosAlertas = await respostaAlertas.json();
          setPacientesAlerta(dadosAlertas.pacientes || []);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard profissional:', error);
        setErro('Erro de conexão com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDashboard();
  }, [navigate]);

  const pacientesFiltrados = useMemo(() => {
    const textoBusca = busca.trim().toLowerCase();
    if (!textoBusca) return pacientes;
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

  useEffect(() => { setPagina(1); }, [busca]);

  const formatarExpiracao = (dataIso, status) => {
    if (!dataIso) return 'Sem expiração';
    if (status === 'Inativo') return 'Expirado';
    return new Date(dataIso).toLocaleDateString('pt-BR');
  };

  const classeTagPermissao = (permissao) =>
    permissao === 'Leitura e Escrita' ? 'tag tag-success' : 'tag';

  const classeTagExpiracao = (dataIso, status) => {
    if (!dataIso) return 'tag';
    if (status === 'Inativo') return 'tag tag-danger';
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
    <AppLayout>
      <div className="page-wrapper page-wrapper-lg space-y-6">

        {/* Resumo do Profissional */}
        <section className="card strip-success p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {carregando ? 'Carregando...' : `Olá, ${primeiroNome}`}
              </h1>
              <p className="text-sm text-muted font-medium mt-1">
                CRM: {profissional?.crm || 'Não informado'} · Especialidade: {profissional?.especialidade || 'Não informada'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="bg-surface rounded-xl p-4 min-w-[120px]">
                <p className="text-xs text-muted font-semibold">Pacientes Ativos</p>
                <p className="text-2xl font-extrabold tracking-tight mt-1">{totalPacientesAtivos}</p>
              </div>
              <div className="bg-surface rounded-xl p-4 min-w-[120px]" style={pendentes.length > 0 ? { borderLeft: '3px solid rgb(var(--warning, 234 179 8))' } : {}}>
                <p className="text-xs text-muted font-semibold">Pareceres Pendentes</p>
                <p className="text-2xl font-extrabold tracking-tight mt-1" style={pendentes.length > 0 ? { color: 'rgb(180 120 0)' } : {}}>{pendentes.length}</p>
              </div>
              <div className="bg-surface rounded-xl p-4 min-w-[120px]">
                <p className="text-xs text-muted font-semibold">Expirando em 7d</p>
                <p className="text-2xl font-extrabold tracking-tight mt-1">{permissoesExpirandoEmBreve.length}</p>
              </div>
            </div>
          </div>
        </section>

        {erro && <div className="alert alert-danger">{erro}</div>}

        {/* Fila de Pareceres Pendentes */}
        {!carregando && pendentes.length > 0 && (() => {
          const visiveis = mostrarTodosPendentes ? pendentes : pendentes.slice(0, 5);
          const formatarTipo = (tipo) => ({ exame: 'Exame', receita: 'Receita', medicamento: 'Medicamento', alergia: 'Alergia', doenca: 'Doença', cirurgia: 'Cirurgia' })[tipo] || tipo;
          return (
            <section className="card overflow-hidden">
              <div className="card-header">
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">Fila de Pareceres Pendentes</h2>
                  <p className="text-sm text-muted">Registros de pacientes autorizados aguardando seu parecer.</p>
                </div>
                <span className="tag" style={{ background: 'rgba(180,120,0,0.12)', color: 'rgb(160,100,0)' }}>
                  {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="divide-y divide-[rgb(var(--border))]">
                {visiveis.map((item) => {
                  const subtipo = derivarSubtipo(item);
                  return (
                    <div key={item.registroId} className="flex items-center gap-4 px-6 py-4 hover:bg-[rgba(var(--text),0.02)] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{item.pacienteNome}</span>
                          <span className="text-muted text-xs">·</span>
                          <span className="text-sm text-muted">
                            {formatarTipo(item.tipo)}{subtipo ? ` · ${subtipo}` : ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {item.orgao && ` · ${item.orgao}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/visualizador', { state: { pacienteId: item.pacienteId, registroId: item.registroId } })}
                        className="btn btn-sm btn-primary flex-shrink-0"
                      >
                        Adicionar Parecer
                      </button>
                    </div>
                  );
                })}
              </div>

              {pendentes.length > 5 && (
                <div className="bg-surface-2 p-4 border-t border-[rgb(var(--border))] text-center">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setMostrarTodosPendentes(v => !v)}
                  >
                    {mostrarTodosPendentes ? 'Mostrar menos' : `Ver todos os ${pendentes.length} pendentes`}
                  </button>
                </div>
              )}
            </section>
          );
        })()}

        {/* Pacientes com Alertas Ativos */}
        {!carregando && pacientesAlerta.length > 0 && (
          <section className="card overflow-hidden">
            <div className="card-header">
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Pacientes com Alertas Ativos</h2>
                <p className="text-sm text-muted">Parâmetros fora da referência nos exames mais recentes.</p>
              </div>
              <span className="tag tag-danger">{pacientesAlerta.length} paciente{pacientesAlerta.length > 1 ? 's' : ''}</span>
            </div>

            <div className="divide-y divide-[rgb(var(--border))]">
              {pacientesAlerta.map((pac) => {
                const corPorStatus = (status) => {
                  if (status === 'CRITICO') return { bg: 'rgba(var(--danger),0.12)', text: 'rgb(var(--danger))' };
                  if (status === 'ALTO')    return { bg: 'rgba(220,80,20,0.10)',     text: 'rgb(200,70,10)' };
                  if (status === 'BAIXO')   return { bg: 'rgba(30,100,220,0.10)',    text: 'rgb(30,100,200)' };
                  return                          { bg: 'rgba(var(--primary),0.10)', text: 'rgb(var(--primary))' };
                };

                return (
                  <div key={pac.pacienteId} className="px-6 py-4 hover:bg-[rgba(var(--text),0.02)] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => navigate('/visualizador', { state: { pacienteId: pac.pacienteId } })}
                            className="font-extrabold tracking-tight hover:text-[rgb(var(--primary))] hover:underline transition-colors"
                          >
                            {pac.pacienteNome}
                          </button>
                          <span className="text-xs text-muted">
                            · {pac.totalAlertas} alerta{pac.totalAlertas > 1 ? 's' : ''}
                            · último exame {new Date(pac.ultimoExame).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {pac.alertas.slice(0, 6).map((alerta, i) => {
                            const cor = corPorStatus(alerta.status);
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                                style={{ background: cor.bg, color: cor.text }}
                              >
                                <span className="font-bold">{alerta.status}</span>
                                <span>·</span>
                                <span>{alerta.nome}</span>
                                <span className="opacity-70">{alerta.valor} {alerta.unidade}</span>
                              </span>
                            );
                          })}
                          {pac.alertas.length > 6 && (
                            <span className="text-xs text-muted self-center">+{pac.alertas.length - 6} mais</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/visualizador', { state: { pacienteId: pac.pacienteId } })}
                        className="btn btn-sm btn-outline flex-shrink-0"
                      >
                        Ver Prontuário
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Lista de Pacientes */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-base font-extrabold tracking-tight">Pacientes com Acesso Concedido</h2>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                width="16" height="16" viewBox="0 0 24 24" fill="none"
              >
                <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input w-60 pl-9"
              />
            </div>
          </div>

          {carregando && (
            <div className="p-6 text-sm text-muted">Carregando dados...</div>
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
                        Nenhum paciente encontrado.
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
                          <button
                            type="button"
                            onClick={() => navigate(`/perfil/paciente/${paciente.pacienteId}`)}
                            className="font-extrabold tracking-tight text-left hover:text-[rgb(var(--primary))] hover:underline transition-colors"
                          >
                            {paciente.nome}
                          </button>
                          {paciente.telefone && (
                            <button
                              type="button"
                              onClick={() => abrirWhatsApp(paciente.telefone)}
                              title="Abrir WhatsApp"
                              className="text-[#25D366] hover:text-[#128C7E] transition-colors flex-shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
                        <button
                          onClick={() => paciente.status === 'Ativo' && navigate('/visualizador', { state: { pacienteId: paciente.pacienteId } })}
                          disabled={paciente.status === 'Inativo'}
                          className={`btn btn-sm ${paciente.status === 'Inativo' ? 'btn-outline' : 'btn-primary'}`}
                        >
                          Prontuário
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!carregando && !erro && pacientesFiltrados.length > 0 && (
            <div className="bg-surface-2 p-4 border-t border-[rgb(var(--border))] text-sm text-muted flex flex-wrap gap-3 justify-between items-center">
              <p>
                Mostrando {Math.min(inicio + 1, pacientesFiltrados.length)}–{Math.min(fim, pacientesFiltrados.length)} de {pacientesFiltrados.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual <= 1}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual >= totalPaginas}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Permissões expirando em breve */}
        <section className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Permissões expirando em breve</h2>
              <p className="text-sm text-muted">Acessos que vencem nos próximos 7 dias.</p>
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
                        <button
                          type="button"
                          onClick={() => navigate(`/perfil/paciente/${permissao.pacienteId}`)}
                          className="font-semibold text-left hover:text-[rgb(var(--primary))] hover:underline transition-colors"
                        >
                          {permissao.nome}
                        </button>
                        {permissao.telefone && (
                          <button
                            type="button"
                            onClick={() => abrirWhatsApp(permissao.telefone)}
                            title="Abrir WhatsApp"
                            className="text-[#25D366] hover:text-[#128C7E] transition-colors flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
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
    </AppLayout>
  );
}
