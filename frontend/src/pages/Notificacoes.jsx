import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { API_URL } from '../config';

const TIPOS = {
  PARECER_ADICIONADO:  { emoji: '💬', cor: 'var(--success-hex, #10b981)', varBg: 'rgba(16,185,129,0.10)', varBorder: 'rgba(16,185,129,0.20)' },
  REGISTRO_ACESSADO:   { emoji: '👁️', cor: 'rgb(var(--primary))',         varBg: 'rgba(var(--primary),0.08)', varBorder: 'rgba(var(--primary),0.18)' },
  PERMISSAO_EXPIRANDO: { emoji: '⚠️', cor: 'rgb(var(--warning))',          varBg: 'rgba(245,158,11,0.10)',    varBorder: 'rgba(245,158,11,0.22)' },
};

function tempoRelativo(data) {
  const diff = Date.now() - new Date(data).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h  < 24)  return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1)  return 'ontem';
  if (d < 7)    return `há ${d} dias`;
  return new Date(data).toLocaleDateString('pt-BR');
}

export default function Notificacoes() {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando]     = useState(true);
  const [erro, setErro]                 = useState('');
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
    localStorage.setItem('notificacoesVistasEm', new Date().toISOString());
  }, []);

  function handleClick(link) {
    if (!link) return;
    if (link.registroId) navigate(link.rota, { state: { registroId: link.registroId } });
    else navigate(link.rota);
  }

  const novas      = notificacoes.filter(n => new Date(n.criadoEm) > ultimaVista);
  const anteriores = notificacoes.filter(n => new Date(n.criadoEm) <= ultimaVista);

  return (
    <AppLayout title="Notificações">
      <div className="page-wrapper" style={{ maxWidth: 680 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgb(var(--primary-muted))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0"
                stroke="rgb(var(--primary))" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Notificações</h1>
            {!carregando && (
              <p className="page-subtitle" style={{ marginTop: 2 }}>
                {notificacoes.length === 0
                  ? 'Nenhuma notificação recente'
                  : `${notificacoes.length} notificaç${notificacoes.length === 1 ? 'ão' : 'ões'} nos últimos 30 dias`}
              </p>
            )}
          </div>
        </div>

        {carregando && (
          <div className="card p-6" style={{ textAlign: 'center', color: 'rgb(var(--muted))' }}>
            Carregando...
          </div>
        )}

        {erro && (
          <div className="card p-4" style={{ borderLeft: '4px solid rgb(var(--danger))' }}>
            <p style={{ margin: 0, color: 'rgb(var(--danger))', fontSize: 14 }}>{erro}</p>
          </div>
        )}

        {!carregando && !erro && notificacoes.length === 0 && (
          <div className="card p-6" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
            <p style={{ margin: 0, color: 'rgb(var(--text))', fontWeight: 600, fontSize: 15 }}>
              Nenhuma notificação por enquanto
            </p>
            <p style={{ margin: '6px 0 0', color: 'rgb(var(--muted))', fontSize: 13 }}>
              Você será avisado quando um médico adicionar um parecer ou acessar seu prontuário.
            </p>
          </div>
        )}

        {!carregando && !erro && notificacoes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            {novas.length > 0 && (
              <>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'rgb(var(--primary))',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '0 0 8px'
                }}>
                  Novas · {novas.length}
                </div>
                {novas.map(n => <NotifCard key={n.id} n={n} isNova onClick={() => handleClick(n.link)} />)}
              </>
            )}

            {anteriores.length > 0 && (
              <>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'rgb(var(--muted-2, #969db2))',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: `${novas.length > 0 ? '14px' : '0px'} 0 8px`
                }}>
                  Anteriores · {anteriores.length}
                </div>
                {anteriores.map(n => <NotifCard key={n.id} n={n} isNova={false} onClick={() => handleClick(n.link)} />)}
              </>
            )}

          </div>
        )}
      </div>
    </AppLayout>
  );
}

function NotifCard({ n, isNova, onClick }) {
  const cfg = TIPOS[n.tipo] || { emoji: '🔔', cor: 'rgb(var(--muted))', varBg: 'rgb(var(--surface-2))', varBorder: 'rgb(var(--border))' };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', gap: 14, alignItems: 'flex-start', width: '100%',
        background: isNova ? 'rgb(var(--primary-muted))' : 'rgb(var(--surface))',
        border: `1px solid ${isNova ? 'rgba(var(--primary),0.25)' : 'rgb(var(--border))'}`,
        borderRadius: 12, padding: '14px 16px',
        cursor: 'pointer', textAlign: 'left',
        transition: 'box-shadow 0.15s, transform 0.1s'
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Ícone */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: cfg.varBg,
        border: `1px solid ${cfg.varBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17
      }}>
        {cfg.emoji}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgb(var(--text))' }}>
            {n.titulo}
          </span>
          <span style={{ fontSize: 11, color: 'rgb(var(--muted))', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {tempoRelativo(n.criadoEm)}
          </span>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgb(var(--muted))', lineHeight: 1.45 }}>
          {n.descricao}
        </p>
        {n.link && (
          <span style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: cfg.cor, fontWeight: 600 }}>
            Ver detalhes →
          </span>
        )}
      </div>

      {/* Indicador de nova */}
      {isNova && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'rgb(var(--primary))', flexShrink: 0, marginTop: 5
        }} />
      )}
    </button>
  );
}
