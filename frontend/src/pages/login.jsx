import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Login() {
  const navigate = useNavigate();

  const [tipoUsuario, setTipoUsuario] = useState('paciente');
  const [isCadastro, setIsCadastro] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [crm, setCrm] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');

    if (isCadastro) {
      const endpointCadastro =
        tipoUsuario === 'paciente'
          ? `${API_URL}/api/pacientes`
          : `${API_URL}/api/profissionais`;

      try {
        const payload = {
          nome,
          email,
          senha,
          ...(telefone ? { telefone } : {}),
          ...(tipoUsuario === 'profissional' ? { crm, especialidade } : {})
        };

        const resposta = await fetch(endpointCadastro, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const dados = await resposta.json();

        if (resposta.ok) {
          setMensagem('Cadastro realizado com sucesso! Faça login para continuar.');
          setIsCadastro(false);
          setSenha('');
          setCrm('');
          setEspecialidade('');
          setTelefone('');
        } else {
          setMensagem(dados.erro || 'Erro ao realizar cadastro.');
        }
      } catch (erro) {
        console.error('Erro na requisição:', erro);
        setMensagem('Erro de conexão com o servidor.');
      }
    } else {
      try {
        const endpointLogin =
          tipoUsuario === 'paciente'
            ? `${API_URL}/api/pacientes/login`
            : `${API_URL}/api/profissionais/login`;

        const resposta = await fetch(endpointLogin, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
          const usuario = tipoUsuario === 'paciente' ? dados.paciente : dados.profissional;
          localStorage.setItem('token', dados.token);
          localStorage.setItem('usuario', JSON.stringify({ ...usuario, tipo: tipoUsuario }));
          navigate(tipoUsuario === 'paciente' ? '/dashboard' : '/dashboard-profissional');
        } else {
          setMensagem(dados.erro || 'Erro ao fazer login.');
        }
      } catch (erro) {
        console.error('Erro no login:', erro);
        setMensagem('Erro de conexão com o servidor.');
      }
    }
  };

  return (
    <div className="login-layout">

      {/* Painel da Marca */}
      <div className="login-panel-brand">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.30)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 3h6a2 2 0 0 1 2 2v16H7V5a2 2 0 0 1 2-2Z"
                  stroke="rgb(167,139,250)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 7h6M9 11h6M9 15h4"
                  stroke="rgb(167,139,250)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">Prontuário Pessoal</span>
          </div>

          {/* Tagline */}
          <h2 className="text-white font-extrabold text-2xl leading-snug tracking-tight mb-3">
            Seus dados de saúde,<br />no controle certo.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: '1.6' }}>
            Centralize seus registros médicos, compartilhe com segurança e mantenha um histórico completo da sua saúde.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-3">
            {[
              'Compartilhamento seguro com profissionais',
              'Histórico completo de registros médicos',
              'Comunicação direta com seu médico',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.35)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="rgb(167,139,250)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: '13.5px' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.30)', fontSize: '11.5px', lineHeight: '1.5' }}>
          Conforme a LGPD – Lei 13.709/2018 · Seus dados pertencem a você.
        </p>
      </div>

      {/* Painel do Formulário */}
      <div className="login-panel-form">
        <div style={{ maxWidth: 400, width: '100%' }}>

          <div className="mb-7">
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">
              {isCadastro ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h1>
            <p className="text-sm text-muted">
              {isCadastro
                ? 'Preencha os dados abaixo para começar.'
                : 'Entre para acessar seus registros de saúde.'}
            </p>
          </div>

          {/* Seletor de Tipo */}
          <div
            className="flex p-1 rounded-xl mb-6 border border-[rgb(var(--border))]"
            style={{ background: 'rgb(var(--surface-2))' }}
          >
            <button
              type="button"
              onClick={() => setTipoUsuario('paciente')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tipoUsuario === 'paciente'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted'
              }`}
            >
              Sou Paciente
            </button>
            <button
              type="button"
              onClick={() => setTipoUsuario('profissional')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tipoUsuario === 'profissional'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted'
              }`}
            >
              Sou Profissional
            </button>
          </div>

          {mensagem && (
            <div
              className={`alert mb-5 ${mensagem.includes('sucesso') ? 'alert-success' : 'alert-danger'}`}
            >
              {mensagem}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>

            {isCadastro && (
              <div className="field">
                <label className="label">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input"
                  placeholder="Ex: João da Silva"
                />
              </div>
            )}

            {isCadastro && (
              <div className="field">
                <label className="label">WhatsApp (Opcional)</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="input"
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>
            )}

            {isCadastro && tipoUsuario === 'profissional' && (
              <>
                <div className="field">
                  <label className="label">CRM (Opcional)</label>
                  <input
                    type="text"
                    value={crm}
                    onChange={(e) => setCrm(e.target.value)}
                    className="input"
                    placeholder="Ex: CRM-SP 123456"
                  />
                </div>
                <div className="field">
                  <label className="label">Especialidade (Opcional)</label>
                  <input
                    type="text"
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    className="input"
                    placeholder="Ex: Cardiologia"
                  />
                </div>
              </>
            )}

            <div className="field">
              <label className="label">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com"
              />
            </div>

            <div className="field">
              <label className="label">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 6 }}>
              {isCadastro
                ? 'Finalizar Cadastro'
                : `Entrar como ${tipoUsuario === 'paciente' ? 'Paciente' : 'Profissional'}`}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            {isCadastro ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => { setIsCadastro(!isCadastro); setMensagem(''); }}
              className="text-primary font-semibold hover:underline"
            >
              {isCadastro ? 'Faça Login' : 'Cadastre-se'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
