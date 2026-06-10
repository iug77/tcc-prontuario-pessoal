import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { API_URL } from '../config';

const ICONES = {
  PARECER_ADICIONADO:  { emoji: '💬', cor: '#10b981', fundo: 'rgba(16,185,129,0.12)' },
  REGISTRO_ACESSADO:   { emoji: '👁️', cor: '#6366f1', fundo: 'rgba(99,102,241,0.12)' },
  PERMISSAO_EXPIRANDO: { emoji: '⚠️', cor: '#f59e0b', fundo: 'rgba(245,158,11,0.12)' },
};

function tempoRelativo(data) {
  const diff = Date.now() - new Date(data).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  if (d < 7) return `há ${d} dias`;
  return new Date(data).toLocaleDateString('pt-BR');
}

export default function Notificacoes() {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [ultimaVista] = useState(
    () => new Date(localStorage.getItem('notificacoesVistasEm') || 0)
  );

  useEffect(() => {
    const token = localStorage.getItem('token');

    async function buscar() {
      try {
        const r = await fetch(`${API_URL}/api/pacientes/notificacoes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.erro || 'Erro ao buscar notificações');
        setNotificacoes(d.notificacoes || []);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }

    buscar();

    // Marca como lidas ao visitar a página
    localStorage.setItem('notificacoesVistasEm', new Date().toISOString());
  }, []);

  function handleClick(link) {
    if (!link) return;
    if (link.registroId) {
      navigate(link.rota, { state: { registroId: link.registroId } });
    } else {
      navigate(link.rota);
    }
  }

  const novas = notificacoes.filter(n => new Date(n.criadoEm) > ultimaVista);

  return (
    <AppLayout title="Notificações">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(124,58,237,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0"
                stroke="#7c3aed" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
              Notificações
            </h1>
            {!carregando && (
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
                {notificacoes.length === 0
                  ? 'Nenhuma notificação recente'
                  : `${notificacoes.length} notificaç${notificacoes.length === 1 ? 'ão' : 'ões'} nos últimos 30 dias`}
              </p>
            )}
          </div>
        </div>

        {carregando && (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
            Carregando...
          </div>
        )}

        {erro && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '12px 16px', color: '#fca5a5', fontSize: 14
          }}>
            {erro}
          </div>
        )}

        {!carregando && !erro && notificacoes.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '56px 24px',
            background: 'rgba(255,255,255,0.03)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 15 }}>
              Nenhuma notificação por enquanto.
            </p>
            <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 13 }}>
              Você será avisado quando um médico adicionar um parecer ou acessar seu prontuário.
            </p>
          </div>
        )}

        {!carregando && notificacoes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {novas.length > 0 && (
              <div style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 0 8px' }}>
                Novas
              </div>
            )}
            {notificacoes.map((n, idx) => {
              const { emoji, cor, fundo } = ICONES[n.tipo] || { emoji: '🔔', cor: '#94a3b8', fundo: 'rgba(148,163,184,0.1)' };
              const isNova = new Date(n.criadoEm) > ultimaVista;

              if (idx > 0 && novas.length > 0 && !isNova && new Date(notificacoes[idx - 1].criadoEm) > ultimaVista) {
                return (
                  <>
                    <div key={`sep_${n.id}`} style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 0' }}>
                      Anteriores
                    </div>
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClick(n.link)}
                      style={{
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        background: isNova ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.03)',
                        border: isNova ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12, padding: '14px 16px',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: fundo, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18
                      }}>
                        {emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{n.titulo}</span>
                          <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{tempoRelativo(n.criadoEm)}</span>
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>{n.descricao}</p>
                        {n.link && (
                          <span style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: cor, fontWeight: 500 }}>
                            Ver detalhes →
                          </span>
                        )}
                      </div>
                      {isNova && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: 6 }} />
                      )}
                    </button>
                  </>
                );
              }

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n.link)}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start',
                    background: isNova ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.03)',
                    border: isNova ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '14px 16px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: fundo, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18
                  }}>
                    {emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{n.titulo}</span>
                      <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{tempoRelativo(n.criadoEm)}</span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>{n.descricao}</p>
                    {n.link && (
                      <span style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: cor, fontWeight: 500 }}>
                        Ver detalhes →
                      </span>
                    )}
                  </div>
                  {isNova && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: 6 }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
