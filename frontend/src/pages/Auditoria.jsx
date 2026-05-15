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

        const resposta = await fetch(`${API_URL}/api/auditoria`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(dados.erro || 'Não foi possível carregar os logs de auditoria.');

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
        setErro('Erro de conexão com o servidor.');
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
    <div className="app-page">
      <div className="app-container max-w-5xl space-y-6">
        
        {/* Cabeçalho */}
        <div className="card strip-info p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Auditoria e Logs (LGPD)</h1>
            <p className="subtitle">Rastreabilidade completa de interações para {usuario?.tipo === 'profissional' ? 'profissional' : 'paciente'}</p>
          </div>
          <button 
            onClick={() => navigate(rotaVoltar)}
            className="btn btn-outline"
          >
            ← Voltar ao Painel
          </button>
        </div>

        {/* Tabela de Logs */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Data e Hora</th>
                  <th>Usuário / Agente</th>
                  <th>Ação Realizada</th>
                  <th>Documento / Recurso</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {carregando && (
                  <tr>
                    <td className="text-sm text-muted" colSpan={5}>Carregando logs...</td>
                  </tr>
                )}

                {!carregando && erro && (
                  <tr>
                    <td className="text-sm text-danger" colSpan={5}>{erro}</td>
                  </tr>
                )}

                {!carregando && !erro && logs.length === 0 && (
                  <tr>
                    <td className="text-sm text-muted" colSpan={5}>Nenhum log encontrado.</td>
                  </tr>
                )}

                {logs.map((log) => (
                  <tr key={log.id} className="text-sm">
                    <td className="whitespace-nowrap">{formatarData(log.data)}</td>
                    <td className="font-semibold">{log.usuario}</td>
                    <td>
                      <span className="badge">
                        {log.acao}
                      </span>
                    </td>
                    <td>{log.documento}</td>
                    <td>
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
          
          {/* Rodapé da Tabela */}
          <div className="bg-surface-2 p-4 border-t border-[rgb(var(--border))] text-sm text-muted flex justify-between items-center">
            <p>Mostrando os {logs.length} registros mais recentes.</p>
            <button type="button" className="btn btn-outline">Exportar Relatório (PDF)</button>
          </div>
        </div>

      </div>
    </div>
  );
}


