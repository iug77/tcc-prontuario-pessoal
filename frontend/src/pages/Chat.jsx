import { API_URL } from '../config';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';

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

  const contatoAtivo = contatos.find((item) => item.id === contatoAtivoId) || null;

  const carregarContatos = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    try {
      setErro('');
      setCarregandoContatos(true);

      const resposta = await fetch(`${API_URL}/api/chat/contatos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível carregar os contatos.');
        return;
      }

      const lista = dados.contatos || [];
      setContatos(lista);
      if (lista.length > 0) setContatoAtivoId((idAtual) => idAtual || lista[0].id);
    } catch (error) {
      console.error('Erro ao carregar contatos do chat:', error);
      setErro('Erro de conexão com o servidor.');
    } finally {
      setCarregandoContatos(false);
    }
  };

  const marcarMensagensComoLidas = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/chat/marcar-lidas`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  const carregarMensagens = async (contatoId) => {
    if (!contatoId) { setMensagens([]); return; }

    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    try {
      setErro('');
      const resposta = await fetch(`${API_URL}/api/chat/mensagens/${contatoId}`, {
        headers: { Authorization: `Bearer ${token}` }
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
    if (!texto.trim() || !contatoAtivoId) return;

    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    try {
      setEnviando(true);
      setErro('');

      const resposta = await fetch(`${API_URL}/api/chat/mensagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contatoId: contatoAtivoId, conteudo: texto })
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
    return nome.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join('') || '??';
  };

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>
        <div className="card overflow-hidden flex flex-col md:flex-row w-full m-4 md:m-6" style={{ minHeight: 0 }}>

          {/* Barra Lateral: Contatos */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-[rgb(var(--border))] bg-surface-2 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-[rgb(var(--border))] bg-white">
              <h2 className="text-base font-extrabold tracking-tight">Mensagens</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {carregandoContatos && <p className="text-sm text-muted p-2">Carregando contatos...</p>}

              {!carregandoContatos && contatos.length === 0 && (
                <p className="text-sm text-muted p-2">
                  Nenhum contato disponível. O chat só é liberado com permissão ativa.
                </p>
              )}

              {contatos.map((contato) => {
                const ativo = contato.id === contatoAtivoId;

                return (
                  <button
                    key={contato.id}
                    type="button"
                    onClick={() => setContatoAtivoId(contato.id)}
                    className={`w-full text-left p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors border ${
                      ativo
                        ? 'bg-[rgba(var(--primary),0.08)] border-[rgba(var(--primary),0.18)]'
                        : 'bg-transparent border-transparent hover:bg-[rgba(var(--primary),0.04)]'
                    }`}
                  >
                    <div className={`avatar ${ativo ? 'avatar-primary' : ''} flex-shrink-0`}>
                      {iniciais(contato.nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{contato.nome}</p>
                      <p className={`text-xs truncate ${ativo ? 'text-primary' : 'text-muted'}`}>{contato.subtitulo}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área Principal: Conversa */}
          <div className="flex-1 flex flex-col bg-white min-w-0 min-h-0">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-[rgb(var(--border))] flex items-center gap-3 flex-shrink-0">
              <div className="avatar avatar-primary flex-shrink-0">
                {iniciais(contatoAtivo?.nome)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold truncate">{contatoAtivo?.nome || 'Selecione um contato'}</h3>
                <p className="text-xs text-muted truncate">{contatoAtivo?.subtitulo || 'Sem conversa selecionada'}</p>
              </div>
            </div>

            {/* Histórico */}
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
                      style={mensagemMinha ? { background: 'rgb(var(--primary))', color: 'white' } : undefined}
                    >
                      <p className="text-sm">{mensagem.conteudo}</p>
                      <p
                        className="text-xs mt-1 text-right"
                        style={mensagemMinha ? { color: 'rgba(255,255,255,0.75)' } : { color: 'rgb(var(--muted))' }}
                      >
                        {new Date(mensagem.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Campo de Digitação */}
            <div className="p-4 border-t border-[rgb(var(--border))] bg-white flex-shrink-0">
              <form className="flex gap-2" onSubmit={enviarMensagem}>
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  disabled={!contatoAtivo || enviando}
                  className="input flex-1"
                  style={{ borderRadius: 999 }}
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
    </AppLayout>
  );
}
