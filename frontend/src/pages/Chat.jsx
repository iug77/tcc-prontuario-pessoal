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
  const [abaContatos, setAbaContatos] = useState('online');

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
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      
      {/* ================= BARRA LATERAL ESQUERDA (Contatos) ================= */}
      <aside className="w-80 bg-[#f8f9fa] flex flex-col border-r border-gray-200">
        
        {/* Cabeçalho do Usuário */}
        <div className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-gray-700 shadow-sm border border-gray-100">
            {iniciais(usuario?.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-800 truncate">{usuario?.nome || 'Usuário'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 capitalize">{usuario?.tipo || 'Conta'}</span>
              <span className="text-gray-300">•</span>
              <button 
                onClick={() => navigate(rotaVoltar)} 
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex px-4 border-b border-gray-200">
          <button
            onClick={() => setAbaContatos('online')}
            className={`flex-1 pb-3 pt-1 text-sm font-semibold border-b-2 transition-colors ${abaContatos === 'online' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Online Chats
          </button>
          <button
            onClick={() => setAbaContatos('historico')}
            className={`flex-1 pb-3 pt-1 text-sm font-semibold border-b-2 transition-colors ${abaContatos === 'historico' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Chat History
          </button>
        </div>

        {/* Lista de Contatos */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {carregandoContatos && <p className="text-sm text-gray-500 p-2 text-center">Carregando...</p>}
          
          {!carregandoContatos && contatos.length === 0 && (
            <p className="text-xs text-gray-500 p-2 text-center">Nenhum contato disponível.</p>
          )}

          {contatos.map((contato) => {
            const ativo = contato.id === contatoAtivoId;
            return (
              <button
                key={contato.id}
                onClick={() => setContatoAtivoId(contato.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${ativo ? 'bg-[#3b66d5] text-white shadow-md' : 'hover:bg-gray-100 text-gray-800'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${ativo ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                  {iniciais(contato.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{contato.nome}</h4>
                  <p className={`text-xs truncate mt-0.5 ${ativo ? 'text-blue-100' : 'text-gray-500'}`}>{contato.subtitulo}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ================= ÁREA CENTRAL (Mensagens) ================= */}
      <main className="flex-1 flex flex-col bg-white">
        
        {/* Histórico de Mensagens */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {erro && <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg text-sm">{erro}</div>}

          {!erro && !contatoAtivo && (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 font-medium">Selecione um contato para iniciar a conversa.</p>
            </div>
          )}

          {mensagens.map((mensagem) => {
            const minha = mensagem.remetenteTipo === usuario?.tipo;
            return (
              <div key={mensagem.id} className={`flex items-end gap-3 ${minha ? 'justify-end' : 'justify-start'}`}>
                
                {/* Avatar do Contato (Esquerda) */}
                {!minha && (
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                    {iniciais(contatoAtivo?.nome)}
                  </div>
                )}

                {/* Bolha da Mensagem */}
                <div className={`max-w-[65%] px-5 py-3 text-sm relative ${minha ? 'bg-[#3b66d5] text-white rounded-2xl rounded-br-sm' : 'bg-[#f1f3f5] text-gray-800 rounded-2xl rounded-bl-sm'}`}>
                  <p className="leading-relaxed">{mensagem.conteudo}</p>
                  <span className={`text-[10px] mt-1 block ${minha ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
                    {new Date(mensagem.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Avatar do Usuário (Direita - Opcional) */}
                {minha && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                    {iniciais(usuario?.nome)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Input de Envio */}
        <div className="p-6 bg-white">
          <form 
            onSubmit={enviarMensagem} 
            className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all bg-white"
          >
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              disabled={!contatoAtivo || enviando}
              className="flex-1 outline-none text-sm px-3 py-2 bg-transparent text-gray-700 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!contatoAtivo || enviando || !texto.trim()}
              className="bg-[#6b8cff] hover:bg-[#5a7bed] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-colors flex items-center justify-center shrink-0"
            >
              {/* Ícone de Enviar (Paper Plane) */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </main>

      {/* ================= BARRA LATERAL DIREITA (Detalhes) ================= */}
      <aside className="hidden lg:flex w-72 bg-white border-l border-gray-200 flex-col items-center pt-10 px-6">
        {contatoAtivo ? (
          <>
            {/* Avatar Grande */}
            <div className="w-24 h-24 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-3xl font-extrabold mb-4 shadow-sm">
              {iniciais(contatoAtivo.nome)}
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 text-center">{contatoAtivo.nome}</h2>
            <p className="text-sm text-gray-500 mb-8 mt-1">{contatoAtivo.subtitulo}</p>

            {/* Botões de Ação */}
            <div className="flex gap-2 w-full mb-10">
              <button disabled className="flex-1 py-2 px-3 border border-gray-200 rounded-md text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex justify-center items-center gap-2 opacity-50 cursor-not-allowed">
                Encaminhar
              </button>
              <button onClick={() => navigate(rotaVoltar)} className="flex-1 py-2 px-3 border border-gray-200 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                Fechar
              </button>
            </div>

            {/* Informações Extras (Other Detail) */}
            <div className="w-full">
              <h4 className="text-[11px] font-bold text-gray-400 mb-4 uppercase tracking-wider">Outros Detalhes</h4>
              
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-blue-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <span className="text-sm text-gray-600 font-medium break-all">{contatoAtivo.email || 'Não informado'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="mt-0.5 text-blue-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <span className="text-sm text-gray-600 font-medium capitalize">{tipoContatoLabel(contatoAtivo.tipo)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-gray-400 mt-10">
            Selecione um contato para visualizar o perfil.
          </div>
        )}
      </aside>

    </div>
  );
}