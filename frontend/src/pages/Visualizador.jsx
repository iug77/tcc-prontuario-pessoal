import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    if (!pacienteId) {
      navigate('/dashboard-profissional');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    const carregarRegistros = async () => {
      try {
        setCarregando(true);
        setErro('');

        const resposta = await fetch(`${API_URL}/api/profissionais/registros/${pacienteId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
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

      const respostaRegistro = await fetch(`${API_URL}/api/profissionais/registros/${pacienteId}/${registroId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dadosRegistro = await respostaRegistro.json();

      if (respostaRegistro.ok) {
        setRegistroSelecionado(dadosRegistro.registro || null);
        setParecerTexto(String(dadosRegistro.registro?.parecerMedico || ''));

        const respostaInsight = await fetch(
          `${API_URL}/api/profissionais/registros/${pacienteId}/${registroId}/insight`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (respostaInsight.ok) {
          const dadosInsight = await respostaInsight.json();
          setInsightRegistro(dadosInsight.insight || null);
        } else {
          setInsightRegistro(null);
        }
      } else {
        console.error('Erro ao carregar detalhes:', dadosRegistro.erro);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do registro:', error);
    }
  };

  const salvarParecer = async () => {
    if (!registroSelecionado?.id) {
      return;
    }

    try {
      setErroParecer('');
      setSucessoParecer('');

      const texto = String(parecerTexto || '').trim();
      if (!texto) {
        setErroParecer('O parecer não pode ser vazio.');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      setSalvandoParecer(true);

      const resposta = await fetch(`${API_URL}/api/registros/${registroSelecionado.id}/parecer`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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
    if (!registroSelecionado?.id) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      setCarregandoInsight(true);
      setErroInsight('');

      const respostaInsight = await fetch(
        `${API_URL}/api/profissionais/registros/${pacienteId}/${registroSelecionado.id}/insight/gerar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
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

  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    return data.toLocaleDateString('pt-BR');
  };

  const formatarTipo = (tipo) => {
    const tipos = {
      exame: 'Exame',
      receita: 'Receita',
      medicamento: 'Medicamento'
    };
    return tipos[tipo] || tipo;
  };

  const extrairMetaArquivo = (dataUrl = '') => {
    const match = dataUrl.match(/^data:([^;]+)(?:;name=([^;]+))?;base64,/i);
    if (!match) {
      return {
        mimeType: 'application/octet-stream',
        nomeArquivo: 'documento.bin'
      };
    }

    let mimeType = match[1] || 'application/octet-stream';
    const nomeCodificado = match[2] || '';
    let nomeArquivo = 'documento';

    // Compatibilidade com arquivos antigos salvos como octet-stream
    if (mimeType === 'application/octet-stream') {
      const base64Conteudo = dataUrl.split(',')[1] || '';
      if (base64Conteudo.startsWith('JVBERi0')) {
        mimeType = 'application/pdf';
      } else if (base64Conteudo.startsWith('/9j/')) {
        mimeType = 'image/jpeg';
      } else if (base64Conteudo.startsWith('iVBORw0KGgo')) {
        mimeType = 'image/png';
      }
    }

    if (nomeCodificado) {
      try {
        nomeArquivo = decodeURIComponent(nomeCodificado);
      } catch {
        nomeArquivo = nomeCodificado;
      }
    }

    if (!nomeArquivo.includes('.')) {
      if (mimeType === 'application/pdf') nomeArquivo = `${nomeArquivo}.pdf`;
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') nomeArquivo = `${nomeArquivo}.jpg`;
      if (mimeType === 'image/png') nomeArquivo = `${nomeArquivo}.png`;
    }

    return { mimeType, nomeArquivo };
  };

  const handleDownload = () => {
    if (!registroSelecionado?.arquivoUrl) return;

    const { nomeArquivo } = extrairMetaArquivo(registroSelecionado.arquivoUrl);
    const link = document.createElement('a');
    link.href = registroSelecionado.arquivoUrl;
    link.download = nomeArquivo || 'documento';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!registroSelecionado?.arquivoUrl) return;

    const printWindow = window.open(registroSelecionado.arquivoUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  };

  const handleAmpliar = async () => {
    const url = registroSelecionado?.arquivoUrl;
    if (!url) return;

    let urlFinal = url;
    let objectUrlParaRevogar = '';

    try {
      // Para data URLs grandes, abrir diretamente em nova aba pode falhar.
      // Convertemos para Blob + object URL para garantir renderização.
      if (String(url).startsWith('data:')) {
        const resposta = await fetch(url);
        const blob = await resposta.blob();
        urlFinal = URL.createObjectURL(blob);
        objectUrlParaRevogar = urlFinal;
      }

      const novaAba = window.open('', '_blank');
      if (!novaAba) {
        if (objectUrlParaRevogar) {
          URL.revokeObjectURL(objectUrlParaRevogar);
        }
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

      if (objectUrlParaRevogar) {
        setTimeout(() => {
          URL.revokeObjectURL(objectUrlParaRevogar);
        }, 60_000);
      }
    } catch (error) {
      console.error('Erro ao ampliar documento:', error);
      if (objectUrlParaRevogar) {
        URL.revokeObjectURL(objectUrlParaRevogar);
      }
    }
  };

  const hashDocumento = registroSelecionado?.hashDocumento || '';
  const statusHash = hashDocumento ? 'Verificado' : 'Indisponível';

  const { mimeType, nomeArquivo } = extrairMetaArquivo(registroSelecionado?.arquivoUrl || '');
  const ehImagem = mimeType.startsWith('image/');

  const formatarDataHora = (dataIso) => {
    if (!dataIso) return '';
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleString('pt-BR');
  };

  if (!pacienteId) {
    return null;
  }

  return (
    <div className="app-page">
      <div className="app-container max-w-5xl space-y-4">
        
        {/* Cabeçalho de Ações */}
        <div className="card p-4 border-b border-[rgb(var(--border))]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <button 
                onClick={() => navigate('/dashboard-profissional')}
                className="btn btn-outline"
              >
                ← Voltar
              </button>

              <div>
                <h1 className="text-xl font-extrabold tracking-tight">
                  {registroSelecionado ? formatarTipo(registroSelecionado.tipo) : 'Registros'}
                </h1>
                <p className="text-sm text-muted">
                  {paciente?.nome ? (
                    <>
                      Paciente: <span className="font-semibold">{paciente.nome}</span>
                      {paciente.email ? ` • ${paciente.email}` : ''}
                    </>
                  ) : (
                    <>Paciente: {pacienteId}</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownload}
                disabled={!registroSelecionado?.arquivoUrl}
                className="btn btn-soft"
              >
                ↓ Download
              </button>
              <button
                onClick={handlePrint}
                disabled={!registroSelecionado?.arquivoUrl}
                className="btn btn-outline"
              >
                🖨 Imprimir
              </button>
            </div>
          </div>
        </div>

        {erro && (
          <div className="alert alert-danger">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="p-4 text-center text-muted">Carregando registros...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[75vh]">
            
            {/* Coluna Esquerda: Lista de Registros */}
            <div className="md:col-span-1 card p-4 overflow-y-auto">
              <h3 className="text-sm font-extrabold tracking-wider uppercase text-muted mb-4">Registros do Paciente</h3>
              
              {registros.length === 0 ? (
                <div className="text-sm text-muted">Nenhum registro encontrado.</div>
              ) : (
                <div className="space-y-2">
                  {registros.map((registro) => (
                    <button
                      key={registro.id}
                      onClick={() => carregarRegistroDetalhes(registro.id)}
                      className={`w-full text-left rounded-xl p-3 border border-[rgb(var(--border))] font-semibold transition-colors ${
                        registroSelecionado?.id === registro.id
                          ? 'bg-surface border-l-4 border-l-[rgb(var(--primary))]'
                          : 'bg-surface-2 hover:bg-surface'
                      }`}
                    >
                      <p className="text-sm">{formatarTipo(registro.tipo)}</p>
                      <p className="text-xs text-muted mt-1">{formatarData(registro.data)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna Direita: Metadados e Documento */}
            <div className="md:col-span-2 space-y-4">
              {/* Metadados do Registro */}
              {registroSelecionado ? (
                <div className="card p-6">
                  <h3 className="text-sm font-extrabold tracking-wider uppercase text-muted mb-4">Informações do Registro</h3>
                  
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
                        <p className="text-sm text-muted mb-1">Integridade / Hash do Documento</p>
                        <span className={`tag ${hashDocumento ? 'tag-success' : 'tag'}`} title={hashDocumento ? 'Hash SHA-256 calculado no servidor a partir do conteúdo do documento.' : 'Hash não disponível para este tipo de arquivo.'}>
                          {statusHash}
                        </span>
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
                <div className="card p-6 text-muted text-center">
                  Selecione um registro para ver os detalhes
                </div>
              )}

              {registroSelecionado && (
                <div className="card p-6 bg-surface-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold tracking-wider uppercase text-muted">Insight do registro</h3>
                      <span className="tag tag-info">IA</span>
                    </div>
                    <button
                      onClick={gerarInsightRegistro}
                      disabled={carregandoInsight}
                      className="btn btn-outline"
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
                          Extração: {insightRegistro.diagnosticoExtracao.origem || 'sem origem'} • 
                          {` ${insightRegistro.diagnosticoExtracao.caracteresExtraidos || 0} caracteres`}
                          {insightRegistro.diagnosticoExtracao.erro ? ` • erro: ${insightRegistro.diagnosticoExtracao.erro}` : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Clique em "Gerar Insight IA" para analisar este registro.</p>
                  )}
                </div>
              )}

              {registroSelecionado && (
                <div className="card p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-extrabold tracking-wider uppercase text-muted">Parecer Médico</h3>
                    {registroSelecionado?.dataParecer && (
                      <span className="tag tag-primary" title="Data do parecer">
                        {formatarDataHora(registroSelecionado.dataParecer)}
                      </span>
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
                              {registroSelecionado.parecerProfissional.crm ? ` • CRM: ${registroSelecionado.parecerProfissional.crm}` : ''}
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
                          {registroSelecionado.parecerProfissional.crm ? ` • CRM: ${registroSelecionado.parecerProfissional.crm}` : ''}
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

              {/* Visualização do Documento */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold tracking-wider uppercase text-muted">Documento Original</h3>
                  <button
                    onClick={handleAmpliar}
                    disabled={!registroSelecionado?.arquivoUrl}
                    className="btn btn-outline"
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
                      <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-muted font-semibold">Visualização do documento</p>
                      <p className="text-sm text-muted">Arquivo não disponível</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


