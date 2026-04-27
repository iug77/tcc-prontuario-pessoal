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
          fetch('http://localhost:3000/api/profissionais/dashboard', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch('http://localhost:3000/api/chat/contar', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ]);

        const dadosDashboard = await respostaDashboard.json();
        const dadosMensagens = await respostaMensagens.json();

        if (!respostaDashboard.ok) {
          setErro(dadosDashboard.erro || 'NÃ£o foi possÃ­vel carregar os dados do dashboard.');

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
        setErro('Erro de conexÃ£o com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarDashboard();

    const intervalo = setInterval(async () => {
      try {
        const tokenAtual = localStorage.getItem('token');
        if (!tokenAtual) return;

        const respostaMensagens = await fetch('http://localhost:3000/api/chat/contar', {
          headers: {
            Authorization: `Bearer ${tokenAtual}`
          }
        });

        const dadosMensagens = await respostaMensagens.json();
        if (respostaMensagens.ok) {
          setTotalMensagens(dadosMensagens.totalMensagens || 0);
        }
      } catch {
        // Evita ruÃ­do de erro em polling
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
      return 'Sem expiraÃ§Ã£o';
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* CabeÃ§alho do MÃ©dico */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-center border-l-4 border-teal-500">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">OlÃ¡, {profissional?.nome || 'Profissional'}</h1>
            <p className="text-gray-500">
              CRM: {profissional?.crm || 'NÃ£o informado'} | Especialidade: {profissional?.especialidade || 'NÃ£o informada'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/auditoria')}
              className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              ðŸ“‹ Auditoria
            </button>
            <button 
              onClick={() => {
                setTotalMensagens(0);
                navigate('/chat');
              }}
              className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition-colors border border-green-200"
            >
              ðŸ’¬ Mensagens {totalMensagens > 0 && `(${totalMensagens})`}
            </button>
            <button 
              onClick={handleLogout}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-200"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Lista de Pacientes Compartilhados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Pacientes com Acesso Concedido</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar paciente..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm w-64"
              />
            </div>
          </div>

          {carregando && (
            <div className="p-6 text-sm text-gray-500">Carregando dados do dashboard...</div>
          )}

          {!carregando && erro && (
            <div className="p-6 text-sm text-red-700 bg-red-50 border-t border-red-100">{erro}</div>
          )}

          {!carregando && !erro && (
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Paciente</th>
                  <th className="p-4 font-semibold">NÃ­vel de PermissÃ£o</th>
                  <th className="p-4 font-semibold">ExpiraÃ§Ã£o</th>
                  <th className="p-4 font-semibold text-center">AÃ§Ãµes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pacientesFiltrados.length === 0 && (
                  <tr>
                    <td className="p-4 text-sm text-gray-500" colSpan={4}>
                      Nenhum paciente encontrado para este profissional.
                    </td>
                  </tr>
                )}

                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.permissaoId} className={`hover:bg-gray-50 transition-colors text-sm ${paciente.status === 'Inativo' ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{paciente.nome}</p>
                      <p className="text-gray-500 text-xs">{paciente.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        paciente.permissao === 'Leitura e Escrita' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {paciente.permissao}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        paciente.status === 'Inativo' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {formatarExpiracao(paciente.expiraEm, paciente.status)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => paciente.status === 'Ativo' && navigate('/visualizador', { state: { pacienteId: paciente.pacienteId } })}
                          disabled={paciente.status === 'Inativo'}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            paciente.status === 'Inativo' 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                          }`}
                        >
                          ProntuÃ¡rio
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