import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function InsightsIA() {
  const navigate = useNavigate();
  const location = useLocation();

  const pacienteId = location.state?.pacienteId;
  const pacienteNome = location.state?.pacienteNome;

  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [insight, setInsight] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [feedbackTexto, setFeedbackTexto] = useState('');

  useEffect(() => {
    if (!pacienteId) {
      navigate('/dashboard-profissional');
      return;
    }

    carregarInsights();
  }, [pacienteId]);

  const carregarInsights = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const [resAtual, resHistorico] = await Promise.all([
        fetch(`${API_URL}/api/ai/insights/${pacienteId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/ai/insights/${pacienteId}/historico`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const dadosHistorico = await resHistorico.json();
      if (resHistorico.ok) {
        setHistorico(dadosHistorico.historico || []);
      }

      const dadosAtual = await resAtual.json();
      if (resAtual.ok) {
        setInsight(dadosAtual.insight);
      } else if (resAtual.status !== 404) {
        setErro(dadosAtual.erro || 'Não foi possível carregar insights.');
      }
    } catch (error) {
      console.error('Erro ao carregar insights IA:', error);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const gerarInsights = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setGerando(true);
      setErro('');

      const resposta = await fetch(`${API_URL}/api/ai/insights/gerar/${pacienteId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível gerar insights.');
        return;
      }

      setInsight(dados.insight);
      await carregarInsights();
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setGerando(false);
    }
  };

  const enviarFeedback = async (status) => {
    if (!insight?.id) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/api/ai/insights/${insight.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          feedback: feedbackTexto || null
        })
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível salvar feedback.');
        return;
      }

      setInsight((atual) => ({
        ...atual,
        status: dados.insight.status,
        feedback: dados.insight.feedback
      }));

      await carregarInsights();
      setFeedbackTexto('');
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      setErro('Erro de conexão com o servidor.');
    }
  };

  const alertas = useMemo(() => insight?.alertas || [], [insight]);
  const tendencias = useMemo(() => insight?.tendencias || [], [insight]);
  const pendencias = useMemo(() => insight?.pendencias || [], [insight]);
  const recomendacoes = useMemo(() => insight?.recomendacoes || [], [insight]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-cyan-500 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard-profissional')}
              className="text-sm text-gray-500 hover:text-gray-800 mb-1"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Insights IA</h1>
            <p className="text-gray-500">
              Paciente: {pacienteNome || 'Paciente selecionado'}
            </p>
          </div>
          <button
            onClick={gerarInsights}
            disabled={gerando}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {gerando ? 'Gerando...' : 'Gerar Insights'}
          </button>
        </div>

        {erro && <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{erro}</div>}

        {carregando ? (
          <div className="p-6 bg-white rounded-xl text-gray-500">Carregando insights...</div>
        ) : !insight ? (
          <div className="p-6 bg-white rounded-xl text-gray-500 border border-gray-100">
            Ainda não há insights gerados para este paciente. Clique em "Gerar Insights" para começar.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <p className="text-sm text-gray-500 mb-2">Resumo Clínico Assistivo</p>
              <p className="text-gray-800">{insight.resumoClinico}</p>
              <div className="mt-4 flex gap-2 flex-wrap text-xs">
                <span className="px-2 py-1 rounded bg-cyan-100 text-cyan-700">Modelo: {insight.modelo}</span>
                <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Status: {insight.status}</span>
                <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                  Confiança: {insight.confiancaGeral ? `${Math.round(insight.confiancaGeral * 100)}%` : '-'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-3">Alertas</h2>
                {alertas.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem alertas no momento.</p>
                ) : (
                  <ul className="space-y-2">
                    {alertas.map((item, idx) => (
                      <li key={`${item.titulo}-${idx}`} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <p className="font-medium text-amber-800">{item.titulo}</p>
                        <p className="text-sm text-amber-700">{item.descricao}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-3">Tendências</h2>
                {tendencias.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem tendências detectadas.</p>
                ) : (
                  <ul className="space-y-2">
                    {tendencias.map((item, idx) => (
                      <li key={`${item.parametro}-${idx}`} className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="font-medium text-blue-800">{item.parametro}</p>
                        <p className="text-sm text-blue-700">{item.descricao}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-3">Pendências</h2>
                {pendencias.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem pendências mapeadas.</p>
                ) : (
                  <ul className="space-y-2">
                    {pendencias.map((item, idx) => (
                      <li key={`${item.tipo}-${idx}`} className="p-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-sm text-red-700">{item.descricao}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <h2 className="font-bold text-gray-800 mb-3">Recomendações de Revisão</h2>
                {recomendacoes.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem recomendações.</p>
                ) : (
                  <ul className="space-y-2 list-disc list-inside text-sm text-gray-700">
                    {recomendacoes.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3">Feedback Profissional</h2>
              <textarea
                value={feedbackTexto}
                onChange={(e) => setFeedbackTexto(e.target.value)}
                placeholder="Ex.: insight útil para triagem, mas faltou detalhe em exames laboratoriais."
                className="w-full min-h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => enviarFeedback('REVISADO')}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
                >
                  Marcar como Revisado
                </button>
                <button
                  onClick={() => enviarFeedback('DESCARTADO')}
                  className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 text-sm"
                >
                  Marcar como Descartado
                </button>
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3">Histórico de Gerações</h2>
          {historico.length === 0 ? (
            <p className="text-sm text-gray-500">Sem histórico ainda.</p>
          ) : (
            <div className="space-y-2">
              {historico.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm flex justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-800">{item.resumoClinico}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.criadoEm).toLocaleString('pt-BR')} • {item.modelo}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 h-fit rounded bg-gray-200 text-gray-700">{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Insight assistivo por IA. Não substitui decisão clínica profissional.
        </p>
      </div>
    </div>
  );
}



