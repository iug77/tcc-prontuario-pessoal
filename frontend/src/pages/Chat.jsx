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

  const tipoContatoLabel = (tipo) => {
    if (tipo === 'paciente') return 'Paciente';
    if (tipo === 'profissional') return 'Profissional';
    return 'Contato';
  };

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
    <div className="container-main relative z-10">
      <div className="max-w-6xl mx-auto w-full">
        <div className="card p-0 overflow-hidden grid grid-cols-1 chat-grid min-h-[560px] h-[calc(100vh-10rem)]">
        
        {/* Barra Lateral: Contatos */}
        <aside className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
          <div className="px-6 py-7 bg-gradient-to-r from-white via-blue-50 to-white backdrop-blur-md flex justify-between items-center gap-3 shadow-sm">
            <h2 className="m-0 text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent tracking-tight">Mensagens</h2>
            <button
              type="button"
              onClick={() => navigate(rotaVoltar)}
              className="btn-link"
            >
              ← Voltar
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
            {carregandoContatos && <p className="text-sm text-gray-500 p-2">Carregando contatos...</p>}

            {!carregandoContatos && contatos.length === 0 && (
              <p className="text-sm text-gray-500 p-2">
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
                  className={`chat-contact ${ativo ? 'chat-contact--active' : ''}`}
                >
                  <div className={`chat-avatar ${ativo ? 'chat-avatar--active' : ''}`}>
                    {iniciais(contato.nome)}
                  </div>
                  <div>
                    <p className="m-0 font-bold text-gray-900 text-sm leading-5">{contato.nome}</p>
                    <p className={`m-0 mt-0.5 text-xs font-medium ${ativo ? 'text-blue-700' : 'text-gray-500'}`}>{contato.subtitulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Área Principal: Conversa */}
        <main className="flex flex-col bg-white">
          
          {/* Cabeçalho da Conversa */}
          <div className="px-8 py-7 bg-gradient-to-r from-white via-blue-50 to-white shadow-sm">
            <div className="flex items-center gap-4">
              <div className="chat-avatar chat-avatar--active text-lg">
                {iniciais(contatoAtivo?.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="m-0 font-extrabold text-gray-900 text-lg truncate">{contatoAtivo?.nome || 'Selecione um contato'}</h3>
                <p className="m-0 mt-1 text-sm text-gray-600 font-medium truncate">{contatoAtivo?.subtitulo || 'Sem conversa selecionada'}</p>
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-gray-400">Layout preview</div>
              <div className="inline-block mt-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-semibold">commit: 7ffc172</div>
            </div>
          </div>

          {/* Histórico de Mensagens */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 bg-white">
            {erro && <p className="text-base text-red-600 font-medium">{erro}</p>}

            {!erro && contatoAtivo && mensagens.length === 0 && (
              <p className="text-base text-gray-500">Sem mensagens ainda. Envie a primeira mensagem.</p>
            )}

            {!erro && !contatoAtivo && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <p className="m-0 text-gray-900 font-extrabold text-xl">Selecione um contato</p>
                  <p className="m-0 mt-3 text-base text-gray-500">Escolha alguém na lista para ver e enviar mensagens.</p>
                </div>
              </div>
            )}

            {mensagens.map((mensagem) => {
              const mensagemMinha = mensagem.remetenteTipo === usuario?.tipo;

              return (
                <div key={mensagem.id} className={`flex ${mensagemMinha ? 'justify-end' : 'justify-start'}`}>
                  <div className={`chat-bubble ${mensagemMinha ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
                    <p className="m-0 text-base leading-6">{mensagem.conteudo}</p>
                    <p className={`m-0 mt-2 text-xs text-right ${mensagemMinha ? 'text-blue-100/80' : 'text-gray-400'}`}>
                      {new Date(mensagem.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campo de Digitação */}
          <div className="px-8 py-6 bg-gradient-to-r from-white via-blue-50 to-white shadow-md shadow-blue-100/50 backdrop-blur-sm">
            <form className="flex items-end gap-3" onSubmit={enviarMensagem}>
              <input 
                type="text" 
                placeholder="Digite sua mensagem..." 
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                disabled={!contatoAtivo || enviando}
                className="chat-input flex-1 text-base"
              />
              <button 
                type="submit"
                disabled={!contatoAtivo || enviando}
                className="chat-send"
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>

        </main>

        {/* Painel de Detalhes */}
        <aside className="hidden lg:flex flex-col bg-gradient-to-br from-white via-blue-50 to-slate-50 shadow-lg">
          <div className="px-6 py-7 bg-gradient-to-r from-white via-blue-50 to-white shadow-sm">
            <h3 className="m-0 text-xl font-extrabold text-gray-900">Detalhes</h3>
            <p className="m-0 mt-2 text-sm text-gray-600 font-medium">Informações do contato</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {contatoAtivo ? (
              <div className="chat-details">
                <div className="chat-details__header">
                  <div className="chat-avatar chat-avatar--active chat-details__avatar">
                    {iniciais(contatoAtivo?.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="m-0 font-extrabold text-gray-900 text-lg leading-6 truncate">{contatoAtivo.nome}</p>
                    <p className="m-0 mt-1 text-sm text-gray-500 font-semibold truncate">{contatoAtivo.subtitulo}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="chat-badge">{tipoContatoLabel(contatoAtivo.tipo)}</span>
                    </div>
                  </div>
                </div>

                <div className="chat-details__section">
                  <p className="chat-details__label">E-mail</p>
                  <p className="chat-details__value">{contatoAtivo.email || 'Não informado'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">
                Selecione um contato para ver detalhes.
              </div>
            )}
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}


