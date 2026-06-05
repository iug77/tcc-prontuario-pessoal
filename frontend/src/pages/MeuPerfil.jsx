import { API_URL } from '../config';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function MeuPerfil() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editando, setEditando] = useState(false);

  const sessaoRaw = localStorage.getItem('usuario');
  const sessao = sessaoRaw ? JSON.parse(sessaoRaw) : null;
  const tipo = sessao?.tipo || 'paciente';

  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const endpoint = tipo === 'profissional'
      ? `${API_URL}/api/profissionais/perfil`
      : `${API_URL}/api/pacientes/perfil`;

    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.perfil) {
          setPerfil(data.perfil);
          setForm(perfilParaForm(data.perfil));
        } else {
          setErro('Não foi possível carregar o perfil.');
        }
      })
      .catch(() => setErro('Erro de conexão com o servidor.'))
      .finally(() => setCarregando(false));
  }, [navigate, tipo]);

  const perfilParaForm = (p) => ({
    nome: p.nome || '',
    telefone: p.telefone || '',
    bio: p.bio || '',
    foto: p.foto || '',
    dataNascimento: p.dataNascimento ? p.dataNascimento.split('T')[0] : '',
    tipoSanguineo: p.tipoSanguineo || '',
    alergias: p.alergias || '',
    crm: p.crm || '',
    especialidade: p.especialidade || '',
  });

  const iniciais = (nome = '') => {
    const partes = String(nome).trim().split(' ').filter(Boolean);
    return partes.slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) { setErro('A foto deve ter no máximo 1,5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, foto: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSalvar = async () => {
    const token = localStorage.getItem('token');
    setSalvando(true);
    setErro('');
    setSucesso('');

    const endpoint = tipo === 'profissional'
      ? `${API_URL}/api/profissionais/perfil`
      : `${API_URL}/api/pacientes/perfil`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setPerfil(data.perfil);
        setForm(perfilParaForm(data.perfil));
        setSucesso('Perfil atualizado com sucesso!');
        setEditando(false);
        const usuarioAtual = JSON.parse(localStorage.getItem('usuario') || '{}');
        localStorage.setItem('usuario', JSON.stringify({ ...usuarioAtual, nome: data.perfil.nome }));
      } else {
        setErro(data.erro || 'Erro ao salvar perfil.');
      }
    } catch {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    setForm(perfilParaForm(perfil));
    setEditando(false);
    setErro('');
  };

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  if (carregando) {
    return (
      <AppLayout>
        <div className="page-wrapper page-wrapper-sm flex items-center justify-center">
          <p className="text-muted text-sm">Carregando perfil...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-wrapper page-wrapper-sm space-y-6">
        <div className="page-head">
          <div>
            <h1 className="page-title">Meu Perfil</h1>
            <p className="page-subtitle">
              {tipo === 'profissional' ? 'Informações do profissional' : 'Informações do paciente'}
            </p>
          </div>
          {!editando && (
            <button
              type="button"
              onClick={() => { setEditando(true); setSucesso(''); setErro(''); }}
              className="btn btn-soft"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Editar
            </button>
          )}
        </div>

        {erro && <div className="alert alert-danger">{erro}</div>}
        {sucesso && <div className="alert alert-success">{sucesso}</div>}

        {/* Hero Avatar */}
        <section className="card p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              {(editando ? form.foto : perfil?.foto) ? (
                <img
                  src={editando ? form.foto : perfil.foto}
                  alt="Foto de perfil"
                  className="w-24 h-24 rounded-full object-cover border-4 border-[rgba(var(--primary),0.18)] shadow-md"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--info)))' }}
                >
                  {iniciais(editando ? form.nome : perfil?.nome)}
                </div>
              )}
              {editando && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-[rgb(var(--border))] shadow flex items-center justify-center hover:bg-surface-2 transition-colors"
                    title="Trocar foto"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                </>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              {editando ? (
                <input
                  type="text"
                  value={form.nome}
                  onChange={set('nome')}
                  className="input text-xl font-extrabold mb-1"
                  placeholder="Nome completo"
                />
              ) : (
                <h2 className="text-2xl font-extrabold tracking-tight">{perfil?.nome}</h2>
              )}
              <p className="text-sm text-muted mt-1">{perfil?.email}</p>

              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {tipo === 'profissional' && perfil?.especialidade && (
                  <span className="tag tag-primary">{perfil.especialidade}</span>
                )}
                {tipo === 'profissional' && perfil?.crmValidado && (
                  <span className="tag tag-success">CRM Validado</span>
                )}
                <span className="tag">
                  Membro desde{' '}
                  {new Date(perfil?.criadoEm).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Informações de Contato */}
        <section className="card p-6 space-y-5">
          <h2 className="text-base font-extrabold tracking-tight">Informações de Contato</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="label">WhatsApp / Telefone</label>
              {editando ? (
                <input type="tel" className="input" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999" />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm">{perfil?.telefone || <span className="text-muted italic">Não informado</span>}</p>
                  {perfil?.telefone && (
                    <a
                      href={`https://wa.me/55${perfil.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25D366] hover:text-[#128C7E] transition-colors"
                      title="Abrir WhatsApp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="field">
              <label className="label">E-mail</label>
              <p className="text-sm text-muted">{perfil?.email}</p>
              <span className="hint">O e-mail não pode ser alterado.</span>
            </div>
          </div>

          <div className="field">
            <label className="label">Bio / Sobre mim</label>
            {editando ? (
              <textarea
                className="textarea"
                value={form.bio}
                onChange={set('bio')}
                placeholder="Escreva um breve texto sobre você..."
                rows={3}
              />
            ) : (
              <p className="text-sm">{perfil?.bio || <span className="text-muted italic">Nenhuma bio cadastrada.</span>}</p>
            )}
          </div>
        </section>

        {/* Seção específica por tipo */}
        {tipo === 'profissional' ? (
          <section className="card p-6 space-y-5">
            <h2 className="text-base font-extrabold tracking-tight">Informações Profissionais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label className="label">CRM</label>
                {editando ? (
                  <input type="text" className="input" value={form.crm} onChange={set('crm')} placeholder="Ex: CRM-SP 123456" />
                ) : (
                  <p className="text-sm">{perfil?.crm || <span className="text-muted italic">Não informado</span>}</p>
                )}
              </div>
              <div className="field">
                <label className="label">Especialidade</label>
                {editando ? (
                  <input type="text" className="input" value={form.especialidade} onChange={set('especialidade')} placeholder="Ex: Cardiologia" />
                ) : (
                  <p className="text-sm">{perfil?.especialidade || <span className="text-muted italic">Não informada</span>}</p>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="card p-6 space-y-5">
            <h2 className="text-base font-extrabold tracking-tight">Informações de Saúde</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="field">
                <label className="label">Data de Nascimento</label>
                {editando ? (
                  <input type="date" className="input" value={form.dataNascimento} onChange={set('dataNascimento')} />
                ) : (
                  <p className="text-sm">
                    {perfil?.dataNascimento
                      ? new Date(perfil.dataNascimento).toLocaleDateString('pt-BR')
                      : <span className="text-muted italic">Não informada</span>}
                  </p>
                )}
              </div>

              <div className="field">
                <label className="label">Tipo Sanguíneo</label>
                {editando ? (
                  <select className="select" value={form.tipoSanguineo} onChange={set('tipoSanguineo')}>
                    <option value="">Selecione</option>
                    {TIPOS_SANGUINEOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <p className="text-sm">
                    {perfil?.tipoSanguineo
                      ? <span className="tag tag-danger">{perfil.tipoSanguineo}</span>
                      : <span className="text-muted italic">Não informado</span>}
                  </p>
                )}
              </div>

              <div className="field sm:col-span-1">
                <label className="label">Alergias conhecidas</label>
                {editando ? (
                  <textarea
                    className="textarea"
                    value={form.alergias}
                    onChange={set('alergias')}
                    placeholder="Ex: Penicilina, dipirona..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm">{perfil?.alergias || <span className="text-muted italic">Nenhuma registrada</span>}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {editando && (
          <div className="flex items-center justify-end gap-3 pb-4">
            <button type="button" onClick={handleCancelar} className="btn btn-outline" disabled={salvando}>
              Cancelar
            </button>
            <button type="button" onClick={handleSalvar} className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
