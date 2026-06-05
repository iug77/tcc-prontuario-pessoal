import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function PerfilProfissional() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [perfil, setPerfil] = useState(null);

  const sessaoRaw = localStorage.getItem('usuario');
  const sessao = sessaoRaw ? JSON.parse(sessaoRaw) : null;
  const tipo = sessao?.tipo || 'paciente';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    fetch(`${API_URL}/api/profissionais/${id}/perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.perfil) {
          setPerfil(data.perfil);
        } else {
          setErro(data.erro || 'Perfil não encontrado.');
        }
      })
      .catch(() => setErro('Erro de conexão com o servidor.'))
      .finally(() => setCarregando(false));
  }, [id, navigate]);

  const iniciais = (nome = '') => {
    const partes = String(nome).trim().split(' ').filter(Boolean);
    return partes.slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
  };

  const abrirWhatsApp = (telefone) => {
    const numero = telefone.replace(/\D/g, '');
    const formatado = numero.startsWith('55') ? numero : `55${numero}`;
    window.open(`https://wa.me/${formatado}`, '_blank', 'noopener,noreferrer');
  };

  const rotaVoltar = tipo === 'profissional' ? '/dashboard-profissional' : '/dashboard';

  if (carregando) {
    return (
      <div className="app-page flex items-center justify-center">
        <p className="text-muted text-sm">Carregando perfil...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="card p-8 text-center max-w-sm w-full">
          <p className="font-extrabold tracking-tight mb-2">Perfil indisponível</p>
          <p className="text-sm text-muted mb-4">{erro}</p>
          <button type="button" onClick={() => navigate(rotaVoltar)} className="btn btn-outline">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-container max-w-2xl space-y-6">

        {/* Header */}
        <header className="card border-0 shadow-sm">
          <div className="card-header">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline border-transparent bg-transparent hover:bg-surface-2 gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Voltar
            </button>
            <span className="tag">Profissional de Saúde</span>
          </div>
        </header>

        {/* Hero */}
        <section className="card overflow-hidden">
          <div
            className="h-24"
            style={{ background: 'linear-gradient(135deg, rgba(var(--primary),0.15), rgba(var(--accent),0.12))' }}
          />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
              <div className="flex items-end gap-4">
                {perfil.foto ? (
                  <img
                    src={perfil.foto}
                    alt={perfil.nome}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white border-4 border-white shadow-md flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--accent)))' }}
                  >
                    {iniciais(perfil.nome)}
                  </div>
                )}
                <div className="mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-extrabold tracking-tight">{perfil.nome}</h1>
                    {perfil.crmValidado && (
                      <span className="tag tag-success text-xs">Verificado</span>
                    )}
                  </div>
                  {perfil.especialidade && (
                    <p className="text-sm text-muted">{perfil.especialidade}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {perfil.telefone && (
                  <button
                    type="button"
                    onClick={() => abrirWhatsApp(perfil.telefone)}
                    className="btn btn-success gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="btn btn-soft gap-2"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Mensagem
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">CRM</p>
            <p className="font-extrabold">{perfil.crm || '—'}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">Especialidade</p>
            <p className="font-extrabold">{perfil.especialidade || '—'}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">Membro desde</p>
            <p className="font-extrabold">
              {new Date(perfil.criadoEm).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Bio */}
        {perfil.bio && (
          <section className="card p-6">
            <h2 className="text-sm font-extrabold tracking-tight text-muted uppercase mb-3">Sobre</h2>
            <p className="text-sm leading-relaxed">{perfil.bio}</p>
          </section>
        )}

        {/* Telefone detalhado */}
        {perfil.telefone && (
          <section className="card p-6">
            <h2 className="text-sm font-extrabold tracking-tight text-muted uppercase mb-3">Contato</h2>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[rgba(var(--success),0.1)] flex items-center justify-center text-[rgb(var(--success))]">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </div>
              <span className="text-sm font-medium">{perfil.telefone}</span>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
