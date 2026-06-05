import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function PerfilPaciente() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    fetch(`${API_URL}/api/pacientes/${id}/perfil`, {
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

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return null;
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
  };

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
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">Voltar</button>
        </div>
      </div>
    );
  }

  const idade = calcularIdade(perfil?.dataNascimento);

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
            <span className="tag">Paciente</span>
          </div>
        </header>

        {/* Hero */}
        <section className="card overflow-hidden">
          <div
            className="h-24"
            style={{ background: 'linear-gradient(135deg, rgba(var(--accent),0.15), rgba(var(--primary),0.10))' }}
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
                    style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--primary)))' }}
                  >
                    {iniciais(perfil.nome)}
                  </div>
                )}
                <div className="mb-1">
                  <h1 className="text-xl font-extrabold tracking-tight">{perfil.nome}</h1>
                  {idade !== null && (
                    <p className="text-sm text-muted">{idade} anos</p>
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
                  onClick={() => navigate('/visualizador', { state: { pacienteId: id } })}
                  className="btn btn-soft gap-2"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M9 3h6a2 2 0 0 1 2 2v16H7V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Prontuário
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="btn btn-outline gap-2"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">Registros</p>
            <p className="text-2xl font-extrabold">{perfil._count?.registros ?? '—'}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">Tipo Sanguíneo</p>
            <p className="text-2xl font-extrabold text-[rgb(var(--danger))]">{perfil.tipoSanguineo || '—'}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">Nascimento</p>
            <p className="font-extrabold text-sm">
              {perfil.dataNascimento
                ? new Date(perfil.dataNascimento).toLocaleDateString('pt-BR')
                : '—'}
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">Paciente desde</p>
            <p className="font-extrabold text-sm">
              {new Date(perfil.criadoEm).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Alergias */}
        {perfil.alergias && (
          <section className="card p-6 strip-danger">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[rgb(var(--danger))]">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h2 className="text-sm font-extrabold tracking-tight text-[rgb(var(--danger))]">Alergias conhecidas</h2>
            </div>
            <p className="text-sm leading-relaxed">{perfil.alergias}</p>
          </section>
        )}

        {/* Bio */}
        {perfil.bio && (
          <section className="card p-6">
            <h2 className="text-sm font-extrabold tracking-tight text-muted uppercase mb-3">Observações / Bio</h2>
            <p className="text-sm leading-relaxed">{perfil.bio}</p>
          </section>
        )}

        {/* Contato */}
        <section className="card p-6">
          <h2 className="text-sm font-extrabold tracking-tight text-muted uppercase mb-3">Contato</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted flex-shrink-0">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{perfil.email}</span>
            </div>
            {perfil.telefone && (
              <div className="flex items-center gap-3 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366] flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                <span>{perfil.telefone}</span>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
