import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Visualizador() {
  const navigate = useNavigate();
  const location = useLocation();
  const pacienteId = location.state?.pacienteId;

  const [registros, setRegistros] = useState([]);
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [insightRegistro, setInsightRegistro] = useState(null);
  const [carregandoInsight, setCarregandoInsight] = useState(false);
  const [erroInsight, setErroInsight] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

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
          setErro(dados.erro || 'Não foi possÃ­vel carregar os registros.');

          if (resposta.status === 401 || resposta.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            navigate('/');
          }

          return;
        }

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

      const respostaRegistro = await fetch(`${API_URL}/api/profissionais/registros/${pacienteId}/${registroId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dadosRegistro = await respostaRegistro.json();

      if (respostaRegistro.ok) {
        setRegistroSelecionado(dadosRegistro.registro || null);

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
        setErroInsight(dadosInsight.erro || 'Não foi possÃ­vel gerar insight deste registro.');
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

  const { mimeType, nomeArquivo } = extrairMetaArquivo(registroSelecionado?.arquivoUrl || '');
  const ehImagem = mimeType.startsWith('image/');

  if (!pacienteId) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Cabeçalho de Ações */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard-profissional')}
              className="text-gray-500 hover:text-gray-800 font-medium"
            >
              ← Voltar
            </button>
            <h1 className="text-xl font-bold text-gray-800 border-l-2 border-gray-300 pl-4">
              {registroSelecionado ? formatarTipo(registroSelecionado.tipo) : 'Registros'}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!registroSelecionado?.arquivoUrl}
              className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↓ Download
            </button>
            <button
              onClick={handlePrint}
              disabled={!registroSelecionado?.arquivoUrl}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🖨 Imprimir
            </button>
          </div>
        </div>

        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="p-4 text-center text-gray-500">Carregando registros...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[75vh]">
            
            {/* Coluna Esquerda: Lista de Registros */}
            <div className="md:col-span-1 bg-white rounded-xl shadow-sm p-4 border border-gray-100 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Registros do Paciente</h3>
              
              {registros.length === 0 ? (
                <div className="text-sm text-gray-500">Nenhum registro encontrado.</div>
              ) : (
                <div className="space-y-2">
                  {registros.map((registro) => (
                    <button
                      key={registro.id}
                      onClick={() => carregarRegistroDetalhes(registro.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors font-medium ${
                        registroSelecionado?.id === registro.id
                          ? 'bg-teal-100 text-teal-700 border-l-4 border-teal-600'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <p className="text-sm">{formatarTipo(registro.tipo)}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatarData(registro.data)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coluna Direita: Metadados e Documento */}
            <div className="md:col-span-2 space-y-4">
              {/* Metadados do Registro */}
              {registroSelecionado ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">InformaÃ§Ãµes do Registro</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tipo</p>
                      <p className="font-medium text-gray-800">{formatarTipo(registroSelecionado.tipo)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Data de Realização</p>
                      <p className="font-medium text-gray-800">{formatarData(registroSelecionado.data)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ã“rgÃ£o / Sistema</p>
                      <p className="font-medium text-gray-800">{registroSelecionado.orgao || 'Não informado'}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">ID do Documento</p>
                      <p className="font-medium text-gray-800 text-xs">#{registroSelecionado.id.substring(0, 8)}</p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 mb-1">Resumo ClÃ­nico Informado</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {registroSelecionado.descricaoClinica || 'Não informado pelo paciente.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-gray-500 text-center">
                  Selecione um registro para ver os detalhes
                </div>
              )}

              {registroSelecionado && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Insight do Registro</h3>
                    <button
                      onClick={gerarInsightRegistro}
                      disabled={carregandoInsight}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {carregandoInsight ? 'Gerando...' : (insightRegistro ? 'Atualizar Insight IA' : 'Gerar Insight IA')}
                    </button>
                  </div>

                  {carregandoInsight ? (
                    <p className="text-sm text-gray-500">Gerando insight com IA...</p>
                  ) : erroInsight ? (
                    <p className="text-sm text-red-600">{erroInsight}</p>
                  ) : insightRegistro ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-800">{insightRegistro.resumo}</p>
                      {insightRegistro.conclusao && (
                        <p className="text-sm font-medium text-gray-900">Conclusão: {insightRegistro.conclusao}</p>
                      )}
                      <p className="text-xs text-gray-500">Modelo: {insightRegistro.modelo}</p>
                      {insightRegistro.diagnosticoExtracao && (
                        <p className="text-xs text-gray-500">
                          Extração: {insightRegistro.diagnosticoExtracao.origem || 'sem origem'} • 
                          {` ${insightRegistro.diagnosticoExtracao.caracteresExtraidos || 0} caracteres`}
                          {insightRegistro.diagnosticoExtracao.erro ? ` • erro: ${insightRegistro.diagnosticoExtracao.erro}` : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Clique em "Gerar Insight IA" para analisar este registro.</p>
                  )}
                </div>
              )}

              {/* Visualização do Documento */}
              <div className="bg-gray-200 rounded-xl shadow-inner border border-gray-300 flex items-center justify-center overflow-hidden h-[50vh]">
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
                    <p className="text-gray-500 font-medium">Visualização do Documento</p>
                    <p className="text-sm text-gray-400">Arquivo nÃ£o disponÃ­vel</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


