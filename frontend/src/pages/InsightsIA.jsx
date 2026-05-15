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
    <div className="app-page">
      <div className="app-container max-w-6xl space-y-6">
        <div className="card strip-accent p-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard-profissional')}
              className="btn btn-outline mb-2"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight">Insights IA</h1>
            <p className="subtitle">
              Paciente: {pacienteNome || 'Paciente selecionado'}
            </p>
          </div>
          <button
            onClick={gerarInsights}
            disabled={gerando}
            className="btn btn-accent"
          >
            {gerando ? 'Gerando...' : 'Gerar Insights'}
          </button>
        </div>

        {erro && <div className="alert alert-danger">{erro}</div>}

        {carregando ? (
          <div className="card p-6 text-muted">Carregando insights...</div>
        ) : !insight ? (
          <div className="card p-6 text-muted">
            Ainda não há insights gerados para este paciente. Clique em "Gerar Insights" para começar.
          </div>
        ) : (
          <>
            <div className="card p-6">
              <p className="text-sm text-muted mb-2">Resumo clínico assistivo</p>
              <p>{insight.resumoClinico}</p>
              <div className="mt-4 flex gap-2 flex-wrap text-xs">
                <span className="pill pill-accent">Modelo: {insight.modelo}</span>
                <span className="pill">Status: {insight.status}</span>
                <span className="pill pill-success">
                  Confiança: {insight.confiancaGeral ? `${Math.round(insight.confiancaGeral * 100)}%` : '-'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h2 className="font-extrabold tracking-tight mb-3">Alertas</h2>
                {alertas.length === 0 ? (
                  <p className="text-sm text-muted">Sem alertas no momento.</p>
                ) : (
                  <ul className="space-y-2">
                    {alertas.map((item, idx) => (
                      <li key={`${item.titulo}-${idx}`} className="p-3 rounded-xl border border-[rgba(var(--warning),0.22)] bg-[rgba(var(--warning),0.10)]">
                        <p className="font-bold" style={{ color: 'rgb(var(--text))' }}>{item.titulo}</p>
                        <p className="text-sm text-muted">{item.descricao}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card p-5">
                <h2 className="font-extrabold tracking-tight mb-3">Tendências</h2>
                {tendencias.length === 0 ? (
                  <p className="text-sm text-muted">Sem tendências detectadas.</p>
                ) : (
                  <ul className="space-y-2">
                    {tendencias.map((item, idx) => (
                      <li key={`${item.parametro}-${idx}`} className="p-3 rounded-xl border border-[rgba(var(--primary),0.22)] bg-[rgba(var(--primary),0.08)]">
                        <p className="font-bold" style={{ color: 'rgb(var(--text))' }}>{item.parametro}</p>
                        <p className="text-sm text-muted">{item.descricao}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card p-5">
                <h2 className="font-extrabold tracking-tight mb-3">Pendências</h2>
                {pendencias.length === 0 ? (
                  <p className="text-sm text-muted">Sem pendências mapeadas.</p>
                ) : (
                  <ul className="space-y-2">
                    {pendencias.map((item, idx) => (
                      <li key={`${item.tipo}-${idx}`} className="p-3 rounded-xl border border-[rgba(var(--danger),0.22)] bg-[rgba(var(--danger),0.08)]">
                        <p className="text-sm text-danger font-semibold">{item.descricao}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card p-5">
                <h2 className="font-extrabold tracking-tight mb-3">Recomendações de revisão</h2>
                {recomendacoes.length === 0 ? (
                  <p className="text-sm text-muted">Sem recomendações.</p>
                ) : (
                  <ul className="space-y-2 list-disc list-inside text-sm">
                    {recomendacoes.map((item, idx) => (
                      <li key={`${item}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-extrabold tracking-tight mb-3">Feedback profissional</h2>
              <textarea
                value={feedbackTexto}
                onChange={(e) => setFeedbackTexto(e.target.value)}
                placeholder="Ex.: insight útil para triagem, mas faltou detalhe em exames laboratoriais."
                className="textarea"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => enviarFeedback('REVISADO')}
                  className="btn btn-success"
                >
                  Marcar como Revisado
                </button>
                <button
                  onClick={() => enviarFeedback('DESCARTADO')}
                  className="btn btn-outline"
                >
                  Marcar como Descartado
                </button>
              </div>
            </div>
          </>
        )}

        <div className="card p-5">
          <h2 className="font-extrabold tracking-tight mb-3">Histórico de gerações</h2>
          {historico.length === 0 ? (
            <p className="text-sm text-muted">Sem histórico ainda.</p>
          ) : (
            <div className="space-y-2">
              {historico.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-surface-2 border border-[rgb(var(--border))] text-sm flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.resumoClinico}</p>
                    <p className="text-xs text-muted">
                      {new Date(item.criadoEm).toLocaleString('pt-BR')} • {item.modelo}
                    </p>
                  </div>
                  <span className="pill">{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted">
          Insight assistivo por IA. Não substitui decisão clínica profissional.
        </p>
      </div>
    </div>
  );
}



