import { API_URL } from '../config';\nimport { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

export default function NovoRegistro() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [tipo, setTipo] = useState('');
  const [data, setData] = useState('');
  const [orgao, setOrgao] = useState('');
  const [descricaoClinica, setDescricaoClinica] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [mimeArquivo, setMimeArquivo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const handleArquivoSelecionado = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!tiposPermitidos.includes(file.type)) {
      setErro('Apenas PDF, JPG e PNG sÃ£o permitidos.');
      return;
    }

    const tamanhoMB = file.size / (1024 * 1024);
    if (tamanhoMB > 5) {
      setErro('Arquivo excede o tamanho mÃ¡ximo de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      setArquivo(base64String);
      setNomeArquivo(file.name);
      setMimeArquivo(file.type || 'application/octet-stream');
      setErro('');
    };
    reader.onerror = () => {
      setErro('Erro ao ler o arquivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverArquivo = () => {
    setArquivo(null);
    setNomeArquivo('');
    setMimeArquivo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    setSucesso('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/');
        return;
      }

      if (!tipo || !data) {
        setErro('Tipo de registro e data sÃ£o obrigatÃ³rios.');
        setCarregando(false);
        return;
      }

      const resposta = await fetch('http://localhost:3000/api/pacientes/registros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
          body: JSON.stringify({
            tipo,
            data,
            orgao: orgao || null,
            descricaoClinica: descricaoClinica || null,
            arquivoBase64: arquivo || null,
            nomeArquivo: nomeArquivo || null,
            mimeType: mimeArquivo || null
          })
      });

      const textoResposta = await resposta.text();
      let dados = {};
      try {
        dados = textoResposta ? JSON.parse(textoResposta) : {};
      } catch {
        dados = { erro: textoResposta || 'Erro ao processar resposta do servidor.' };
      }

      if (!resposta.ok) {
        setErro(dados.erro || 'Erro ao criar registro.');
        setCarregando(false);
        return;
      }

      setSucesso('Registro criado com sucesso!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      setErro('Erro de conexÃ£o com o servidor.');
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
        
        {/* CabeÃ§alho */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Novo Registro de SaÃºde</h1>
            <p className="text-gray-500">Adicione um novo documento ou histÃ³rico mÃ©dico</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700"
          >
            âœ• Cancelar
          </button>
        </div>

        {/* Mensagens de Feedback */}
        {erro && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium">
            âœ“ {sucesso}
          </div>
        )}

        {/* FormulÃ¡rio Macro */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Metadado: Tipo de Registro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Registro</label>
            <select 
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              required
            >
              <option value="">Selecione...</option>
              <option value="exame">Exame (Sangue, Imagem, etc.)</option>
              <option value="receita">Receita MÃ©dica</option>
              <option value="medicamento">Medicamento em Uso</option>
              <option value="alergia">Alergia</option>
              <option value="doenca">DoenÃ§a / CondiÃ§Ã£o</option>
              <option value="cirurgia">Cirurgia</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Metadado: Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do Ocorrido/Exame</label>
              <input 
                type="date" 
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {/* Metadado: Ã“rgÃ£o/Sistema */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ã“rgÃ£o / Sistema (Opcional)</label>
              <input 
                type="text" 
                value={orgao}
                onChange={(e) => setOrgao(e.target.value)}
                placeholder="Ex: CoraÃ§Ã£o, PulmÃ£o, Pele..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resumo ClÃ­nico do Laudo (Opcional, recomendado)</label>
            <textarea
              value={descricaoClinica}
              onChange={(e) => setDescricaoClinica(e.target.value)}
              placeholder="Ex: HematÃ³crito 52% (referÃªncia atÃ© 50%), hemoglobina normal, leucÃ³citos sem alteraÃ§Ãµes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-28"
              maxLength={8000}
            />
            <p className="text-xs text-gray-500 mt-1">Esse texto melhora muito a qualidade dos insights de normalidade/alteraÃ§Ãµes.</p>
          </div>

          {/* Info sobre Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo de Documento (Opcional)</label>
            
              {arquivo ? (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 16.5a1 1 0 01-1-1V4a1 1 0 112 0v11.5a1 1 0 01-1 1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-green-800">{nomeArquivo}</p>
                      <p className="text-xs text-green-700">Arquivo selecionado</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoverArquivo}
                    className="text-green-700 hover:text-green-900 font-medium"
                  >
                    âœ• Remover
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-1">Arraste um arquivo ou clique para fazer upload</p>
                  <p className="text-xs text-gray-500">PDF, JPG ou PNG (MÃ¡x. 5MB)</p>
                </div>
              )}
            
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleArquivoSelecionado}
                className="hidden" 
                accept="application/pdf,image/jpeg,image/png,image/jpg"
              />
            </div>
          </div>

          {/* BotÃµes de AÃ§Ã£o */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={carregando}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                carregando
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {carregando ? 'Salvando...' : 'Salvar Registro'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}