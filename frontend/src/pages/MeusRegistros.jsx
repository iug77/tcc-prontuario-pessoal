import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MeusRegistros() {
  const navigate = useNavigate();
  const location = useLocation();
  const registroIdInicial = location.state?.registroId;
  const [registros, setRegistros] = useState([]);
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    const carregarRegistros = async () => {
      try {
        setCarregando(true);
        setErro('');

        const resposta = await fetch(`${API_URL}/api/pacientes/registros`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          setErro(dados.erro || 'NÃ£o foi possÃ­vel carregar seus registros.');
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
        setErro('Erro de conexÃ£o com o servidor.');
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
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dados = await resposta.json();
      if (resposta.ok) {
        setRegistroSelecionado(dados.registro);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do registro:', error);
    }
  };

  const formatarData = (dataIso) => {
    if (!dataIso) return '-';
    return new Date(dataIso).toLocaleDateString('pt-BR');
  };

  const formatarTipo = (tipo) => {
    const tipos = {
      exame: 'Exame',
      receita: 'Receita',
      medicamento: 'Medicamento',
      alergia: 'Alergia',
      doenca: 'DoenÃ§a',
      cirurgia: 'Cirurgia'
    };
    return tipos[tipo] || tipo;
  };

  const extrairMetaArquivo = (dataUrl = '') => {
    const match = dataUrl.match(/^data:([^;]+)(?:;name=([^;]+))?;base64,/i);
    if (!match) {
      return { mimeType: 'application/octet-stream', nomeArquivo: 'documento.bin' };
    }

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

  const { mimeType, nomeArquivo } = extrairMetaArquivo(registroSelecionado?.arquivoUrl || '');
  const ehImagem = mimeType.startsWith('image/');

  const registrosFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') {
      return registros;
    }

    return registros.filter((registro) => registro.tipo === filtroTipo);
  }, [filtroTipo, registros]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-800 font-medium"
            >
              â† Voltar
            </button>
            <h1 className="text-xl font-bold text-gray-800 border-l-2 border-gray-300 pl-4">Meus Registros</h1>
          </div>
          <button
            onClick={handleDownload}
            disabled={!registroSelecionado?.arquivoUrl}
            className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            â¬‡ Download
          </button>
        </div>

        {erro && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{erro}</div>}

        {carregando ? (
          <div className="p-4 text-center text-gray-500">Carregando registros...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[75vh]">
            <div className="md:col-span-1 bg-white rounded-xl shadow-sm p-4 border border-gray-100 overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Registros Adicionados</h3>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="todos">Todos os tipos</option>
                <option value="exame">Exame</option>
                <option value="receita">Receita</option>
                <option value="medicamento">Medicamento</option>
                <option value="alergia">Alergia</option>
                <option value="doenca">DoenÃ§a</option>
                <option value="cirurgia">Cirurgia</option>
              </select>

              {registrosFiltrados.length === 0 ? (
                <div className="text-sm text-gray-500">Nenhum registro encontrado.</div>
              ) : (
                <div className="space-y-2">
                  {registrosFiltrados.map((registro) => (
                    <button
                      key={registro.id}
                      onClick={() => carregarDetalhes(registro.id)}
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

            <div className="md:col-span-2 space-y-4">
              {registroSelecionado ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Detalhes do Registro</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tipo</p>
                      <p className="font-medium text-gray-800">{formatarTipo(registroSelecionado.tipo)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Data</p>
                      <p className="font-medium text-gray-800">{formatarData(registroSelecionado.data)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Ã“rgÃ£o / Sistema</p>
                      <p className="font-medium text-gray-800">{registroSelecionado.orgao || 'NÃ£o informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Arquivo</p>
                      <p className="font-medium text-gray-800 text-xs">{nomeArquivo || 'Sem nome'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-gray-500 text-center">
                  Selecione um registro para ver os detalhes
                </div>
              )}

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
                      title={nomeArquivo || 'VisualizaÃ§Ã£o do documento'}
                      className="w-full h-full bg-white"
                    />
                  )
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 font-medium">Arquivo nÃ£o disponÃ­vel</p>
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



