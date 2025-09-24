import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  connectionId?: string;
  conversationId?: string;
  onMessage?: (message: any) => void;
  onConnectionStatus?: (status: any) => void;
  onTyping?: (typing: any) => void;
}

export function useSocket({
  connectionId,
  conversationId,
  onMessage,
  onConnectionStatus,
  onTyping
}: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!connectionId) return;

    // Conectar ao Socket.IO
    const socket = io('http://localhost:3000', {
      transports: ['websocket']
    });

    socketRef.current = socket;

    // Eventos do socket
    socket.on('connect', () => {
      console.log('🔌 Conectado ao Socket.IO');
      
      // Entrar na sala da conversa
      if (conversationId) {
        socket.emit('join', {
          tenantId: 'default',
          connectionId,
          conversationId
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Desconectado do Socket.IO');
    });

    socket.on('message.new', (message) => {
      console.log('📨 Nova mensagem recebida:', message);
      onMessage?.(message);
    });

    socket.on('connection.status', (status) => {
      console.log('📱 Status da conexão:', status);
      onConnectionStatus?.(status);
    });

    socket.on('typing', (typing) => {
      console.log('⌨️ Indicador de digitação:', typing);
      onTyping?.(typing);
    });

    socket.on('message.status', (status) => {
      console.log('📊 Status da mensagem:', status);
      // Atualizar status de entrega/leitura
      onMessage?.(status);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [connectionId, conversationId, onMessage, onConnectionStatus, onTyping]);

  const joinConversation = (newConversationId: string) => {
    if (socketRef.current && connectionId) {
      socketRef.current.emit('join', {
        tenantId: 'default',
        connectionId,
        conversationId: newConversationId
      });
    }
  };

  return {
    socket: socketRef.current,
    joinConversation
  };
}