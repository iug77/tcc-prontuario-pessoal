import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Login() {
  const navigate = useNavigate();

  // Estados para controlar a tela
  const [tipoUsuario, setTipoUsuario] = useState('paciente');
  const [isCadastro, setIsCadastro] = useState(false); // Alterna entre Login e Cadastro
  const [mensagem, setMensagem] = useState(''); // Para mostrar erros ou sucesso

  // Estados para capturar os dados do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [crm, setCrm] = useState('');
  const [especialidade, setEspecialidade] = useState('');

  // Função que é chamada quando o usuário clica no botão principal
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(''); // Limpa mensagens anteriores

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
          ...(tipoUsuario === 'profissional' ? { crm, especialidade } : {})
        };

        const resposta = await fetch(endpointCadastro, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        const dados = await resposta.json();

        if (resposta.ok) {
          setMensagem('Cadastro realizado com sucesso! Faça login para continuar.');
          setIsCadastro(false);
          setSenha('');
          setCrm('');
          setEspecialidade('');
        } else {
          setMensagem(dados.erro || 'Erro ao realizar cadastro.');
        }
      } catch (erro) {
        console.error("Erro na requisição:", erro);
        setMensagem('Erro de conexão com o servidor. O backend está rodando?');
      }

    } else {
      try {
        const endpointLogin =
          tipoUsuario === 'paciente'
            ? `${API_URL}/api/pacientes/login`
            : `${API_URL}/api/profissionais/login`;

        const resposta = await fetch(endpointLogin, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            senha
          })
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
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="card max-w-md w-full p-8 md:p-10">
        
        <div className="text-center mb-8">
          <h1 className="mb-2">Meu Prontuário</h1>
          <p className="text-gray-500">Acesse e controle seus dados de saúde</p>
        </div>

        {/* Seletor de Perfil */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8">
          <button
            type="button"
            onClick={() => setTipoUsuario('paciente')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tipoUsuario === 'paciente' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-gray-500 bg-transparent hover:text-gray-700'
            }`}
          >
            Sou Paciente
          </button>
          <button
            type="button"
            onClick={() => setTipoUsuario('profissional')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tipoUsuario === 'profissional' ? 'bg-white text-blue-600 shadow-md transform scale-[1.02]' : 'text-gray-500 bg-transparent hover:text-gray-700'
            }`}
          >
            Sou Profissional
          </button>
        </div>

        {/* Mensagem de Feedback (Erro ou Sucesso) */}
        {mensagem && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium text-center shadow-sm ${mensagem.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensagem}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* Campo NOME */}
          {isCadastro && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome Completo</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </div>
          )}

          {isCadastro && tipoUsuario === 'profissional' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CRM (Opcional)</label>
                <input
                  type="text"
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  placeholder="Ex: CRM-SP 123456"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Especialidade (Opcional)</label>
                <input
                  type="text"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  placeholder="Ex: Cardiologia"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
            <input 
              type="password" 
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full mt-6"
          >
            {isCadastro ? 'Finalizar Cadastro' : `Entrar como ${tipoUsuario === 'paciente' ? 'Paciente' : 'Profissional'}`}
          </button>
        </form>

        {/* Alternador de Cadastro/Login */}
        <p className="text-center text-sm text-gray-500 mt-8">
          {isCadastro ? 'Já tem uma conta?' : 'Não tem uma conta?'} {' '}
          <button
            type="button"
            onClick={() => setIsCadastro(!isCadastro)}
            className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
          >
            {isCadastro ? 'Faça Login' : 'Cadastre-se'}
          </button>
        </p>

      </div>
    </div>
  );
}


