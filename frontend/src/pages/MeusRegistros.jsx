import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

export default function MeusRegistros() {
  const navigate = useNavigate();
  const location = useLocation();
  const registroIdInicial = location.state?.registroId;
  const [registros, setRegistros] = useState([]);
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const carregarRegistros = async () => {
      try {
        setCarregando(true);
        setErro('');

        const resposta = await fetch(`${API_URL}/api/pacientes/registros`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(dados.erro || 'Não foi possível carregar seus registros.');
          return;
        }

        setRegistros(dados.registros || []);
        if (dados.registros?.length > 0) {
          const existeRegistroInicial = registroIdInicial && dados.registros.some((item) => item.id === registroIdInicial);
          const alvo = existeRegistroInicial ? registroIdInicial : dados.registros[0].id;
          carregarDetalhes(alvo);
        }
      } catch (error) {
        console.error('Erro ao carregar registros do paciente:', error);
        setErro('Erro de conexão com o servidor.');
      } finally {
        setCarregando(false);
      }
    };

    carregarRegistros();
  }, [navigate, registroIdInicial]);

  const carregarDetalhes = async (registroId) => {
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch(`${API_URL}/api/pacientes/registros/${registroId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dados = await resposta.json();
      if (resposta.ok) setRegistroSelecionado(dados.registro);
    } catch (error) {
      console.error('Erro ao carregar detalhes do registro:', error);
    }
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    return new Date(dataIso).toLocaleDateString('pt-BR');
  };

  const formatarDataHora = (dataIso) => {
    if (!dataIso) return '-';
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return '-';
    return data.toLocaleString('pt-BR');
  };

  const formatarTipo = (tipo) => {
    const tipos = {
      exame: 'Exame', receita: 'Receita', medicamento: 'Medicamento',
      alergia: 'Alergia', doenca: 'Doença', cirurgia: 'Cirurgia'
    };
    return tipos[tipo] || tipo;
  };

  const derivarSubtipo = (registro) => {
    if (registro.tipo !== 'exame') return null;
    const texto = [
      registro.orgao || '',
      registro.descricaoClinica || '',
      registro.insightRegistro?.resumo || ''
    ].join(' ').toLowerCase();

    const regras = [
      // Imagem / Funcional
      [/ecocardiograma/,                           'Ecocardiograma'],
      [/eletrocardiograma|ecg\b/,                  'ECG'],
      [/holter/,                                   'Holter'],
      [/mamografia/,                               'Mamografia'],
      [/densitometria|dexa/,                       'Densitometria'],
      [/ressonância|ressonancia|rmn?\b/,           'Ressonância'],
      [/tomografia|tac\b|tc\b/,                    'Tomografia'],
      [/raio.?x|radiografi/,                       'Raio-X'],
      [/ultrassom|ultrasonografia|ecografi/,       'Ultrassom'],
      [/endoscopia/,                               'Endoscopia'],
      [/colonoscopia/,                             'Colonoscopia'],
      [/espirometria/,                             'Espirometria'],
      // Bioquímica específica
      [/hemoglobina glicada|hba1c|glicada/,        'Glicemia'],
      [/glicose|glicemia/,                         'Glicemia'],
      [/colesterol|lipidograma|triglicerí|hdl|ldl/,'Lipídios'],
      [/tsh|t[34]\s|tireóide|tireoide/,            'Tireoide'],
      [/ureia|creatinina|tfg|ácido úrico|renal/,   'Função Renal'],
      [/tgo|tgp|ast\b|alt\b|bilirrubina|hepáti|hepati|ggt\b/,'Função Hepática'],
      [/ferritina|ferro\s|transferrina|tibc/,      'Ferro'],
      [/vitamina\s+d/,                             'Vitamina D'],
      [/vitamina\s+b12|cobalamina/,                'Vitamina B12'],
      [/psa\b/,                                    'PSA'],
      [/pcr\b|proteína c reativa/,                 'PCR'],
      // Hematologia geral
      [/hemograma|hematol|leucócit|eritrócit|plaqueta|sangue/,'Sangue'],
      // Urina
      [/urina|eas\b/,                              'Urina'],
    ];

    for (const [regex, label] of regras) {
      if (regex.test(texto)) return label;
    }
    // Fallback: usa o orgao capitalizado se preenchido
    if (registro.orgao) return registro.orgao;
    return null;
  };

  const extrairMetaArquivo = (dataUrl = '') => {
    const match = dataUrl.match(/^data:([^;]+)(?:;name=([^;]+))?;base64,/i);
    if (!match) return { mimeType: 'application/octet-stream', nomeArquivo: 'documento.bin' };

    let mimeType = match[1] || 'application/octet-stream';
    const nomeCodificado = match[2] || '';
    let nomeArquivo = 'documento';

    if (mimeType === 'application/octet-stream') {
      const base64Conteudo = dataUrl.split(',')[1] || '';
      if (base64Conteudo.startsWith('JVBERi0')) mimeType = 'application/pdf';
      else if (base64Conteudo.startsWith('/9j/')) mimeType = 'image/jpeg';
      else if (base64Conteudo.startsWith('iVBORw0KGgo')) mimeType = 'image/png';
    }

    if (nomeCodificado) {
      try { nomeArquivo = decodeURIComponent(nomeCodificado); } catch { nomeArquivo = nomeCodificado; }
    }

    if (!nomeArquivo.includes('.')) {
      if (mimeType === 'application/pdf') nomeArquivo = `${nomeArquivo}.pdf`;
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') nomeArquivo = `${nomeArquivo}.jpg`;
      if (mimeType === 'image/png') nomeArquivo = `${nomeArquivo}.png`;
    }

    return { mimeType, nomeArquivo };
  };

  const handleRemover = async () => {
    if (!registroSelecionado) return;
    setRemovendo(true);
    try {
      const token = localStorage.getItem('token');
      const resposta = await fetch(`${API_URL}/api/pacientes/registros/${registroSelecionado.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resposta.ok) {
        setRegistros((prev) => prev.filter((r) => r.id !== registroSelecionado.id));
        setRegistroSelecionado(null);
        setConfirmandoRemocao(false);
      } else {
        const dados = await resposta.json();
        setErro(dados.erro || 'Erro ao remover registro.');
      }
    } catch {
      setErro('Erro de conexão ao remover registro.');
    } finally {
      setRemovendo(false);
    }
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

  const { mimeType, nomeArquivo } = extrairMetaArquivo(registroSelecionado?.arquivoUrl || '');
  const ehImagem = mimeType.startsWith('image/');

  const registrosFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') return registros;
    return registros.filter((registro) => registro.tipo === filtroTipo);
  }, [filtroTipo, registros]);

  return (
    <AppLayout>
      <div className="page-wrapper page-wrapper-lg">
        <div className="page-head mb-4">
          <div>
            <h1 className="page-title">Meus Registros</h1>
            <p className="page-subtitle">Visualize e gerencie seus documentos de saúde</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!registroSelecionado?.arquivoUrl}
              className="btn btn-soft"
            >
              ↓ Download
            </button>
            {confirmandoRemocao ? (
              <>
                <span className="text-sm text-muted">Tem certeza?</span>
                <button
                  onClick={handleRemover}
                  disabled={removendo}
                  className="btn btn-danger"
                >
                  {removendo ? 'Removendo...' : 'Confirmar'}
                </button>
                <button
                  onClick={() => setConfirmandoRemocao(false)}
                  disabled={removendo}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmandoRemocao(true)}
                disabled={!registroSelecionado}
                className="btn btn-danger"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {erro && <div className="alert alert-danger mb-4">{erro}</div>}

        {carregando ? (
          <div className="p-4 text-center text-muted text-sm">Carregando registros...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[75vh]">
            <div className="md:col-span-1 card p-4 overflow-y-auto">
              <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted mb-4">Registros Adicionados</h3>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="select mb-3"
              >
                <option value="todos">Todos os tipos</option>
                <option value="exame">Exame</option>
                <option value="receita">Receita</option>
                <option value="medicamento">Medicamento</option>
                <option value="alergia">Alergia</option>
                <option value="doenca">Doença</option>
                <option value="cirurgia">Cirurgia</option>
              </select>

              {registrosFiltrados.length === 0 ? (
                <div className="text-sm text-muted">Nenhum registro encontrado.</div>
              ) : (
                <div className="space-y-2">
                  {registrosFiltrados.map((registro) => (
                    <button
                      key={registro.id}
                      onClick={() => carregarDetalhes(registro.id)}
                      className={`list-item font-semibold ${registroSelecionado?.id === registro.id ? 'list-item-active' : ''}`}
                    >
                      <p className="text-sm">
                        {formatarTipo(registro.tipo)}
                        {derivarSubtipo(registro) && (
                          <span className="font-normal text-muted"> · {derivarSubtipo(registro)}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted mt-1">{formatarData(registro.data)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
              {registroSelecionado ? (
                <div className="card p-6">
                  <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted mb-4">Detalhes do Registro</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted mb-1">Tipo</p>
                      <p className="font-semibold">{formatarTipo(registroSelecionado.tipo)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Data</p>
                      <p className="font-semibold">{formatarData(registroSelecionado.data)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Órgão / Sistema</p>
                      <p className="font-semibold">{registroSelecionado.orgao || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Arquivo</p>
                      <p className="font-semibold text-xs">{nomeArquivo || 'Sem nome'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-6 text-muted text-center text-sm">
                  Selecione um registro para ver os detalhes
                </div>
              )}

              {registroSelecionado && (
                <div className="card p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-xs font-extrabold tracking-wider uppercase text-muted">Parecer Médico</h3>
                    {registroSelecionado?.dataParecer && (
                      <span className="tag tag-primary" title="Data do parecer">
                        {formatarDataHora(registroSelecionado.dataParecer)}
                      </span>
                    )}
                  </div>

                  {registroSelecionado?.parecerMedico ? (
                    <div className="space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{registroSelecionado.parecerMedico}</p>
                      {registroSelecionado?.parecerProfissional?.nome && (
                        <p className="text-xs text-muted">
                          Assinado por {registroSelecionado.parecerProfissional.nome}
                          {registroSelecionado.parecerProfissional.crm ? ` · CRM: ${registroSelecionado.parecerProfissional.crm}` : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Nenhum parecer médico adicionado para este registro.</p>
                  )}
                </div>
              )}

              <div className="viewer-panel flex items-center justify-center h-[50vh]">
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
        )}
      </div>
    </AppLayout>
  );
}
