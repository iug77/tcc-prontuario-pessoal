import { API_URL } from '../config';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

export default function EditarRegistro() {
  const navigate = useNavigate();
  const { registroId } = useParams();
  const fileInputRef = useRef(null);

  const [tipo, setTipo] = useState('');
  const [data, setData] = useState('');
  const [orgao, setOrgao] = useState('');
  const [descricaoClinica, setDescricaoClinica] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [nomeArquivoAtual, setNomeArquivoAtual] = useState('');

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const carregar = async () => {
      try {
        const resposta = await fetch(`${API_URL}/api/pacientes/registros/${registroId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dados = await resposta.json();
        if (!resposta.ok) { setErro(dados.erro || 'Erro ao carregar registro.'); return; }

        const r = dados.registro;
        setTipo(r.tipo || '');
        setData(r.data ? new Date(r.data).toISOString().split('T')[0] : '');
        setOrgao(r.orgao || '');
        setDescricaoClinica(r.descricaoClinica || '');

        if (r.arquivoUrl) {
          setNomeArquivoAtual(r.arquivoNome || 'documento');
        }
      } catch {
        setErro('Erro de conexão ao carregar registro.');
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [registroId, navigate]);

  const handleArquivoSelecionado = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!tiposPermitidos.includes(file.type)) {
      setErro('Apenas PDF, JPG e PNG são permitidos.');
      return;
    }
    if (file.size / (1024 * 1024) > 5) {
      setErro('Arquivo excede o tamanho máximo de 5MB.');
      return;
    }

    setArquivo(file);
    setNomeArquivo(file.name);
    setErro('');
  };

  const handleRemoverNovoArquivo = () => {
    setArquivo(null);
    setNomeArquivo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/'); return; }

      if (!tipo || !data) {
        setErro('Tipo de registro e data são obrigatórios.');
        setSalvando(false);
        return;
      }

      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('data', data);
      formData.append('orgao', orgao || '');
      formData.append('descricaoClinica', descricaoClinica || '');
      if (arquivo) formData.append('arquivo', arquivo);

      const resposta = await fetch(`${API_URL}/api/pacientes/registros/${registroId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const textoResposta = await resposta.text();
      let dados = {};
      try { dados = textoResposta ? JSON.parse(textoResposta) : {}; } catch { dados = {}; }

      if (!resposta.ok) {
        setErro(dados.erro || 'Erro ao salvar alterações.');
        setSalvando(false);
        return;
      }

      setSucesso('Registro atualizado com sucesso!');

      // Regenera insight Gemini em background se houver conteúdo clínico
      if (descricaoClinica || arquivo) {
        fetch(`${API_URL}/api/pacientes/registros/${registroId}/insight/gerar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      setTimeout(() => navigate('/meus-registros', { state: { registroId } }), 1500);
    } catch {
      setErro('Erro de conexão com o servidor.');
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <AppLayout>
        <div className="page-wrapper page-wrapper-sm">
          <p className="text-muted text-sm text-center p-8">Carregando registro...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-wrapper page-wrapper-sm">
        <div className="page-head">
          <div>
            <h1 className="page-title">Editar Registro</h1>
            <p className="page-subtitle">Atualize as informações deste registro de saúde</p>
          </div>
          <button onClick={() => navigate('/meus-registros')} className="btn btn-outline">
            Cancelar
          </button>
        </div>

        <div className="card p-6">
          {erro && <div className="alert alert-danger mb-5">{erro}</div>}
          {sucesso && <div className="alert alert-success mb-5">✓ {sucesso}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="field">
              <label className="label">Tipo de Registro</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="select" required>
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
              <label className="label">Resumo Clínico do Laudo (Opcional)</label>
              <textarea
                value={descricaoClinica}
                onChange={(e) => setDescricaoClinica(e.target.value)}
                placeholder="Ex: Hematócrito 52%, hemoglobina normal, leucócitos sem alterações..."
                className="textarea"
                maxLength={8000}
              />
              <span className="hint">Esse texto melhora a qualidade dos insights de IA.</span>
            </div>

            <div>
              <label className="label mb-2 block">Arquivo de Documento</label>
              {arquivo ? (
                <div className="alert alert-success flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{nomeArquivo}</p>
                    <p className="text-xs text-muted">Novo arquivo selecionado</p>
                  </div>
                  <button type="button" onClick={handleRemoverNovoArquivo} className="btn btn-outline btn-sm">
                    Remover
                  </button>
                </div>
              ) : nomeArquivoAtual ? (
                <div className="alert flex items-center justify-between gap-3" style={{ background: 'rgb(var(--surface-2))', border: '1px solid rgb(var(--border))' }}>
                  <div>
                    <p className="font-semibold text-sm">{nomeArquivoAtual}</p>
                    <p className="text-xs text-muted">Arquivo atual · clique abaixo para substituir</p>
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline btn-sm">
                    Substituir
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[rgb(var(--border))] rounded-xl p-8 text-center bg-surface-2 hover:bg-[rgba(var(--primary),0.04)] cursor-pointer transition-colors"
                >
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
              <button type="button" onClick={() => navigate('/meus-registros')} className="btn btn-outline">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="btn btn-primary">
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
