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

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        
       {/* Cabeçalho do Dashboard */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Olá, {paciente?.nome || 'Paciente'}</h1>
            <p className="text-gray-500">Aqui está o resumo da sua saúde. Permissões ativas: {totalPermissoesAtivas}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                setTotalMensagens(0);
                navigate('/chat');
              }}
              className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition-colors border border-green-200"
            >
              💬 Mensagens {totalMensagens > 0 && `(${totalMensagens})`}
            </button>
            <button 
              onClick={() => navigate('/auditoria')}
              className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              📋 Logs (LGPD)
            </button>
            <button 
              onClick={() => navigate('/permissoes')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-200"
            >
              📝 Permissões
            </button>
            <button 
              onClick={() => navigate('/novo-registro')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + Novo Registro
            </button>
            <button
              onClick={() => navigate('/meus-registros')}
              className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg font-medium hover:bg-teal-100 transition-colors border border-teal-200"
            >
              🧾 Ver Registros
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
            >
              Sair
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Registros Recentes</h2>
            <button
              onClick={() => navigate('/meus-registros')}
              className="text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              Ver todos
            </button>
          </div>

          {carregando && <p className="text-sm text-gray-500">Carregando registros...</p>}

          {!carregando && !erro && registros.length === 0 && (
            <p className="text-sm text-gray-500">Você ainda não adicionou registros.</p>
          )}

          {!carregando && !erro && registros.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {registros.slice(0, 3).map((registro) => (
                <div key={registro.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{formatarTipoRegistro(registro.tipo)}</p>
                    <p className="text-xs text-gray-500">{formatarDataRegistro(registro.data)}</p>
                  </div>
                  <button
                    onClick={() => navigate('/meus-registros', { state: { registroId: registro.id } })}
                    className="text-sm text-teal-700 font-medium hover:text-teal-800"
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


