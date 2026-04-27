import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
          ? 'http://localhost:3000/api/pacientes'
          : 'http://localhost:3000/api/profissionais';

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
            ? 'http://localhost:3000/api/pacientes/login'
            : 'http://localhost:3000/api/profissionais/login';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Meu Prontuário</h1>
          <p className="text-gray-500">Acesse e controle seus dados de saúde</p>
        </div>

        {/* Seletor de Perfil */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setTipoUsuario('paciente')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tipoUsuario === 'paciente' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sou Paciente
          </button>
          <button
            type="button"
            onClick={() => setTipoUsuario('profissional')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tipoUsuario === 'profissional' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sou Profissional
          </button>
        </div>

        {/* Mensagem de Feedback (Erro ou Sucesso) */}
        {mensagem && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium text-center ${mensagem.includes('sucesso') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {mensagem}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Campo NOME (Aparece em cadastro de paciente e profissional) */}
          {isCadastro && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: João da Silva"
              />
            </div>
          )}

          {isCadastro && tipoUsuario === 'profissional' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CRM (Opcional)</label>
                <input
                  type="text"
                  value={crm}
                  onChange={(e) => setCrm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: CRM-SP 123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade (Opcional)</label>
                <input
                  type="text"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Cardiologia"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-4"
          >
            {isCadastro ? 'Finalizar Cadastro' : `Entrar como ${tipoUsuario === 'paciente' ? 'Paciente' : 'Profissional'}`}
          </button>
        </form>

        {/* Alternador de Cadastro/Login */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {isCadastro ? 'Já tem uma conta?' : 'Não tem uma conta?'} {' '}
          <button
            onClick={() => setIsCadastro(!isCadastro)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isCadastro ? 'Faça Login' : 'Cadastre-se'}
          </button>
        </p>

      </div>
    </div>
  );
}