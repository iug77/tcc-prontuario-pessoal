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

  return (
    <div className="app-page">
      <div className="app-container max-w-5xl space-y-6">
        
        {/* Cabeçalho do Médico */}
        <div className="card strip-accent p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Olá, {profissional?.nome || 'Profissional'}</h1>
            <p className="subtitle">
              CRM: {profissional?.crm || 'Não informado'} | Especialidade: {profissional?.especialidade || 'Não informada'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/auditoria')}
              className="btn btn-info"
            >
              📋 Auditoria
            </button>
            <button 
              onClick={() => {
                setTotalMensagens(0);
                navigate('/chat');
              }}
              className="btn btn-success"
            >
              💬 Mensagens {totalMensagens > 0 && `(${totalMensagens})`}
            </button>
            <button 
              onClick={handleLogout}
              className="btn btn-outline"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Lista de Pacientes Compartilhados */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="text-lg font-extrabold tracking-tight">Pacientes com Acesso Concedido</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar paciente..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input w-64"
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
            <table className="table">
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

                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.permissaoId} className={`${paciente.status === 'Inativo' ? 'opacity-60' : ''}`}>
                    <td>
                      <p className="font-extrabold tracking-tight">{paciente.nome}</p>
                      <p className="text-muted text-xs">{paciente.email}</p>
                    </td>
                    <td>
                      <span className={`pill ${paciente.permissao === 'Leitura e Escrita' ? 'pill-accent' : 'pill-info'}`}>
                        {paciente.permissao}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${paciente.status === 'Inativo' ? 'pill-danger' : 'pill-success'}`}>
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
        </div>

      </div>
    </div>
  );
}


