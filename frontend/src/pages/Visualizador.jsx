import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { derivarSubtipo } from '../utils/derivarSubtipo';

export default function Visualizador() {
  const navigate = useNavigate();
  const location = useLocation();
  const pacienteId = location.state?.pacienteId;

  const [paciente, setPaciente] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [insightRegistro, setInsightRegistro] = useState(null);
  const [carregandoInsight, setCarregandoInsight] = useState(false);
  const [erroInsight, setErroInsight] = useState('');
  const [parecerTexto, setParecerTexto] = useState('');
  const [salvandoParecer, setSalvandoParecer] = useState(false);
  const [erroParecer, setErroParecer] = useState('');
  const [sucessoParecer, setSucessoParecer] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const tipoUsuario = (() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return String(parsed?.tipo || '');
    } catch {
      return '';
    }
  })();

  useEffect(() => {
    if (!pacienteId) { navigate('/dashboard-profissional'); return; }

    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const carregarRegistros = async () => {
      try {
        setCarregando(true);
        setErro('');

        const resposta = await fetch(`${API_URL}/api/profissionais/registros/${pacienteId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(dados.erro || 'Não foi possível carregar os registros.');
          if (resposta.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            navigate('/');
          }
          return;
        }

        setPaciente(dados.paciente || null);
        setRegistros(dados.registros || []);
        if (dados.registros && dados.registros.length > 0) {
          carregarRegistroDetalhes(dados.registros[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar registros:', error);
        setErro('Erro de conexão com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarRegistros();
  }, [pacienteId, navigate]);

  const carregarRegistroDetalhes = async (registroId) => {
    try {
      const token = localStorage.getItem('token');
      setErroInsight('');
      setInsightRegistro(null);
      setErroParecer('');
      setSucessoParecer('');

      const respostaRegistro = await fetch(
        `${API_URL}/api/profissionais/registros/${pacienteId}/${registroId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const dadosRegistro = await respostaRegistro.json();

      if (respostaRegistro.ok) {
        setRegistroSelecionado(dadosRegistro.registro || null);
        setParecerTexto(String(dadosRegistro.registro?.parecerMedico || ''));

        const respostaInsight = await fetch(
          `${API_URL}/api/profissionais/registros/${pacienteId}/${registroId}/insight`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (respostaInsight.ok) {
          const dadosInsight = await respostaInsight.json();
          setInsightRegistro(dadosInsight.insight || null);
        } else {
          setInsightRegistro(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do registro:', error);
    }
  };

  const salvarParecer = async () => {
    if (!registroSelecionado?.id) return;

    try {
      setErroParecer('');
      setSucessoParecer('');

      const texto = String(parecerTexto || '').trim();
      if (!texto) { setErroParecer('O parecer não pode ser vazio.'); return; }

      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }

      setSalvandoParecer(true);

      const resposta = await fetch(`${API_URL}/api/registros/${registroSelecionado.id}/parecer`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parecerMedico: texto })
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        setErroParecer(dados.erro || 'Não foi possível salvar o parecer.');
        if (resposta.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          navigate('/');
        }
        return;
      }

      if (dados.registro) {
        setRegistroSelecionado(dados.registro);
        setParecerTexto(String(dados.registro?.parecerMedico || texto));
      }

      setSucessoParecer('Parecer salvo com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar parecer:', error);
      setErroParecer('Erro de conexão ao salvar parecer.');
    } finally {
      setSalvandoParecer(false);
    }
  };

  const gerarInsightRegistro = async () => {
    if (!registroSelecionado?.id) return;

    try {
      const token = localStorage.getItem('token');
      setCarregandoInsight(true);
      setErroInsight('');

      const respostaInsight = await fetch(
        `${API_URL}/api/profissionais/registros/${pacienteId}/${registroSelecionado.id}/insight/gerar`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );

      const dadosInsight = await respostaInsight.json();
      if (respostaInsight.ok) {
        setInsightRegistro(dadosInsight.insight || null);
      } else {
        setErroInsight(dadosInsight.erro || 'Não foi possível gerar insight deste registro.');
      }
    } catch (error) {
      console.error('Erro ao gerar insight do registro:', error);
      setErroInsight('Erro de conexão ao gerar insight do registro.');
    } finally {
      setCarregandoInsight(false);
    }
  };

  const formatarData = (dataIso) => new Date(dataIso).toLocaleDateString('pt-BR');

  const formatarTipo = (tipo) => {
    const tipos = { exame: 'Exame', receita: 'Receita', medicamento: 'Medicamento' };
    return tipos[tipo] || tipo;
  };

  const handleDownload = () => {
    if (!registroSelecionado?.arquivoUrl) return;
    // URL assinada do R2 é cross-origin; abrir em nova aba para o navegador exibir/salvar.
    window.open(registroSelecionado.arquivoUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    if (!registroSelecionado?.arquivoUrl) return;
    const printWindow = window.open(registroSelecionado.arquivoUrl, '_blank');
    if (printWindow) printWindow.onload = () => printWindow.print();
  };

  const handleAmpliar = async () => {
    const url = registroSelecionado?.arquivoUrl;
    if (!url) return;

    let urlFinal = url;
    let objectUrlParaRevogar = '';

    try {
      if (String(url).startsWith('data:')) {
        const resposta = await fetch(url);
        const blob = await resposta.blob();
        urlFinal = URL.createObjectURL(blob);
        objectUrlParaRevogar = urlFinal;
      }

      const novaAba = window.open('', '_blank');
      if (!novaAba) {
        if (objectUrlParaRevogar) URL.revokeObjectURL(objectUrlParaRevogar);
        return;
      }

      novaAba.opener = null;
      novaAba.document.open();
      novaAba.document.write('<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0"></body></html>');
      novaAba.document.close();
      novaAba.document.title = nomeArquivo || 'Documento';

      if (ehImagem) {
        const img = novaAba.document.createElement('img');
        img.src = urlFinal;
        img.alt = nomeArquivo || 'Documento';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100vh';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        novaAba.document.body.appendChild(img);
      } else {
        const iframe = novaAba.document.createElement('iframe');
        iframe.src = urlFinal;
        iframe.title = nomeArquivo || 'Documento';
        iframe.style.border = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100vh';
        novaAba.document.body.appendChild(iframe);
      }

      if (objectUrlParaRevogar) setTimeout(() => URL.revokeObjectURL(objectUrlParaRevogar), 60_000);
    } catch (error) {
      console.error('Erro ao ampliar documento:', error);
      if (objectUrlParaRevogar) URL.revokeObjectURL(objectUrlParaRevogar);
    }
  };

  const hashDocumento = registroSelecionado?.hashDocumento || '';
  const statusHash = hashDocumento ? 'Verificado' : 'Indisponível';
  const nomeArquivo = registroSelecionado?.arquivoNome || 'documento';
  const mimeType = registroSelecionado?.arquivoMime || 'application/octet-stream';
  const ehImagem = mimeType.startsWith('image/');

  const formatarDataHora = (dataIso) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleString('pt-BR');
  };

  if (!pacienteId) return null;

  return (
    <AppLayout>
      <div className="page-wrapper page-wrapper-lg">
        <div className="page-head mb-4">
          <div>
            <h1 className="page-title">
              {registroSelecionado ? formatarTipo(registroSelecionado.tipo) : 'Prontuário'}
            </h1>
            <p className="page-subtitle">
              {paciente?.nome
                ? <>Paciente: <span className="font-semibold">{paciente.nome}</span>{paciente.email ? ` · ${paciente.email}` : ''}</>
                : `Paciente: ${pacienteId}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownload} disabled={!registroSelecionado?.arquivoUrl} className="btn btn-soft">
              ↓ Download
            </button>
            <button onClick={handlePrint} disabled={!registroSelecionado?.arquivoUrl} className="btn btn-outline">
              🖨 Imprimir
            </button>
          </div>
        </div>

        {erro && <div className="alert alert-danger mb-4">{erro}</div>}

        {carregando ? (
          <div className="p-4 text-center text-muted text-sm">Carregando registros...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[75vh]">

            {/* Lista de Registros */}
            <div className="md:col-span-1 card p-4 overflow-y-auto">
              <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted mb-4">Registros do Paciente</h3>

              {registros.length === 0 ? (
                <div className="text-sm text-muted">Nenhum registro encontrado.</div>
              ) : (
                <div className="space-y-2">
                  {registros.map((registro) => {
                    const ativo = registroSelecionado?.id === registro.id;
                    const subtipo = derivarSubtipo(registro);
                    return (
                      <button
                        key={registro.id}
                        type="button"
                        onClick={() => carregarRegistroDetalhes(registro.id)}
                        className={`w-full text-left rounded-xl p-3 border transition-colors flex items-start gap-2 group ${
                          ativo
                            ? 'bg-surface border-l-4 border-l-[rgb(var(--primary))] border-[rgb(var(--border))]'
                            : 'bg-surface-2 border-[rgb(var(--border))] hover:bg-surface'
                        }`}
                      >
                        <div className="mt-0.5 text-muted flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 3h6a2 2 0 0 1 2 2v16H7V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                            <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {formatarTipo(registro.tipo)}
                            {subtipo && (
                              <span className="font-normal text-muted"> · {subtipo}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted mt-0.5">{formatarData(registro.data)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coluna de Detalhes */}
            <div className="md:col-span-2 space-y-4 overflow-y-auto">
              {registroSelecionado ? (
                <div className="card p-6">
                  <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted mb-4">Informações do Registro</h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted mb-1">Tipo</p>
                      <p className="font-semibold">{formatarTipo(registroSelecionado.tipo)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Data de realização</p>
                      <p className="font-semibold">{formatarData(registroSelecionado.data)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Órgão / Sistema</p>
                      <p className="font-semibold">{registroSelecionado.orgao || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">ID do documento</p>
                      <p className="font-semibold text-xs">#{registroSelecionado.id.substring(0, 8)}</p>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted mb-1">Integridade / Hash</p>
                        <span className={`tag ${hashDocumento ? 'tag-success' : ''}`}>{statusHash}</span>
                      </div>
                      {hashDocumento ? (
                        <p className="font-mono text-xs break-all">{hashDocumento}</p>
                      ) : (
                        <p className="text-sm text-muted">Não foi possível calcular o hash deste documento.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[rgb(var(--border))] pt-4">
                    <p className="text-sm text-muted mb-1">Resumo clínico informado</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {registroSelecionado.descricaoClinica || 'Não informado pelo paciente.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card p-6 text-muted text-center text-sm">
                  Selecione um registro para ver os detalhes
                </div>
              )}

              {registroSelecionado && (
                <div className="card p-6 bg-surface-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted">Insight do registro</h3>
                      <span className="tag tag-info">IA</span>
                    </div>
                    <button
                      onClick={gerarInsightRegistro}
                      disabled={carregandoInsight}
                      className="btn btn-outline btn-sm"
                    >
                      {carregandoInsight ? 'Gerando...' : (insightRegistro ? 'Atualizar' : 'Gerar')}
                    </button>
                  </div>

                  {carregandoInsight ? (
                    <p className="text-sm text-muted">Gerando insight com IA...</p>
                  ) : erroInsight ? (
                    <p className="text-sm text-danger font-semibold">{erroInsight}</p>
                  ) : insightRegistro ? (
                    <div className="space-y-3">
                      <p className="text-sm">{insightRegistro.resumo}</p>
                      {insightRegistro.conclusao && (
                        <p className="text-sm font-semibold">Conclusão: {insightRegistro.conclusao}</p>
                      )}
                      <p className="text-xs text-muted">Modelo: {insightRegistro.modelo}</p>
                      {insightRegistro.diagnosticoExtracao && (
                        <p className="text-xs text-muted">
                          Extração: {insightRegistro.diagnosticoExtracao.origem || 'sem origem'}
                          {` · ${insightRegistro.diagnosticoExtracao.caracteresExtraidos || 0} caracteres`}
                          {insightRegistro.diagnosticoExtracao.erro ? ` · erro: ${insightRegistro.diagnosticoExtracao.erro}` : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Clique em "Gerar" para analisar este registro com IA.</p>
                  )}
                </div>
              )}

              {registroSelecionado && (
                <div className="card p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted">Parecer Médico</h3>
                    {registroSelecionado?.dataParecer && (
                      <span className="tag tag-primary">{formatarDataHora(registroSelecionado.dataParecer)}</span>
                    )}
                  </div>

                  {tipoUsuario === 'paciente' ? (
                    <div className="space-y-2">
                      {registroSelecionado?.parecerMedico ? (
                        <>
                          <p className="text-sm whitespace-pre-wrap">{registroSelecionado.parecerMedico}</p>
                          {registroSelecionado?.parecerProfissional?.nome && (
                            <p className="text-xs text-muted">
                              Assinado por {registroSelecionado.parecerProfissional.nome}
                              {registroSelecionado.parecerProfissional.crm ? ` · CRM: ${registroSelecionado.parecerProfissional.crm}` : ''}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted">Nenhum parecer médico adicionado para este registro.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={parecerTexto}
                        onChange={(e) => setParecerTexto(e.target.value)}
                        rows={5}
                        placeholder="Escreva sua conclusão clínica oficial para este exame/registro..."
                        className="input w-full resize-y font-medium"
                      />
                      {erroParecer && <p className="text-sm text-danger font-semibold">{erroParecer}</p>}
                      {sucessoParecer && <p className="text-sm text-success font-semibold">{sucessoParecer}</p>}
                      {registroSelecionado?.parecerProfissional?.nome && (
                        <p className="text-xs text-muted">
                          Última assinatura: {registroSelecionado.parecerProfissional.nome}
                          {registroSelecionado.parecerProfissional.crm ? ` · CRM: ${registroSelecionado.parecerProfissional.crm}` : ''}
                        </p>
                      )}
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={salvarParecer}
                          disabled={salvandoParecer}
                          className="btn btn-primary"
                        >
                          {salvandoParecer ? 'Salvando...' : 'Salvar Parecer Médico'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Documento */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted">Documento Original</h3>
                  <button
                    onClick={handleAmpliar}
                    disabled={!registroSelecionado?.arquivoUrl}
                    className="btn btn-outline btn-sm"
                  >
                    ↗ Ampliar
                  </button>
                </div>

                <div className="viewer-panel flex items-center justify-center h-[45vh] md:h-[55vh]">
                  {registroSelecionado?.arquivoUrl ? (
                    ehImagem ? (
                      <img
                        src={registroSelecionado.arquivoUrl}
                        alt={nomeArquivo || 'Imagem do exame'}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <iframe
                        src={registroSelecionado.arquivoUrl}
                        title={nomeArquivo || 'Visualização do documento'}
                        className="w-full h-full bg-white"
                      />
                    )
                  ) : (
                    <div className="text-center">
                      <p className="text-muted font-semibold text-sm">Arquivo não disponível</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
