"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { supabase } from "@/integrations/supabase/client";
import { loadUnreadBackup, syncWithServer, markChatAsRead, incrementUnreadCount } from "@/utils/unreadBackup";

// 🔧 Adjust these imports to your project:
import { useConnections } from "@/contexts/ConnectionsContext"; // Still depends on ConnectionsContext

// Debug: verificar configuração do Supabase
console.log('🔍 useWhatsAppConversations - Supabase config:', {
  client: supabase ? 'created' : 'failed',
  env: {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
  }
});

// Socket / API base
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:3000";
const API_URL =
  import.meta.env.VITE_API_URL?.trim() || SOCKET_URL;

const mapType = (ui: 'TEXTO'|'IMAGEM'|'VIDEO'|'AUDIO'|'ARQUIVO') =>
  ui === 'TEXTO' ? 'text'
: ui === 'IMAGEM' ? 'image'
: ui === 'VIDEO'  ? 'video'
: ui === 'AUDIO'  ? 'audio'
: 'document';

/* ============================
   Types
============================ */
export type WhatsAppMessage = {
  id?: string;
  message_id?: string;
  owner_id?: string;
  connection_id?: string;
  connection_phone?: string;
  chat_id: string;                 // e.g. 55999...@s.whatsapp.net
  phone?: string;           // e.g. 55999...
  conteudo?: string;
  message_type?: string;           // TEXTO, IMAGEM, VIDEO, etc.
  media_type?: string;
  media_url?: string;
  media_mime?: string;
  duration_ms?: number;
  remetente?: "CLIENTE" | "OPERADOR" | "AI";
  status?: string;                 // AGUARDANDO, ATENDIDO, AI...
  lida?: boolean;
  timestamp: string | Date;
};

export type RawConversation = {
  id?: string;
  owner_id?: string;
  connection_id?: string;
  connection_phone?: string;
  chat_id: string;
  nome_cliente?: string;
  numero_cliente: string;
  status?: string;

  // Either snake or camel may appear from your API:
  last_message?: WhatsAppMessage | null;
  lastMessage?: WhatsAppMessage | null;
  lastMessageAt?: string;
  unread?: number;
  unread_count?: number;

  // Optional server side aggregation:
  total_messages?: number;

  // (Optional) embedded messages if your API returns them
  messages?: WhatsAppMessage[];
};

export type Conversation = {
  id: string;
  owner_id?: string;
  connection_id?: string;
  connection_phone?: string;
  chat_id: string;
  nome_cliente: string;
  numero_cliente: string;
  status?: string;
  lastMessageAt?: string;
  lastMessage?: WhatsAppMessage | null;
  lastMessagePreview?: string;
  unread: number;
  total_messages?: number;
  messages?: WhatsAppMessage[];
  // Novos campos para exibição correta
  last_message_remetente?: string;
  last_message_tipo?: string;
  last_message_lida?: boolean;
};

type HookReturn = {
  conversations: Conversation[];
  messages: WhatsAppMessage[];
  activeConversation: Conversation | null;
  setActiveConversation: (c: Conversation | null) => void;

  loading: boolean;
  error: string | null;
  connected: boolean;

  connectSocket: (ownerId: string) => void;
  disconnectSocket: () => void;

  loadConversations: (ownerId: string) => Promise<void>;
  loadMessages: (chatId: string, ownerId: string) => Promise<void>;

  joinConversation: (chatId: string) => void;
  leaveConversation: (chatId: string) => void;

  markAsRead: (chatId: string) => void;
  markConversationRead: (chatId: string) => Promise<void>;
  onSelectConversation: (chatId: string) => Promise<void>;
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
  selectConversation: (chatId: string, opts?: { localMarkRead?: boolean }) => void;
  sendMessageTo: (chatId: string, text: string, uiType?: 'TEXTO'|'IMAGEM'|'VIDEO'|'AUDIO'|'ARQUIVO', mediaUrl?: string) => Promise<void>;
  sendMessage: (text: string, type?: "TEXTO" | string, extra?: Record<string, any>) => Promise<void>;
  clearMessagesCache: () => void;
  registerWhatsAppContact: (contactData: { phone: string; name?: string; owner_id: string }) => Promise<any>;
  updateContactName: (contactId: string, name: string, ownerId: string) => Promise<any>;
  setMessages: (messages: WhatsAppMessage[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  
  // Interface compatível com ConversationsList
  items: Conversation[];
  reload: () => Promise<void>;
  markRead: (conversationId: string) => void;
};

/* ============================
   Helpers
============================ */
function normalizeConversation(raw: RawConversation): Conversation {
  const lastMsg = (raw.last_message ?? raw.lastMessage) || null;
  const lastAt =
    (raw as any).last_message?.timestamp ||
    (raw as any).lastMessageAt ||
    (lastMsg?.timestamp as string | undefined);

  return {
    id: raw.id ?? raw.chat_id,
    owner_id: raw.owner_id,
    connection_id: raw.connection_id,
    connection_phone: raw.connection_phone,
    chat_id: raw.chat_id,
    nome_cliente: (() => {
      const name = raw.nome_cliente || raw.numero_cliente || "Contato";
      console.log('🔍 [FRONTEND-NAMES] Mapeando nome do contato:', {
        chat_id: raw.chat_id,
        nome_cliente: raw.nome_cliente,
        numero_cliente: raw.numero_cliente,
        final_name: name
      });
      return name;
    })(),
    numero_cliente: raw.numero_cliente,
    status: raw.status,
    lastMessageAt: lastAt ? String(lastAt) : undefined,
    lastMessage: lastMsg || null,
    unread:
      typeof raw.unread_count === "number"
        ? raw.unread_count
        : typeof raw.unread === "number"
        ? raw.unread
        : 0,
    total_messages: raw.total_messages,
    messages: raw.messages || [],
  };
}

function uniqById<T extends { id?: string; message_id?: string }>(arr: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const k = (it.id || it.message_id || JSON.stringify(it)) as string;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}

/* ============================
   Hook
============================ */
export function useWhatsAppConversations(params?: { connectionId?: string; ownerId?: string; socket?: any }): HookReturn {
  const { activeConnection } = useConnections(); // must provide id + phoneNumber on that context
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  
  // Cache de mensagens por conversa para evitar recarregamentos
  const [messagesCache, setMessagesCache] = useState<Record<string, WhatsAppMessage[]>>({});

  const socketRef = useRef<Socket | null>(null);
  const joinedRoomRef = useRef<string | null>(null);
  const currentRoomRef = useRef<string | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);

  /* ---------- Socket ---------- */
  const connectSocket = useCallback((ownerId: string) => {
    // Avoid multiple instances
    if (socketRef.current) {
      console.log('⚠️ Socket já existe, não criando novo');
      return;
    }

    console.log('🔌 Conectando socket...', { SOCKET_URL, ownerId });
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      path: "/socket.io", // adjust if custom
      auth: { ownerId },
    });

    s.on("connect", () => {
      console.log('✅ ===== SOCKET CONECTADO COM SUCESSO =====');
      console.log('✅ Socket ID:', s.id);
      console.log('✅ Owner ID:', ownerId);
      console.log('✅ SOCKET_URL:', SOCKET_URL);
      console.log('✅ Active Connection:', activeConnection?.id);
      setConnected(true);
      
      // Entrar na sala da conexão para receber atualizações gerais
      if (activeConnection?.id) {
        s.emit('joinConnection', { connectionId: activeConnection.id });
        console.log('🔌 Entrando na sala da conexão:', activeConnection.id);
      } else {
        console.log('⚠️ Nenhuma conexão ativa para entrar na sala');
      }
    });
    
    s.on("disconnect", (reason) => {
      console.log('❌ Socket desconectado:', reason);
      setConnected(false);
    });

    s.on("connect_error", (error) => {
      console.error('❌ ===== ERRO DE CONEXÃO DO SOCKET =====');
      console.error('❌ Erro:', error);
      console.error('❌ SOCKET_URL:', SOCKET_URL);
      setConnected(false);
    });

    // Listener para debug de todos os eventos
    s.onAny((eventName, ...args) => {
      if (eventName === 'newMessage') {
        console.log('🔍 ===== EVENTO NEWMESSAGE RECEBIDO =====');
        console.log('🔍 Evento:', eventName);
        console.log('🔍 Args:', args);
        console.log('🔍 Dados da mensagem:', args[0]);
      } else if (eventName === 'conversation:updated') {
        console.log('🔍 ===== EVENTO CONVERSATION:UPDATED RECEBIDO VIA ONANY =====');
        console.log('🔍 Evento:', eventName);
        console.log('🔍 Args:', args);
      }
    });

    // Listener para teste de conexão
    s.on('test-connection', (data) => {
      console.log('🧪 ===== TESTE DE CONEXÃO RECEBIDO =====');
      console.log('🧪 Mensagem:', data.message);
      console.log('🧪 Timestamp:', data.timestamp);
    });

      // Server emits when a conversation changes (new msg, status change...)
      s.on("conversation:updated", (payload: any) => {
        console.log('🔄 ===== CONVERSATION:UPDATED RECEBIDO =====');
        console.log('🔄 Payload:', payload);
        console.log('🔄 Conversation ID:', payload.conversationId);
        console.log('🔄 Last Message:', payload.last_message);
        console.log('🔄 Preview:', payload.preview);
        
        setConversations(prev => {
          console.log('🔄 Conversas atuais:', prev.length);
          console.log('🔄 Conversas:', prev.map(c => ({ chat_id: c.chat_id, lastMessage: c.lastMessage })));
          
          // Try to merge by chat_id
          const idx = prev.findIndex(c => c.chat_id === payload.conversationId || c.chat_id === payload.chat_id);
          console.log('🔄 Índice encontrado:', idx);
          
          if (idx === -1) {
            console.log('⚠️ Conversa não encontrada, criando nova...');
            // Criar nova conversa se não existir
            const newConversation: Conversation = {
              id: payload.conversationId || payload.chat_id,
              chat_id: payload.conversationId || payload.chat_id,
              nome_cliente: payload.nome_cliente || 'Contato',
              numero_cliente: payload.conversationId || payload.chat_id,
              lastMessageAt: payload.lastMessageAt || payload.last_message?.timestamp,
              lastMessage: payload.last_message,
              lastMessagePreview: payload.preview || payload.last_message?.conteudo,
              unread: payload.unread_count || payload.unread || 0,
              status: 'aguardando'
            };
            return [newConversation, ...prev];
          }
          
          const copy = prev.slice();
          const target = copy[idx];
          console.log('🔄 Conversa atual:', target);

          const lastMessageAt = payload.lastMessageAt || payload.last_message?.timestamp || target.lastMessageAt;
          const lastMessage = payload.last_message || target.lastMessage;
          const lastMessagePreview = payload.preview || payload.last_message?.conteudo || payload.last_message?.content || target.lastMessagePreview;
          const unread = typeof payload.unread_count === "number"
            ? payload.unread_count
            : typeof payload.unread === "number"
            ? payload.unread
            : target.unread;

          copy[idx] = {
            ...target,
            nome_cliente: (() => {
              const name = payload.last_message?.wpp_name || payload.nome_cliente || target.nome_cliente;
              console.log('🔍 [FRONTEND-REALTIME] Atualizando nome do contato:', {
                chat_id: payload.conversationId,
                wpp_name: payload.last_message?.wpp_name,
                nome_cliente: payload.nome_cliente,
                target_nome_cliente: target.nome_cliente,
                final_name: name
              });
              return name;
            })(),
            lastMessageAt,
            lastMessage,
            lastMessagePreview,
            unread,
          };
          
          console.log('🔄 [CONVERSATION-UPDATE] Atualizando conversa:', {
            chatId: target.chat_id,
            oldNomeCliente: target.nome_cliente,
            newNomeCliente: payload.nome_cliente,
            finalNomeCliente: copy[idx].nome_cliente,
            payloadNomeCliente: payload.nome_cliente
          });
          
          console.log('🔄 Conversa atualizada:', copy[idx]);
          
          // Reordenar conversas por data da última mensagem (mais recente primeiro)
          copy.sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || 0).getTime();
            const dateB = new Date(b.lastMessageAt || 0).getTime();
            return dateB - dateA;
          });
          
          console.log('🔄 Conversas reordenadas por data');
          return copy;
        });
      });

      // someone marked read (we do it ourselves on open)
      s.on('conversation:read', ({ conversationId, unread_count }) => {
        console.log('📖 Conversa marcada como lida via Socket:', conversationId, 'unread:', unread_count);
        setConversations(prev =>
          prev.map(c => (c.chat_id === conversationId ? { ...c, unread: Math.max(0, unread_count ?? 0) } : c))
        );
      });

      // conversation finalized
      s.on('conversation:finalized', ({ conversationId, status }) => {
        console.log('🔴 Conversa finalizada via Socket:', conversationId, 'status:', status);
        setConversations(prev =>
          prev.map(c => (c.chat_id === conversationId ? { ...c, status: status } : c))
        );
      });

    // New message for a specific room
    s.on("newMessage", (m: WhatsAppMessage) => {
      console.log('📨 ===== NOVA MENSAGEM RECEBIDA =====');
      console.log('📨 Dados da mensagem:', {
        id: m.id,
        message_id: m.message_id,
        chat_id: m.chat_id,
        conteudo: m.conteudo,
        remetente: m.remetente,
        timestamp: m.timestamp
      });
      console.log('📨 Conversa ativa (selectedChatId):', selectedChatId);
      console.log('📨 Socket conectado:', s.connected);
      console.log('📨 Socket ID:', s.id);
      console.log('📨 Socket conectado:', s.connected);
      console.log('📨 Mensagem é da conversa ativa?', selectedChatId && m.chat_id === selectedChatId);
      console.log('📨 Estado atual das mensagens:', messages.length);
      console.log('📨 Active Connection ID:', activeConnection?.id);
      console.log('📨 Room name should be:', activeConnection?.id ? `${activeConnection.id}-${m.chat_id}` : 'N/A');
      
      // Append to messages if it belongs to current conversation
      if (selectedChatId && m.chat_id === selectedChatId) {
        console.log('✅ Adicionando mensagem à conversa ativa');
        console.log('✅ selectedChatId:', selectedChatId);
        console.log('✅ m.chat_id:', m.chat_id);
        console.log('✅ Comparação:', selectedChatId === m.chat_id);
        
        setMessages(prev => {
          console.log('📨 Estado anterior das mensagens:', prev.length);
          
          // Check if this message already exists (by message_id or id)
          const messageExists = prev.some(msg => 
            msg.message_id === m.message_id || 
            msg.id === m.id
          );
          
          if (messageExists) {
            console.log('⚠️ Mensagem já existe, ignorando...');
            return prev;
          }
          
          // Check if there's a temporary message to replace
          const tempMessageIndex = prev.findIndex(msg => 
            msg.id?.startsWith('temp-') && 
            msg.conteudo === m.conteudo && 
            msg.remetente === m.remetente &&
            Math.abs(new Date(msg.timestamp).getTime() - new Date(m.timestamp).getTime()) < 5000 // within 5 seconds
          );
          
          if (tempMessageIndex !== -1) {
            console.log('🔄 Substituindo mensagem temporária por mensagem real');
            const updatedMessages = [...prev];
            updatedMessages[tempMessageIndex] = m;
            console.log('📨 Mensagens após substituir:', updatedMessages.length);
            return updatedMessages;
          } else {
            const newMessages = uniqById([...prev, m]);
            console.log('📨 Mensagens após adicionar nova:', newMessages.length);
            console.log('📨 Nova mensagem adicionada:', m);
            return newMessages;
          }
        });
      } else {
        console.log('⚠️ Mensagem não é da conversa ativa');
        console.log('⚠️ selectedChatId:', selectedChatId);
        console.log('⚠️ m.chat_id:', m.chat_id);
      }
      
      // Atualizar cache para todas as conversas
      setMessagesCache(prev => {
        const currentMessages = prev[m.chat_id] || [];
        
        // Check if this message already exists
        const messageExists = currentMessages.some(msg => 
          msg.message_id === m.message_id || 
          msg.id === m.id ||
          (msg.id?.startsWith('temp-') && msg.conteudo === m.conteudo && msg.remetente === m.remetente)
        );
        
        if (messageExists) {
          // Replace temporary message with real message
          const updatedMessages = currentMessages.map(msg => 
            (msg.id?.startsWith('temp-') && msg.conteudo === m.conteudo && msg.remetente === m.remetente) ? m : msg
          );
          return {
            ...prev,
            [m.chat_id]: uniqById(updatedMessages)
          };
        } else {
          return {
            ...prev,
            [m.chat_id]: uniqById([...currentMessages, m])
          };
        }
      });
      
      // Also update preview in the conversations list
      setConversations(prev =>
        prev.map(c => {
          if (c.chat_id === m.chat_id) {
            const newUnreadCount = m.remetente === "CLIENTE" && !m.lida ? (Number(c.unread) || 0) + 1 : c.unread;
            
            // Atualizar backup local quando nova mensagem não lida chega
            if (m.remetente === "CLIENTE" && !m.lida) {
              incrementUnreadCount(m.chat_id);
            }
            
            return {
              ...c,
              lastMessage: m,
              lastMessageAt: String(m.timestamp),
              lastMessagePreview: m.conteudo || "Nova mensagem",
              unread: newUnreadCount,
            };
          }
          return c;
        })
      );

      // Registrar contato automaticamente se for uma mensagem de cliente
      if (m.remetente === "CLIENTE" && activeConnection?.owner_id) {
        registerWhatsAppContact({
          phone: m.phone || m.chat_id.replace('@s.whatsapp.net', ''),
          name: m.phone || m.chat_id.replace('@s.whatsapp.net', ''),
          owner_id: activeConnection.owner_id
        }).catch(console.error);
      }
    });

    socketRef.current = s;
  }, []);

  const disconnectSocket = useCallback(() => {
    try {
      socketRef.current?.disconnect();
    } finally {
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  // Função para limpar cache de mensagens
  const clearMessagesCache = useCallback(() => {
    setMessagesCache({});
    console.log('🗑️ Cache de mensagens limpo');
  }, []);

  // Função para registrar contato WhatsApp
  const registerWhatsAppContact = useCallback(async (contactData: { phone: string; name?: string; owner_id: string }) => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/register-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Contato registrado:', result);
        return result;
      } else {
        console.error('❌ Erro ao registrar contato:', response.status);
        return { success: false, error: 'Erro ao registrar contato' };
      }
    } catch (error) {
      console.error('❌ Erro ao registrar contato:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Função para atualizar nome do contato
  const updateContactName = useCallback(async (contactId: string, name: string, ownerId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, owner_id: ownerId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Nome do contato atualizado:', result);
        
        // Atualizar nome nas conversas locais se necessário
        setConversations(prev => prev.map(conv => {
          // Aqui você pode implementar a lógica para atualizar o nome nas conversas
          // baseado no phone do contato atualizado
          return conv;
        }));
        
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro ao atualizar nome do contato:', response.status, errorData);
        return { success: false, error: errorData.error || 'Erro ao atualizar nome' };
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar nome do contato:', error);
      return { success: false, error: 'Erro ao atualizar nome' };
    }
  }, [setConversations]);

  const joinConversation = useCallback((chatId: string) => {
    if (!socketRef.current || !activeConnection?.id) {
      console.log('⚠️ joinConversation: Socket ou connectionId não disponível', { 
        hasSocket: !!socketRef.current, 
        hasConnection: !!activeConnection?.id 
      });
      return;
    }
    
    const room = `${activeConnection.id}-${chatId}`;
    if (joinedRoomRef.current === room) {
      console.log('⚠️ joinConversation: Já está na sala', room);
      return;
    }

    console.log('🔌 joinConversation: Entrando na sala da conversa', { room, chatId, connectionId: activeConnection.id });

    // Leave previous room
    if (joinedRoomRef.current) {
      console.log('🔌 joinConversation: Saindo da sala anterior', joinedRoomRef.current);
      socketRef.current.emit("leave", { room: joinedRoomRef.current });
    }

    socketRef.current.emit("join", {
      connectionId: activeConnection.id,
      conversationId: chatId,
    });

    joinedRoomRef.current = room;
    console.log('✅ joinConversation: Entrou na sala da conversa:', room);
  }, [activeConnection?.id]);

  // Atualizar ref da conversa ativa
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Entrar na sala quando uma conversa é selecionada
  useEffect(() => {
    if (activeConversation?.chat_id && socketRef.current) {
      joinConversation(activeConversation.chat_id);
    }
  }, [activeConversation?.chat_id, joinConversation]);

  const leaveConversation = useCallback((chatId: string) => {
    if (!socketRef.current || !activeConnection?.id) return;
    const room = `${activeConnection.id}-${chatId}`;
    socketRef.current.emit("leave", { room });
    if (joinedRoomRef.current === room) {
      joinedRoomRef.current = null;
    }
  }, [activeConnection?.id]);

  /* ---------- Data loaders ---------- */

  /**
   * Load conversations from your backend or directly from Supabase.
   * - Filters by owner and active connection.
   * - If zero rows by connection_id, it retries by connection_phone (fallback).
   */
  const loadConversations = useCallback(
    async (ownerId: string) => {
      console.log('🔍 ===== LOADCONVERSATIONS CHAMADO =====');
      console.log('🔍 loadConversations - Iniciando carregamento...', { ownerId, activeConnection: activeConnection?.id });
      
      if (!activeConnection?.id) {
        console.log('❌ loadConversations - Nenhuma conexão ativa');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Usar endpoint do backend para buscar conversas
        console.log('🔍 loadConversations - Buscando conversas via API:', ownerId);
        const response = await fetch(`${API_URL}/api/baileys-simple/test-conversations?ownerId=${ownerId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🔍 loadConversations - Resultado da API:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'Erro ao buscar conversas');
        }
        
        const conversations = data.conversations || [];
        console.log('🔍 loadConversations - Conversas encontradas:', conversations.length);

        // As conversas já vêm processadas do backend
        if (!conversations || conversations.length === 0) {
          console.log('❌ loadConversations - Nenhuma conversa encontrada');
          setConversations([]);
          return;
        }

        // Carregar backup local das mensagens não lidas
        const localUnreadBackup = loadUnreadBackup();
        console.log('💾 Backup local carregado:', localUnreadBackup);

        // Converter para o formato esperado pelo frontend
        const list = conversations.map(conv => {
          const chatId = conv.chat_id;
          const serverUnread = Math.max(0, conv.unread_count || 0);
          
          // Sincronizar com o backup local
          const finalUnread = syncWithServer(chatId, serverUnread);
          
          return {
            id: conv.chat_id,
            owner_id: conv.owner_id,
            connection_id: conv.connection_id,
            chat_id: conv.chat_id,
            nome_cliente: conv.nome_cliente,
            numero_cliente: conv.numero_cliente,
            status: conv.status || 'ATENDENDO',
            lastMessageAt: conv.lastMessageAt,
            lastMessage: {
              conteudo: conv.last_message,
              timestamp: conv.lastMessageAt,
              remetente: conv.last_message_remetente || 'CLIENTE',
              lida: conv.last_message_lida || false,
              tipo: conv.last_message_tipo || 'TEXTO'
            },
            lastMessagePreview: conv.last_message || conv.ultima_mensagem_preview || conv.lastMessage?.conteudo || "Nenhuma mensagem",
            unread: finalUnread,
            total_messages: conv.total_messages,
            messages: [],
            // Adicionar campos para exibição correta
            last_message_remetente: conv.last_message_remetente,
            last_message_tipo: conv.last_message_tipo,
            last_message_lida: conv.last_message_lida
          };
        });

        // Ordenar conversas por data da última mensagem (mais recente primeiro)
        list.sort((a, b) => {
          const dateA = new Date(a.lastMessageAt || 0).getTime();
          const dateB = new Date(b.lastMessageAt || 0).getTime();
          return dateB - dateA;
        });

        console.log('🔍 loadConversations - Conversas processadas e ordenadas:', list);
        console.log('🔍 loadConversations - Número de conversas:', list.length);
        setConversations(list);
      } catch (e: any) {
        console.error("[loadConversations] error:", e);
        setError(e?.message || "Erro ao carregar conversas");
      } finally {
        setLoading(false);
      }
    },
    [activeConnection?.id]
  );

  /**
   * Load messages for a conversation (history).
   */
  const loadMessages = useCallback(
    async (chatId: string, ownerId: string) => {
      if (!chatId) {
        console.log('⚠️ loadMessages: chatId não fornecido');
        return;
      }
      
      console.log('💾 loadMessages: Carregando mensagens para:', { chatId, ownerId });
      
      // Só mostrar loading se não tiver mensagens em cache
      if (!messagesCache[chatId]) {
        console.log('💾 loadMessages: Não há cache, mostrando loading...');
        setLoading(true);
      } else {
        console.log('💾 loadMessages: Usando mensagens do cache:', messagesCache[chatId].length);
      }
      setError(null);
      
      try {
        // Optionally use your REST:
        // const res = await fetch(`${API_URL}/api/whatsapp/messages?chatId=${chatId}&ownerId=${ownerId}`);
        // if (!res.ok) throw new Error(await res.text());
        // const data: WhatsAppMessage[] = await res.json();

        console.log('💾 loadMessages: Buscando mensagens no Supabase para:', { ownerId, chatId });
        
        const { data, error: err } = await supabase
          .from("whatsapp_mensagens")
          .select("*")
          .eq("owner_id", ownerId)
          .eq("chat_id", chatId)
          .order("timestamp", { ascending: true });

        if (err) {
          console.error('❌ loadMessages: Erro no Supabase:', err);
          throw err;
        }
        
        console.log('💾 loadMessages: Dados brutos do Supabase:', data?.length || 0, 'registros');

        const messagesData = uniqById(data || []);
        console.log('💾 loadMessages: Mensagens carregadas do Supabase:', messagesData.length);
        console.log('💾 loadMessages: Primeiras 3 mensagens:', messagesData.slice(0, 3));
        console.log('💾 loadMessages: Dados completos das mensagens:', messagesData);
        
        // Verificar se as mensagens têm os campos necessários
        if (messagesData.length > 0) {
          console.log('💾 loadMessages: Estrutura da primeira mensagem:', {
            id: messagesData[0].id,
            message_id: messagesData[0].message_id,
            chat_id: messagesData[0].chat_id,
            conteudo: messagesData[0].conteudo,
            remetente: messagesData[0].remetente,
            timestamp: messagesData[0].timestamp
          });
        }
        
        setMessages(messagesData);
        console.log('💾 loadMessages: setMessages chamado com:', messagesData.length, 'mensagens');
        
        // Salvar no cache
        setMessagesCache(prev => ({
          ...prev,
          [chatId]: messagesData
        }));
        
        console.log('💾 loadMessages: Mensagens salvas no cache para:', chatId, 'Total:', messagesData.length);
        console.log('💾 loadMessages: Estado atual das mensagens após setMessages:', messagesData.length);
        
        // Verificar se o estado foi atualizado
        setTimeout(() => {
          console.log('💾 loadMessages: Verificação após 100ms - mensagens no estado:', messages.length);
        }, 100);
        
        // Forçar re-render se necessário
        if (messagesData.length > 0) {
          console.log('💾 loadMessages: Forçando re-render com mensagens');
          // Forçar atualização do estado se necessário
          setTimeout(() => {
            setMessages(prev => {
              if (prev.length !== messagesData.length) {
                console.log('💾 loadMessages: Forçando atualização do estado');
                return messagesData;
              }
              return prev;
            });
          }, 50);
        }
        
        // Verificar se o estado foi atualizado corretamente
        setTimeout(() => {
          console.log('💾 loadMessages: Verificação final - mensagens no estado:', messages.length);
          if (messages.length !== messagesData.length) {
            console.log('💾 loadMessages: Estado não atualizado, forçando novamente');
            setMessages(messagesData);
          }
        }, 200);
        
        // Verificação adicional para garantir que as mensagens sejam exibidas
        setTimeout(() => {
          console.log('💾 loadMessages: Verificação adicional - mensagens no estado:', messages.length);
          if (messages.length === 0 && messagesData.length > 0) {
            console.log('💾 loadMessages: Nenhuma mensagem no estado, forçando atualização');
            setMessages(messagesData);
          }
        }, 500);
      } catch (e: any) {
        console.error("[loadMessages] error:", e);
        setError(e?.message || "Erro ao carregar mensagens");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ---------- Actions ---------- */

  // ---- Mark conversation read (DB + broadcast) ----
  const markConversationRead = useCallback(async (chatId: string) => {
    if (!activeConnection?.id) return;
    
    // Encontrar a conversa para obter o connection_id correto
    const conversation = conversations.find(c => c.chat_id === chatId);
    const connectionId = conversation?.connection_id || activeConnection.id;
    
    try {
      console.log(`📖 Marcando conversa como lida: ${chatId} usando connection_id: ${connectionId}`);
      
      // Marcar como lida no backend
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}/mark-read`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      
      if (response.ok) {
        // Garantir que o badge seja limpo localmente também
        setConversations(prev => prev.map(c => 
          c.chat_id === chatId ? { ...c, unread: 0 } : c
        ));
        
        console.log('✅ Conversa marcada como lida:', chatId);
      } else {
        console.warn('Falha ao marcar conversa como lida:', response.status);
      }
    } catch (e) {
      console.warn('markConversationRead failed:', e);
    }
  }, [activeConnection?.id, conversations]);

  const markAsRead = useCallback(async (chatId: string) => {
    if (!activeConnection?.id) return;
    
    try {
      // Marcar mensagens como lidas no backend
      const res = await fetch(`${API_URL}/api/baileys-simple/atendimentos/${chatId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        // Atualizar backup local - zerar contador de não lidas
        markChatAsRead(chatId);
        
        // Atualizar estado local - zerar contador de não lidas
        setConversations(prev => 
          prev.map(c => 
            c.chat_id === chatId 
              ? { ...c, unread: 0 }
              : c
          )
        );
        
        // Marcar mensagens como lidas no estado local
        setMessages(prev => 
          prev.map(m => 
            m.chat_id === chatId 
              ? { ...m, lida: true }
              : m
          )
        );
        
        console.log(`✅ Conversa ${chatId} marcada como lida`);
      }
    } catch (e) {
      console.error('Erro ao marcar como lido:', e);
    }
  }, [activeConnection?.id]);

  // ---- Join rooms when a chat is selected ----
  const joinConversationRoom = useCallback((chatId?: string) => {
    if (!socketRef.current || !activeConnection?.id || !chatId) {
      console.log('⚠️ joinConversationRoom: Parâmetros inválidos', {
        hasSocket: !!socketRef.current,
        hasConnection: !!activeConnection?.id,
        chatId
      });
      return;
    }
    
    const room = `${activeConnection.id}-${chatId}`;
    console.log(`🔌 joinConversationRoom: Entrando na sala: ${room}`);
    
    if (currentRoomRef.current && currentRoomRef.current !== room) {
      console.log(`🔌 Saindo da sala anterior: ${currentRoomRef.current}`);
      socketRef.current.emit('leave', { room: currentRoomRef.current });
    }
    
    socketRef.current.emit('join', { 
      connectionId: activeConnection.id,
      conversationId: chatId
    });
    currentRoomRef.current = room;
    console.log(`🔌 Entrando na sala da conversa: ${room}`);

    // always sit in the connection room for list events
    socketRef.current.emit('joinConnection', { connectionId: activeConnection.id });
    console.log(`🔌 Entrando na sala de conexão: ${activeConnection.id}`);
  }, [activeConnection?.id]);

  // ---- When user selects a conversation ----
  const onSelectConversation = useCallback(async (chatId: string) => {
    joinConversationRoom(chatId);
    await loadMessages(chatId, activeConnection?.owner_id || '');
    await markConversationRead(chatId);      // persist unread=0
    // UI's unread badge will also be zeroed immediately by setConversations below
  }, [joinConversationRoom, loadMessages, markConversationRead, activeConnection?.owner_id]);

  // expose current selection
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // join rooms + load + local unread=0 immediately
  const selectConversation = useCallback((chatId: string, opts?: { localMarkRead?: boolean }) => {
    console.log('🎯 ===== SELECTCONVERSATION CHAMADO =====');
    console.log('🎯 selectConversation: Selecionando conversa:', chatId);
    console.log('🎯 selectConversation: selectedChatId atual:', selectedChatId);
    console.log('🎯 selectConversation: activeConnection:', activeConnection?.id);
    console.log('🎯 selectConversation: conversations disponíveis:', conversations.length);
    console.log('🎯 selectConversation: conversa encontrada:', conversations.find(c => c.chat_id === chatId));
    
    // Limpar mensagens atuais antes de selecionar nova conversa
    console.log('🧹 selectConversation: Limpando mensagens atuais antes de carregar nova conversa');
    setMessages([]);
    
    console.log('🔄 selectConversation: Definindo selectedChatId para:', chatId);
    setSelectedChatId(chatId);

    // join conversation + connection rooms
    joinConversationRoom(chatId);

    // Limpar badge imediatamente quando conversa é selecionada
    setConversations(prev => prev.map(c => 
      c.chat_id === chatId ? { ...c, unread: 0 } : c
    ));

    // Verificar se já temos mensagens em cache
    if (messagesCache[chatId]) {
      console.log('📦 selectConversation: Usando mensagens do cache para:', chatId, 'Total:', messagesCache[chatId].length);
      console.log('📦 selectConversation: Primeiras 3 mensagens do cache:', messagesCache[chatId].slice(0, 3));
      setMessages(messagesCache[chatId]);
      console.log('📦 selectConversation: setMessages chamado com cache');
      // Não mostrar loading quando usando cache
      setLoading(false);
    } else {
      console.log('📦 selectConversation: Não há cache, carregando mensagens...');
      console.log('🔄 Carregando mensagens do banco para:', chatId);
      // fetch thread apenas se não estiver em cache (não bloquear UI)
      loadMessages(chatId, activeConnection?.owner_id || '').catch(console.error);
    }
    
    // Forçar re-render se necessário
    setTimeout(() => {
      console.log('📦 selectConversation: Verificação após 200ms - mensagens no estado:', messages.length);
    }, 200);

    // Pré-carregar mensagens de conversas próximas para troca mais suave
    const currentIndex = conversations.findIndex(c => c.chat_id === chatId);
    if (currentIndex !== -1) {
      // Pré-carregar conversa anterior
      if (currentIndex > 0) {
        const prevChatId = conversations[currentIndex - 1].chat_id;
        if (!messagesCache[prevChatId]) {
          loadMessages(prevChatId, activeConnection?.owner_id || '').catch(console.error);
        }
      }
      // Pré-carregar próxima conversa
      if (currentIndex < conversations.length - 1) {
        const nextChatId = conversations[currentIndex + 1].chat_id;
        if (!messagesCache[nextChatId]) {
          loadMessages(nextChatId, activeConnection?.owner_id || '').catch(console.error);
        }
      }
    }
  }, [joinConversationRoom, loadMessages, activeConnection?.owner_id, messagesCache, conversations]);

  // explicit send (do NOT rely on selectedChatId inside the hook)
  const sendMessageTo = useCallback(async (chatId: string, text: string, uiType: 'TEXTO'|'IMAGEM'|'VIDEO'|'AUDIO'|'ARQUIVO'='TEXTO', mediaUrl?: string) => {
    if (!activeConnection?.id) {
      console.error("❌ No connectionId available");
      throw new Error("No connectionId");
    }
    
    const type = mapType(uiType); // your existing mapper
    const url = `${API_URL}/api/baileys-simple/connections/${activeConnection.id}/send-message`;
    
    console.log('📤 Enviando mensagem:', { 
      chatId, 
      text, 
      type, 
      mediaUrl, 
      connectionId: activeConnection.id,
      url,
      socketConnected: socketRef.current?.connected
    });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, type, text, mediaUrl })
      });
      
      const j = await res.json().catch(() => ({}));
      console.log('📤 Resposta do servidor:', { status: res.status, body: j });
      
      if (!res.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${res.status}: Falha ao enviar mensagem`);
      }
      
      console.log('✅ Mensagem enviada com sucesso');
      return j;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }, [activeConnection?.id]);

  const sendMessage = useCallback(
    async (text: string, type: "TEXTO" | string = "TEXTO", extra: Record<string, any> = {}) => {
      if (!activeConversation?.chat_id || !activeConnection?.id) return;

      // Mapear tipo UI para backend
      const typeMap: Record<string, string> = {
        TEXTO: 'text', IMAGEM: 'image', VIDEO: 'video', AUDIO: 'audio', ARQUIVO: 'document'
      };
      const backendType = typeMap[type] || 'text';

      try {
        const res = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/send-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: activeConversation.chat_id,
            type: backendType,
            text: text,
            mediaUrl: extra.mediaUrl
          })
        });
        
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) {
          throw new Error(j?.error || "Falha ao enviar mensagem");
        }
        
        // UI will update via socket 'newMessage'
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }
    },
    [activeConversation?.chat_id, activeConnection?.id]
  );

  /* ---------- Memo ---------- */
  // Filtrar mensagens pela conversa ativa
  const filteredMessages = useMemo(() => {
    if (!selectedChatId) {
      console.log('🔍 filteredMessages: Nenhuma conversa selecionada, retornando array vazio');
      return [];
    }
    
    const filtered = messages.filter(msg => {
      const isFromActiveChat = msg.chat_id === selectedChatId;
      if (!isFromActiveChat) {
        console.log('🔍 filteredMessages: Mensagem filtrada fora:', {
          msgChatId: msg.chat_id,
          selectedChatId,
          conteudo: msg.conteudo?.substring(0, 50)
        });
      }
      return isFromActiveChat;
    });
    
    console.log('🔍 filteredMessages: Mensagens filtradas:', {
      totalMessages: messages.length,
      filteredCount: filtered.length,
      selectedChatId
    });
    
    return filtered;
  }, [messages, selectedChatId]);

  const value = useMemo(
    () => ({
      conversations,
      messages: filteredMessages, // Usar mensagens filtradas
      activeConversation,
      setActiveConversation,
      loading,
      error,
      connected,

      connectSocket,
      disconnectSocket,

      loadConversations,
      loadMessages,

      joinConversation,
      leaveConversation,

      markAsRead,
      markConversationRead,
      onSelectConversation,
      selectedChatId,
      setSelectedChatId,
      selectConversation,
      sendMessageTo,
      sendMessage,
      clearMessagesCache,
      registerWhatsAppContact,
      updateContactName,
      setMessages,
      setConversations,
      
      // Interface compatível com ConversationsList
      items: conversations,
      reload: () => {
        console.log('🔄 ConversationsList: reload chamado');
        console.log('🔄 ConversationsList: activeConnection?.owner_id:', activeConnection?.owner_id);
        return loadConversations(activeConnection?.owner_id || '');
      },
      markRead: markAsRead,
    }),
    [
      conversations,
      filteredMessages, // Usar filteredMessages em vez de messages
      activeConversation,
      loading,
      error,
      connected,
      connectSocket,
      disconnectSocket,
      loadConversations,
      loadMessages,
      joinConversation,
      leaveConversation,
      markAsRead,
      markConversationRead,
      onSelectConversation,
      selectedChatId,
      selectConversation,
      sendMessageTo,
      sendMessage,
      clearMessagesCache,
      registerWhatsAppContact,
      updateContactName,
      setMessages,
      setConversations,
    ]
  );

  // Pré-carregar mensagens de todas as conversas visíveis para troca instantânea
  useEffect(() => {
    if (conversations.length > 0 && activeConnection?.owner_id) {
      // Pré-carregar mensagens das primeiras 5 conversas em background
      const conversationsToPreload = conversations.slice(0, 5);
      conversationsToPreload.forEach(conv => {
        if (!messagesCache[conv.chat_id]) {
          loadMessages(conv.chat_id, activeConnection.owner_id).catch(console.error);
        }
      });
    }
  }, [conversations, activeConnection?.owner_id, messagesCache, loadMessages]);

  // Debug: Monitorar mudanças no selectedChatId
  useEffect(() => {
    console.log('🔍 selectedChatId mudou para:', selectedChatId);
    console.log('🔍 Estado atual das mensagens:', messages.length);
  }, [selectedChatId, messages.length]);

  // Forçar re-render quando selectedChatId muda
  useEffect(() => {
    if (selectedChatId && messagesCache[selectedChatId]) {
      console.log('🔄 Forçando atualização de mensagens para:', selectedChatId);
      setMessages(messagesCache[selectedChatId]);
    }
  }, [selectedChatId, messagesCache]);

  // Debug: Monitorar mudanças nas mensagens
  useEffect(() => {
    console.log('📨 Mensagens atualizadas:', messages.length);
    if (messages.length > 0) {
      console.log('📨 Última mensagem:', messages[messages.length - 1]);
    }
  }, [messages]);

  return value;
}