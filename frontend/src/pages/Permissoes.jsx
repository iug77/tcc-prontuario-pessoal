import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Permissoes() {
  const navigate = useNavigate();
  const [emailProfissional, setEmailProfissional] = useState('');
  const [nivelAcesso, setNivelAcesso] = useState('Apenas Leitura');
  const [expiracao, setExpiracao] = useState('7d');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [permissoes, setPermissoes] = useState([]);

  const obterToken = () => localStorage.getItem('token');

  const calcularExpiracao = (valor) => {
    if (valor === 'nunca') {
      return null;
    }

    const data = new Date();
    const horas = {
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30
    }[valor];

    data.setHours(data.getHours() + (horas || 0));
    return data.toISOString();
  };

  const formatarExpiracao = (dataIso) => {
    if (!dataIso) {
      return 'Nunca expira';
    }

    return new Date(dataIso).toLocaleDateString('pt-BR');
  };

  const carregarPermissoes = async () => {
    const token = obterToken();

    if (!token) {
      navigate('/');
      return;
    }

    try {
      setErro('');
      const resposta = await fetch(`${API_URL}/api/pacientes/permissoes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'NÃ£o foi possÃ­vel carregar permissÃµes.');
        if (resposta.status === 401 || resposta.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          navigate('/');
        }
        return;
      }

      setPermissoes(dados.permissoes || []);
    } catch (error) {
      console.error('Erro ao carregar permissÃµes:', error);
      setErro('Erro de conexÃ£o com o servidor.');
    }
  };

  useEffect(() => {
    carregarPermissoes();
  }, []);

  const handleConceder = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    const token = obterToken();
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setCarregando(true);
      const resposta = await fetch(`${API_URL}/api/pacientes/permissoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          profissionalEmail: emailProfissional,
          nivelAcesso,
          expiraEm: calcularExpiracao(expiracao)
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'NÃ£o foi possÃ­vel conceder a permissÃ£o.');
        return;
      }

      setMensagem('PermissÃ£o concedida com sucesso.');
      setEmailProfissional('');
      await carregarPermissoes();
    } catch (error) {
      console.error('Erro ao conceder permissÃ£o:', error);
      setErro('Erro de conexÃ£o com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRevogar = async (permissaoId) => {
    const token = obterToken();
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/api/pacientes/permissoes/${permissaoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'NÃ£o foi possÃ­vel revogar a permissÃ£o.');
        return;
      }

      setMensagem('PermissÃ£o revogada com sucesso.');
      await carregarPermissoes();
    } catch (error) {
      console.error('Erro ao revogar permissÃ£o:', error);
      setErro('Erro de conexÃ£o com o servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CabeÃ§alho */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">GestÃ£o de PermissÃµes</h1>
            <p className="text-gray-500">Controle quem tem acesso ao seu prontuÃ¡rio</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:underline font-medium"
          >
            â† Voltar ao Painel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Coluna Esquerda: Novo Compartilhamento */}
          <div className="md:col-span-1 bg-white rounded-xl shadow-sm p-6 h-fit border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Acesso</h2>
            <form className="space-y-4" onSubmit={handleConceder}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do Profissional</label>
                <input 
                  type="email" 
                  placeholder="medico@hospital.com"
                  required
                  value={emailProfissional}
                  onChange={(e) => setEmailProfissional(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NÃ­vel de Acesso</label>
                <select
                  value={nivelAcesso}
                  onChange={(e) => setNivelAcesso(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Apenas Leitura">Apenas Leitura</option>
                  <option value="Leitura e Escrita">Leitura e Escrita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ExpiraÃ§Ã£o do Link</label>
                <select
                  value={expiracao}
                  onChange={(e) => setExpiracao(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="24h">Em 24 horas</option>
                  <option value="7d">Em 7 dias</option>
                  <option value="30d">Em 30 dias</option>
                  <option value="nunca">Nunca expira</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={carregando}
                className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors mt-2"
              >
                {carregando ? 'Salvando...' : 'Gerar Convite'}
              </button>
            </form>

            {mensagem && <p className="text-green-700 text-sm mt-3">{mensagem}</p>}
            {erro && <p className="text-red-700 text-sm mt-3">{erro}</p>}
          </div>

          {/* Coluna Direita: Acessos Ativos */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Profissionais com Acesso Ativo</h2>
            
            <div className="space-y-4">
              {permissoes.length === 0 && (
                <p className="text-sm text-gray-500">VocÃª ainda nÃ£o concedeu permissÃµes.</p>
              )}

              {permissoes.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.profissional.nome} {item.profissional.especialidade ? `(${item.profissional.especialidade})` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Acesso: {item.nivelAcesso} â€¢ Expira em: {formatarExpiracao(item.expiraEm)} â€¢ Status: {item.status}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevogar(item.id)}
                    disabled={item.status !== 'Ativo'}
                    className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-200 rounded bg-white hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Revogar Acesso
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


