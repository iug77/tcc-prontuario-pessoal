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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Barra Lateral: Contatos */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Mensagens</h2>
            <button 
              onClick={() => navigate(rotaVoltar)}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              ← Voltar
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
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
                  className={`w-full text-left p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors border ${
                    ativo
                      ? 'bg-blue-50 border-blue-100'
                      : 'bg-white border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${ativo ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                    {iniciais(contato.nome)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{contato.nome}</p>
                    <p className={`text-xs ${ativo ? 'text-blue-600' : 'text-gray-500'}`}>{contato.subtitulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Área Principal: Conversa */}
        <div className="w-full md:w-2/3 flex flex-col bg-white">
          
          {/* Cabeçalho da Conversa */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold">
              {iniciais(contatoAtivo?.nome)}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{contatoAtivo?.nome || 'Selecione um contato'}</h3>
              <p className="text-xs text-green-500 font-medium">{contatoAtivo?.subtitulo || 'Sem conversa selecionada'}</p>
            </div>
          </div>

          {/* Histórico de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {erro && <p className="text-sm text-red-700">{erro}</p>}

            {!erro && contatoAtivo && mensagens.length === 0 && (
              <p className="text-sm text-gray-500">Sem mensagens ainda. Envie a primeira mensagem.</p>
            )}

            {mensagens.map((mensagem) => {
              const mensagemMinha = mensagem.remetenteTipo === usuario?.tipo;

              return (
                <div key={mensagem.id} className={`flex ${mensagemMinha ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${mensagemMinha ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'} p-3 rounded-2xl max-w-[70%] shadow-sm`}>
                    <p className="text-sm">{mensagem.conteudo}</p>
                    <p className={`text-xs mt-1 text-right ${mensagemMinha ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(mensagem.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campo de Digitação */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <form className="flex gap-2" onSubmit={enviarMensagem}>
              <input 
                type="text" 
                placeholder="Digite sua mensagem..." 
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                disabled={!contatoAtivo || enviando}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <button 
                type="submit"
                disabled={!contatoAtivo || enviando}
                className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors text-sm"
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


