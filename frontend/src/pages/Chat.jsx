import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const navigate = useNavigate();
  const [contatos, setContatos] = useState([]);
  const [contatoAtivoId, setContatoAtivoId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');
  const [carregandoContatos, setCarregandoContatos] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || '{}');
    } catch {
      return {};
    }
  }, []);

  const rotaVoltar = usuario?.tipo === 'profissional' ? '/dashboard-profissional' : '/dashboard';

  const contatoAtivo = contatos.find((item) => item.id === contatoAtivoId) || null;

  const carregarContatos = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    try {
      setErro('');
      setCarregandoContatos(true);

      const resposta = await fetch(`${API_URL}/api/chat/contatos`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível carregar os contatos.');
        return;
      }

      const lista = dados.contatos || [];
      setContatos(lista);

      if (lista.length > 0) {
        setContatoAtivoId((idAtual) => idAtual || lista[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar contatos do chat:', error);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setCarregandoContatos(false);
    }
  };

  const marcarMensagensComoLidas = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      await fetch(`${API_URL}/api/chat/marcar-lidas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  const carregarMensagens = async (contatoId) => {
    if (!contatoId) {
      setMensagens([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setErro('');

      const resposta = await fetch(`${API_URL}/api/chat/mensagens/${contatoId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível carregar as mensagens.');
        return;
      }

      setMensagens(dados.mensagens || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setErro('Erro de conexão com o servidor.');
    }
  };

  useEffect(() => {
    carregarContatos();
    marcarMensagensComoLidas();

    const intervalo = setInterval(() => {
      marcarMensagensComoLidas();
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    carregarMensagens(contatoAtivoId);
  }, [contatoAtivoId]);

  const enviarMensagem = async (e) => {
    e.preventDefault();

    if (!texto.trim() || !contatoAtivoId) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      setEnviando(true);
      setErro('');

      const resposta = await fetch(`${API_URL}/api/chat/mensagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contatoId: contatoAtivoId,
          conteudo: texto
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível enviar a mensagem.');
        return;
      }

      setTexto('');
      setMensagens((listaAtual) => [...listaAtual, dados.mensagem]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const iniciais = (nome = '') => {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('') || '??';
  };

  return (
    <div className="app-page">
      <div className="app-container max-w-6xl card overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Barra Lateral: Contatos */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[rgb(var(--border))] bg-surface-2 flex flex-col">
          <div className="p-4 border-b border-[rgb(var(--border))] bg-white flex justify-between items-center">
            <h2 className="text-lg font-extrabold tracking-tight">Mensagens</h2>
            <button 
              onClick={() => navigate(rotaVoltar)}
              className="btn btn-outline"
            >
              ← Voltar
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {carregandoContatos && <p className="text-sm text-muted p-2">Carregando contatos...</p>}

            {!carregandoContatos && contatos.length === 0 && (
              <p className="text-sm text-muted p-2">
                Nenhum contato disponível. O chat só é liberado com permissão ativa entre paciente e profissional.
              </p>
            )}

            {contatos.map((contato) => {
              const ativo = contato.id === contatoAtivoId;

              return (
                <button
                  key={contato.id}
                  type="button"
                  onClick={() => setContatoAtivoId(contato.id)}
                  className={`w-full text-left p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-colors border ${
                    ativo
                      ? 'bg-[rgba(var(--primary),0.08)] border-[rgba(var(--primary),0.18)]'
                      : 'bg-white border-transparent hover:bg-[rgba(var(--primary),0.05)]'
                  }`}
                >
                  <div className={`avatar ${ativo ? 'avatar-primary' : ''}`}>
                    {iniciais(contato.nome)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{contato.nome}</p>
                    <p className={`text-xs ${ativo ? 'text-primary' : 'text-muted'}`}>{contato.subtitulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Área Principal: Conversa */}
        <div className="w-full md:w-2/3 flex flex-col bg-white">
          
          {/* Cabeçalho da Conversa */}
          <div className="p-4 border-b border-[rgb(var(--border))] flex items-center gap-3">
            <div className="avatar avatar-primary">
              {iniciais(contatoAtivo?.nome)}
            </div>
            <div>
              <h3 className="font-bold">{contatoAtivo?.nome || 'Selecione um contato'}</h3>
              <p className="text-xs text-accent font-semibold">{contatoAtivo?.subtitulo || 'Sem conversa selecionada'}</p>
            </div>
          </div>

          {/* Histórico de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-2">
            {erro && <p className="text-sm text-danger">{erro}</p>}

            {!erro && contatoAtivo && mensagens.length === 0 && (
              <p className="text-sm text-muted">Sem mensagens ainda. Envie a primeira mensagem.</p>
            )}

            {mensagens.map((mensagem) => {
              const mensagemMinha = mensagem.remetenteTipo === usuario?.tipo;

              return (
                <div key={mensagem.id} className={`flex ${mensagemMinha ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`${mensagemMinha ? 'rounded-tr-none' : 'rounded-tl-none border border-[rgb(var(--border))] bg-surface'} p-3 rounded-2xl max-w-[70%] shadow-sm`}
                    style={mensagemMinha ? { background: 'rgb(var(--primary))', color: 'rgb(var(--primary-contrast))' } : undefined}
                  >
                    <p className="text-sm">{mensagem.conteudo}</p>
                    <p
                      className="text-xs mt-1 text-right"
                      style={mensagemMinha ? { color: 'rgba(255, 255, 255, 0.78)' } : { color: 'rgb(var(--muted-2))' }}
                    >
                      {new Date(mensagem.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campo de Digitação */}
          <div className="p-4 border-t border-[rgb(var(--border))] bg-white">
            <form className="flex gap-2" onSubmit={enviarMensagem}>
              <input 
                type="text" 
                placeholder="Digite sua mensagem..." 
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                disabled={!contatoAtivo || enviando}
                className="input flex-1 rounded-full"
              />
              <button 
                type="submit"
                disabled={!contatoAtivo || enviando}
                className="btn btn-primary"
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}


