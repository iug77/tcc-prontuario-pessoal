import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auditoria() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || '{}');
    } catch {
      return {};
    }
  }, []);

  const rotaVoltar = usuario?.tipo === 'profissional' ? '/dashboard-profissional' : '/dashboard';

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    const carregarAuditoria = async () => {
      try {
        setCarregando(true);
        setErro('');

        const resposta = await fetch('http://localhost:3000/api/auditoria', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(dados.erro || 'NÃ£o foi possÃ­vel carregar os logs de auditoria.');

          if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            navigate('/');
          }

          return;
        }

        setLogs(dados.logs || []);
      } catch (error) {
        console.error('Erro ao carregar auditoria:', error);
        setErro('Erro de conexÃ£o com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarAuditoria();
  }, [navigate]);

  const formatarData = (dataIso) => {
    if (!dataIso) {
      return '-';
    }

    return new Date(dataIso).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* CabeÃ§alho */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-600">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Auditoria e Logs (LGPD)</h1>
            <p className="text-gray-500">Rastreabilidade completa de interaÃ§Ãµes para {usuario?.tipo === 'profissional' ? 'profissional' : 'paciente'}</p>
          </div>
          <button 
            onClick={() => navigate(rotaVoltar)}
            className="text-indigo-600 hover:underline font-medium"
          >
            â† Voltar ao Painel
          </button>
        </div>

        {/* Tabela de Logs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Data e Hora</th>
                  <th className="p-4 font-semibold">UsuÃ¡rio / Agente</th>
                  <th className="p-4 font-semibold">AÃ§Ã£o Realizada</th>
                  <th className="p-4 font-semibold">Documento / Recurso</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {carregando && (
                  <tr>
                    <td className="p-4 text-sm text-gray-500" colSpan={5}>Carregando logs...</td>
                  </tr>
                )}

                {!carregando && erro && (
                  <tr>
                    <td className="p-4 text-sm text-red-700" colSpan={5}>{erro}</td>
                  </tr>
                )}

                {!carregando && !erro && logs.length === 0 && (
                  <tr>
                    <td className="p-4 text-sm text-gray-500" colSpan={5}>Nenhum log encontrado.</td>
                  </tr>
                )}

                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors text-sm text-gray-700">
                    <td className="p-4 whitespace-nowrap">{formatarData(log.data)}</td>
                    <td className="p-4 font-medium text-gray-900">{log.usuario}</td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {log.acao}
                      </span>
                    </td>
                    <td className="p-4">{log.documento}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === 'Sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* RodapÃ© da Tabela */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center">
            <p>Mostrando os {logs.length} registros mais recentes.</p>
            <button type="button" className="text-indigo-600 font-medium hover:underline">Exportar RelatÃ³rio (PDF)</button>
          </div>
        </div>

      </div>
    </div>
  );
}