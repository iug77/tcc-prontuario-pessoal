import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* ── Helpers ──────────────────────────────────────────── */

const COR = {
  NORMAL:  '#22c55e',
  ALTO:    '#ef4444',
  BAIXO:   '#3b82f6',
  CRITICO: '#f97316',
};

function labelStatus(s) {
  if (s === 'ALTO')    return 'Acima';
  if (s === 'BAIXO')   return 'Abaixo';
  if (s === 'CRITICO') return 'Crítico';
  return 'Normal';
}

function formatarData(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${String(y).slice(2)}`;
}

function formatarDataLonga(iso) {
  if (!iso) return '-';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function calcTendencia(pontos) {
  if (pontos.length < 2) return 'estavel';
  const a = pontos[pontos.length - 2].valor;
  const b = pontos[pontos.length - 1].valor;
  const pct = ((b - a) / Math.abs(a || 1)) * 100;
  if (pct >  5) return 'alta';
  if (pct < -5) return 'baixa';
  return 'estavel';
}

function corLinha(pontos) {
  const temAlto   = pontos.some((p) => p.status === 'ALTO');
  const temBaixo  = pontos.some((p) => p.status === 'BAIXO');
  const temCrit   = pontos.some((p) => p.status === 'CRITICO');
  if (temCrit)               return COR.CRITICO;
  if (temAlto && temBaixo)   return '#f97316';
  if (temAlto)               return COR.ALTO;
  if (temBaixo)              return COR.BAIXO;
  return COR.NORMAL;
}

/* ── Custom Recharts pieces ───────────────────────────── */

const CustomDot = ({ cx, cy, payload }) => {
  if (cx == null || cy == null) return null;
  const cor = COR[payload?.status] || COR.NORMAL;
  return <circle cx={cx} cy={cy} r={5} fill={cor} stroke="white" strokeWidth={1.5} />;
};

const CustomTooltip = ({ active, payload, unidade }) => {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  return (
    <div
      className="card shadow-lg"
      style={{ padding: '10px 14px', fontSize: 12, minWidth: 160 }}
    >
      <p className="font-extrabold tracking-tight mb-1">{formatarDataLonga(pt?.data)}</p>
      <p>
        Valor:{' '}
        <span className="font-semibold">
          {pt?.valor} {unidade}
        </span>
      </p>
      <p style={{ color: COR[pt?.status], fontWeight: 700 }}>{labelStatus(pt?.status)}</p>
      {pt?.tipo && (
        <p className="text-muted capitalize" style={{ marginTop: 2 }}>
          {pt.tipo}
        </p>
      )}
    </div>
  );
};

/* ── Card de parâmetro ─────────────────────────────────── */

function CardParametro({ nome, info }) {
  const { unidade, refMin, refMax, pontos } = info;
  const temRef   = refMin != null && refMax != null;
  const ultimo   = pontos[pontos.length - 1];
  const direcao  = calcTendencia(pontos);
  const lineCor  = corLinha(pontos);
  const temGrafico = pontos.length > 1;

  const [yMin, yMax] = useMemo(() => {
    const vals = pontos.map((p) => p.valor);
    if (temRef) { vals.push(refMin, refMax); }
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const gap = (mx - mn) * 0.18 || mx * 0.1 || 1;
    return [
      parseFloat(Math.max(0, mn - gap).toFixed(1)),
      parseFloat((mx + gap).toFixed(1)),
    ];
  }, [pontos, refMin, refMax, temRef]);

  const setaDir = { alta: '↑', baixa: '↓', estavel: '→' }[direcao];
  const corSeta = {
    alta:   ultimo.status === 'NORMAL' ? COR.NORMAL : COR.ALTO,
    baixa:  ultimo.status === 'NORMAL' ? COR.NORMAL : COR.BAIXO,
    estavel: COR.NORMAL,
  }[direcao];

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-[rgb(var(--border))] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-extrabold tracking-tight truncate">{nome}</h3>
          <p className="text-xs text-muted mt-0.5">{unidade}{temRef ? ` · ref: ${refMin}–${refMax}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div style={{ textAlign: 'right' }}>
            <div className="text-xl font-extrabold tracking-tight leading-none">
              {ultimo.valor}
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: COR[ultimo.status] }}
            >
              {labelStatus(ultimo.status)}
            </span>
          </div>
          <span
            className="text-lg font-bold"
            style={{ color: corSeta }}
            title={`Tendência: ${direcao}`}
          >
            {setaDir}
          </span>
        </div>
      </div>

      {/* Gráfico ou mensagem */}
      {temGrafico ? (
        <div className="p-3 pt-4 flex-1">
          <ResponsiveContainer width="100%" height={150}>
            <LineChart
              data={pontos}
              margin={{ top: 4, right: 8, left: -22, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="data"
                tickFormatter={formatarData}
                tick={{ fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip unidade={unidade} />} />
              {temRef && (
                <ReferenceArea
                  y1={refMin}
                  y2={refMax}
                  fill={COR.NORMAL}
                  fillOpacity={0.07}
                />
              )}
              {temRef && (
                <>
                  <ReferenceLine
                    y={refMax}
                    stroke={COR.NORMAL}
                    strokeDasharray="4 3"
                    strokeOpacity={0.45}
                  />
                  <ReferenceLine
                    y={refMin}
                    stroke={COR.NORMAL}
                    strokeDasharray="4 3"
                    strokeOpacity={0.45}
                  />
                </>
              )}
              <Line
                type="monotone"
                dataKey="valor"
                stroke={lineCor}
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 7, stroke: 'white', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted text-right mt-1">
            {pontos.length} medição{pontos.length !== 1 ? 'ões' : ''}
            {' · '}
            {formatarDataLonga(pontos[0]?.data)} – {formatarDataLonga(pontos[pontos.length - 1]?.data)}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-muted text-center">
            Apenas 1 medição registrada.<br />
            Adicione mais exames para ver a evolução.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Página principal ─────────────────────────────────── */

export default function TendenciasClinicas() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const carregar = async () => {
      try {
        setCarregando(true);
        setErro('');
        const res = await fetch(`${API_URL}/api/pacientes/tendencias`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) {
          setErro(json.erro || 'Não foi possível carregar as tendências.');
          return;
        }
        setDados(json);
      } catch {
        setErro('Erro de conexão com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [navigate]);

  const parametrosFiltrados = useMemo(() => {
    if (!dados?.parametros) return {};
    const texto = busca.trim().toLowerCase();
    if (!texto) return dados.parametros;
    return Object.fromEntries(
      Object.entries(dados.parametros).filter(([chave, info]) =>
        (info.nome || chave).toLowerCase().includes(texto)
      )
    );
  }, [dados, busca]);

  const totalParametros = dados ? Object.keys(dados.parametros).length : 0;

  const pctNormais = useMemo(() => {
    if (!dados?.parametros) return null;
    const entradas = Object.values(dados.parametros);
    if (!entradas.length) return null;
    const normais = entradas.filter((info) => {
      const ultimo = info.pontos[info.pontos.length - 1];
      return ultimo?.status === 'NORMAL';
    }).length;
    return Math.round((normais / entradas.length) * 100);
  }, [dados]);

  const corPct = pctNormais == null ? null
    : pctNormais >= 75 ? COR.NORMAL
    : pctNormais >= 50 ? '#f59e0b'
    : COR.ALTO;

  return (
    <AppLayout>
      <div className="page-wrapper page-wrapper-lg space-y-6">

        {/* Cabeçalho */}
        <div className="page-head">
          <div>
            <h1 className="page-title">Tendências Clínicas</h1>
            <p className="page-subtitle">Evolução dos seus indicadores de saúde ao longo do tempo</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/meus-registros')}
            className="btn btn-outline"
          >
            Ver Registros
          </button>
        </div>

        {/* Erro */}
        {erro && <div className="alert alert-danger">{erro}</div>}

        {/* Stats */}
        {dados && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-label">Parâmetros</div>
              <div className="stat-value">{totalParametros}</div>
              <div className="stat-sub">rastreados</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Registros</div>
              <div className="stat-value">{dados.totalComInsight}</div>
              <div className="stat-sub">com análise IA</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Período</div>
              <div className="stat-value" style={{ fontSize: 16 }}>
                {dados.periodoInicio
                  ? `${formatarData(dados.periodoInicio)} – ${formatarData(dados.periodoFim)}`
                  : '—'}
              </div>
              <div className="stat-sub">de análise</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Última leitura</div>
              <div
                className="stat-value"
                style={{ color: corPct ?? undefined, fontSize: 26 }}
              >
                {pctNormais != null ? `${pctNormais}%` : '—'}
              </div>
              <div className="stat-sub">parâmetros normais</div>
            </div>
          </div>
        )}

        {/* Loading */}
        {carregando && (
          <div className="card p-12 text-center text-muted text-sm">
            Carregando tendências...
          </div>
        )}

        {/* Empty state — sem insights */}
        {!carregando && !erro && dados && dados.totalComInsight === 0 && (
          <div className="card p-10 text-center space-y-3">
            <div className="mx-auto w-14 h-14 text-muted opacity-40">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3v18h18M7 16l4-4 4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-extrabold tracking-tight text-lg">Nenhum dado de tendência disponível</p>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Para visualizar tendências, um profissional de saúde precisa gerar análise de IA em seus registros.
              Você tem {dados.totalRegistros} registro{dados.totalRegistros !== 1 ? 's' : ''} no sistema.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/meus-registros')}
                className="btn btn-outline"
              >
                Ver Meus Registros
              </button>
              <button
                type="button"
                onClick={() => navigate('/permissoes')}
                className="btn btn-primary"
              >
                Gerenciar Permissões
              </button>
            </div>
          </div>
        )}

        {/* Empty state — sem parâmetros (insights existem mas sem valores numéricos) */}
        {!carregando && !erro && dados && dados.totalComInsight > 0 && totalParametros === 0 && (
          <div className="card p-10 text-center space-y-3">
            <p className="font-extrabold tracking-tight text-lg">Nenhum parâmetro numérico encontrado</p>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Os registros com análise de IA não contêm valores numéricos identificáveis como exames
              laboratoriais. Tente adicionar exames com resultados numéricos (hemograma, glicemia, etc.).
            </p>
          </div>
        )}

        {/* Conteúdo principal */}
        {!carregando && !erro && dados && totalParametros > 0 && (
          <>
            {/* Barra de busca */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  width="15" height="15" viewBox="0 0 24 24" fill="none"
                >
                  <path
                    d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Filtrar parâmetro..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <span className="text-sm text-muted">
                {Object.keys(parametrosFiltrados).length} de {totalParametros}
              </span>
            </div>

            {/* Grid de parâmetros */}
            {Object.keys(parametrosFiltrados).length === 0 ? (
              <div className="card p-8 text-center text-muted text-sm">
                Nenhum parâmetro encontrado para "{busca}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(parametrosFiltrados).map(([chave, info]) => (
                  <CardParametro key={chave} nome={info.nome || chave} info={info} />
                ))}
              </div>
            )}

            {/* Legenda */}
            <div className="card p-4">
              <p className="text-xs font-semibold text-muted mb-3 uppercase tracking-wider">Legenda</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COR.NORMAL }} />
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COR.ALTO }} />
                  <span>Acima do normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COR.BAIXO }} />
                  <span>Abaixo do normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COR.CRITICO }} />
                  <span>Crítico</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-0 border-t border-dashed"
                    style={{ borderColor: COR.NORMAL }}
                  />
                  <span>Faixa de referência</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted text-center pb-2">
              Dados extraídos por análise de IA a partir dos seus registros de saúde.
              Esta visualização é informativa e não substitui avaliação médica.
            </p>
          </>
        )}

      </div>
    </AppLayout>
  );
}
