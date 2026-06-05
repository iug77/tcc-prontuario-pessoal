import { API_URL } from '../config';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

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
    if (valor === 'nunca') return null;

    const data = new Date();
    const horas = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 }[valor];
    data.setHours(data.getHours() + (horas || 0));
    return data.toISOString();
  };

  const formatarExpiracao = (dataIso) => {
    if (!dataIso) return 'Nunca expira';
    return new Date(dataIso).toLocaleDateString('pt-BR');
  };

  const carregarPermissoes = async () => {
    const token = obterToken();
    if (!token) { navigate('/'); return; }

    try {
      setErro('');
      const resposta = await fetch(`${API_URL}/api/pacientes/permissoes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível carregar permissões.');
        if (resposta.status === 401 || resposta.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          navigate('/');
        }
        return;
      }

      setPermissoes(dados.permissoes || []);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      setErro('Erro de conexão com o servidor.');
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
    if (!token) { navigate('/'); return; }

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
        setErro(dados.erro || 'Não foi possível conceder a permissão.');
        return;
      }

      setMensagem('Permissão concedida com sucesso.');
      setEmailProfissional('');
      await carregarPermissoes();
    } catch (error) {
      console.error('Erro ao conceder permissão:', error);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRevogar = async (permissaoId) => {
    const token = obterToken();
    if (!token) { navigate('/'); return; }

    try {
      const resposta = await fetch(`${API_URL}/api/pacientes/permissoes/${permissaoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível revogar a permissão.');
        return;
      }

      setMensagem('Permissão revogada com sucesso.');
      await carregarPermissoes();
    } catch (error) {
      console.error('Erro ao revogar permissão:', error);
      setErro('Erro de conexão com o servidor.');
    }
  };

  return (
    <AppLayout>
      <div className="page-wrapper page-wrapper-md">
        <div className="page-head">
          <div>
            <h1 className="page-title">Gestão de Permissões</h1>
            <p className="page-subtitle">Controle quem tem acesso ao seu prontuário</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Novo Compartilhamento */}
          <div className="md:col-span-1 card p-6 h-fit">
            <h2 className="text-base font-extrabold tracking-tight mb-4">Novo Acesso</h2>
            <form className="space-y-4" onSubmit={handleConceder}>
              <div className="field">
                <label className="label">E-mail do Profissional</label>
                <input
                  type="email"
                  placeholder="medico@hospital.com"
                  required
                  value={emailProfissional}
                  onChange={(e) => setEmailProfissional(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label className="label">Nível de Acesso</label>
                <select
                  value={nivelAcesso}
                  onChange={(e) => setNivelAcesso(e.target.value)}
                  className="select"
                >
                  <option value="Apenas Leitura">Apenas Leitura</option>
                  <option value="Leitura e Escrita">Leitura e Escrita</option>
                </select>
              </div>

              <div className="field">
                <label className="label">Expiração do Acesso</label>
                <select
                  value={expiracao}
                  onChange={(e) => setExpiracao(e.target.value)}
                  className="select"
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
                className="btn btn-primary w-full mt-2"
              >
                {carregando ? 'Salvando...' : 'Gerar Convite'}
              </button>
            </form>

            {mensagem && <p className="text-success text-sm mt-3 font-semibold">{mensagem}</p>}
            {erro && <p className="text-danger text-sm mt-3 font-semibold">{erro}</p>}
          </div>

          {/* Coluna Direita: Acessos Ativos */}
          <div className="md:col-span-2 card p-6">
            <h2 className="text-base font-extrabold tracking-tight mb-4">Profissionais com Acesso Ativo</h2>

            <div className="space-y-3">
              {permissoes.length === 0 && (
                <p className="text-sm text-muted">Você ainda não concedeu permissões.</p>
              )}

              {permissoes.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-[rgb(var(--border))] rounded-xl bg-surface-2"
                >
                  <div>
                    <p className="font-semibold">
                      {item.profissional.nome}
                      {item.profissional.especialidade ? ` (${item.profissional.especialidade})` : ''}
                    </p>
                    <p className="text-sm text-muted mt-0.5">
                      Acesso: <span className="font-medium">{item.nivelAcesso}</span>
                      {' · '}Expira: {formatarExpiracao(item.expiraEm)}
                      {' · '}
                      <span className={item.status === 'Ativo' ? 'text-success' : 'text-danger'}>
                        {item.status}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevogar(item.id)}
                    disabled={item.status !== 'Ativo'}
                    className="btn btn-danger"
                  >
                    Revogar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
