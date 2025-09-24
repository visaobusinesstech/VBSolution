import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseChatSocketProps {
  tenantId: string;
  connectionId?: string;
  conversationId?: string;
  onMessage: (message: any) => void;
  onTyping: (typing: any) => void;
  onStatus: (status: any) => void;
}

export function useChatSocket({
  tenantId,
  connectionId,
  conversationId,
  onMessage,
  onTyping,
  onStatus
}: UseChatSocketProps) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Conectar ao Socket.IO
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:3000', {
        transports: ['websocket'],
        autoConnect: true
      });

      // Configurar listeners
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        onStatus({ connected: true });
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        onStatus({ connected: false });
      });

      socketRef.current.on('chat:message_in', (message) => {
        console.log('New message received:', message);
        onMessage(message);
      });

      socketRef.current.on('chat:typing', (typing) => {
        console.log('Typing event:', typing);
        onTyping(typing);
      });

      socketRef.current.on('chat:session_status', (status) => {
        console.log('Session status:', status);
        onStatus(status);
      });
    }

    // Inscrever em eventos específicos
    if (connectionId) {
      socketRef.current.emit('chat:subscribe', {
        tenantId,
        connectionId,
        conversationId
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('chat:unsubscribe', {
          tenantId,
          connectionId,
          conversationId
        });
      }
    };
  }, [tenantId, connectionId, conversationId, onMessage, onTyping, onStatus]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false
  };
}