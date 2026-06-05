import { API_URL } from '../config';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

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
      setErro('Apenas PDF, JPG e PNG são permitidos.');
      return;
    }

    const tamanhoMB = file.size / (1024 * 1024);
    if (tamanhoMB > 5) {
      setErro('Arquivo excede o tamanho máximo de 5MB.');
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
    reader.onerror = () => setErro('Erro ao ler o arquivo.');
    reader.readAsDataURL(file);
  };

  const handleRemoverArquivo = () => {
    setArquivo(null);
    setNomeArquivo('');
    setMimeArquivo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');
    setSucesso('');

    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }

      if (!tipo || !data) {
        setErro('Tipo de registro e data são obrigatórios.');
        setCarregando(false);
        return;
      }

      const resposta = await fetch(`${API_URL}/api/pacientes/registros`, {
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
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      setErro('Erro de conexão com o servidor.');
      setCarregando(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-wrapper page-wrapper-sm">
        <div className="page-head">
          <div>
            <h1 className="page-title">Novo Registro de Saúde</h1>
            <p className="page-subtitle">Adicione um novo documento ou histórico médico</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline">
            Cancelar
          </button>
        </div>

        <div className="card p-6">
          {erro && <div className="alert alert-danger mb-5">{erro}</div>}
          {sucesso && <div className="alert alert-success mb-5">✓ {sucesso}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="field">
              <label className="label">Tipo de Registro</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="select"
                required
              >
                <option value="">Selecione...</option>
                <option value="exame">Exame (Sangue, Imagem, etc.)</option>
                <option value="receita">Receita Médica</option>
                <option value="medicamento">Medicamento em Uso</option>
                <option value="alergia">Alergia</option>
                <option value="doenca">Doença / Condição</option>
                <option value="cirurgia">Cirurgia</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="field">
                <label className="label">Data do Ocorrido / Exame</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div className="field">
                <label className="label">Órgão / Sistema (Opcional)</label>
                <input
                  type="text"
                  value={orgao}
                  onChange={(e) => setOrgao(e.target.value)}
                  placeholder="Ex: Coração, Pulmão, Pele..."
                  className="input"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Resumo Clínico do Laudo (Opcional, recomendado)</label>
              <textarea
                value={descricaoClinica}
                onChange={(e) => setDescricaoClinica(e.target.value)}
                placeholder="Ex: Hematócrito 52% (referência até 50%), hemoglobina normal, leucócitos sem alterações..."
                className="textarea"
                maxLength={8000}
              />
              <span className="hint">Esse texto melhora muito a qualidade dos insights de IA.</span>
            </div>

            {/* Upload */}
            <div>
              <label className="label mb-2 block">Arquivo de Documento (Opcional)</label>
              {arquivo ? (
                <div className="alert alert-success flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{nomeArquivo}</p>
                    <p className="text-xs text-muted">Arquivo selecionado</p>
                  </div>
                  <button type="button" onClick={handleRemoverArquivo} className="btn btn-outline btn-sm">
                    Remover
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[rgb(var(--border))] rounded-xl p-8 text-center bg-surface-2 hover:bg-[rgba(var(--primary),0.04)] cursor-pointer transition-colors"
                >
                  <svg className="mx-auto h-10 w-10 text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-muted mb-1">Clique para fazer upload</p>
                  <p className="text-xs text-muted">PDF, JPG ou PNG · Máx. 5MB</p>
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

            <div className="flex justify-end gap-3 pt-3 border-t border-[rgb(var(--border))]">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-outline">
                Cancelar
              </button>
              <button type="submit" disabled={carregando} className="btn btn-primary">
                {carregando ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
