import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RealtimeEvent {
  type: string;
  connectionId: string;
  data: any;
  timestamp: string;
}

export interface UseRealtimeEventsOptions {
  connectionId?: string;
  autoConnect?: boolean;
  serverUrl?: string;
}

export interface UseRealtimeEventsReturn {
  socket: Socket | null;
  isConnected: boolean;
  events: RealtimeEvent[];
  sendMessage: (jid: string, message: any) => Promise<void>;
  markMessageAsRead: (jid: string, messageId: string) => Promise<void>;
  updatePresence: (presence: string) => Promise<void>;
  joinConnection: (connectionId: string) => void;
  leaveConnection: (connectionId: string) => void;
  clearEvents: () => void;
}

export const useRealtimeEvents = (options: UseRealtimeEventsOptions = {}): UseRealtimeEventsReturn => {
  const {
    connectionId,
    autoConnect = true,
    serverUrl = 'http://localhost:3001'
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to realtime events server');
      setIsConnected(true);
      
      // Join connection room if connectionId is provided
      if (connectionId) {
        newSocket.emit('join-connection', connectionId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from realtime events server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Message events
    newSocket.on('messages-upsert', (data) => {
      setEvents(prev => [...prev, { type: 'messages-upsert', ...data }]);
    });

    newSocket.on('messages-update', (data) => {
      setEvents(prev => [...prev, { type: 'messages-update', ...data }]);
    });

    newSocket.on('messages-delete', (data) => {
      setEvents(prev => [...prev, { type: 'messages-delete', ...data }]);
    });

    newSocket.on('messages-reaction', (data) => {
      setEvents(prev => [...prev, { type: 'messages-reaction', ...data }]);
    });

    newSocket.on('message-receipt-update', (data) => {
      setEvents(prev => [...prev, { type: 'message-receipt-update', ...data }]);
    });

    // Chat events
    newSocket.on('chats-upsert', (data) => {
      setEvents(prev => [...prev, { type: 'chats-upsert', ...data }]);
    });

    newSocket.on('chats-update', (data) => {
      setEvents(prev => [...prev, { type: 'chats-update', ...data }]);
    });

    newSocket.on('chats-delete', (data) => {
      setEvents(prev => [...prev, { type: 'chats-delete', ...data }]);
    });

    // Contact events
    newSocket.on('contacts-upsert', (data) => {
      setEvents(prev => [...prev, { type: 'contacts-upsert', ...data }]);
    });

    newSocket.on('contacts-update', (data) => {
      setEvents(prev => [...prev, { type: 'contacts-update', ...data }]);
    });

    // Group events
    newSocket.on('groups-upsert', (data) => {
      setEvents(prev => [...prev, { type: 'groups-upsert', ...data }]);
    });

    newSocket.on('group-update', (data) => {
      setEvents(prev => [...prev, { type: 'group-update', ...data }]);
    });

    newSocket.on('group-participants-update', (data) => {
      setEvents(prev => [...prev, { type: 'group-participants-update', ...data }]);
    });

    // Presence events
    newSocket.on('presence', (data) => {
      setEvents(prev => [...prev, { type: 'presence', ...data }]);
    });

    // Connection events
    newSocket.on('connection-created', (data) => {
      setEvents(prev => [...prev, { type: 'connection-created', ...data }]);
    });

    newSocket.on('connection-update', (data) => {
      setEvents(prev => [...prev, { type: 'connection-update', ...data }]);
    });

    // History sync events
    newSocket.on('history-sync', (data) => {
      setEvents(prev => [...prev, { type: 'history-sync', ...data }]);
    });

    // Blocklist events
    newSocket.on('blocklist-set', (data) => {
      setEvents(prev => [...prev, { type: 'blocklist-set', ...data }]);
    });

    newSocket.on('blocklist-update', (data) => {
      setEvents(prev => [...prev, { type: 'blocklist-update', ...data }]);
    });

    // Call events
    newSocket.on('call', (data) => {
      setEvents(prev => [...prev, { type: 'call', ...data }]);
    });

    // Response events
    newSocket.on('message-sent', (data) => {
      setEvents(prev => [...prev, { type: 'message-sent', data }]);
    });

    newSocket.on('message-marked-read', (data) => {
      setEvents(prev => [...prev, { type: 'message-marked-read', data }]);
    });

    newSocket.on('presence-updated', (data) => {
      setEvents(prev => [...prev, { type: 'presence-updated', data }]);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, serverUrl]);

  // Join connection room
  const joinConnection = (newConnectionId: string) => {
    if (socket && isConnected) {
      socket.emit('join-connection', newConnectionId);
    }
  };

  // Leave connection room
  const leaveConnection = (newConnectionId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-connection', newConnectionId);
    }
  };

  // Send message
  const sendMessage = async (jid: string, message: any) => {
    if (!socket || !isConnected || !connectionId) {
      throw new Error('Socket not connected or connectionId not provided');
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit('send-message', { connectionId, jid, message });
      
      const timeout = setTimeout(() => {
        reject(new Error('Send message timeout'));
      }, 10000);

      socket.once('message-sent', (data) => {
        clearTimeout(timeout);
        if (data.success) {
          resolve();
        } else {
          reject(new Error(data.error || 'Failed to send message'));
        }
      });
    });
  };

  // Mark message as read
  const markMessageAsRead = async (jid: string, messageId: string) => {
    if (!socket || !isConnected || !connectionId) {
      throw new Error('Socket not connected or connectionId not provided');
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit('mark-message-read', { connectionId, jid, messageId });
      
      const timeout = setTimeout(() => {
        reject(new Error('Mark message as read timeout'));
      }, 5000);

      socket.once('message-marked-read', (data) => {
        clearTimeout(timeout);
        if (data.success) {
          resolve();
        } else {
          reject(new Error(data.error || 'Failed to mark message as read'));
        }
      });
    });
  };

  // Update presence
  const updatePresence = async (presence: string) => {
    if (!socket || !isConnected || !connectionId) {
      throw new Error('Socket not connected or connectionId not provided');
    }

    return new Promise<void>((resolve, reject) => {
      socket.emit('update-presence', { connectionId, presence });
      
      const timeout = setTimeout(() => {
        reject(new Error('Update presence timeout'));
      }, 5000);

      socket.once('presence-updated', (data) => {
        clearTimeout(timeout);
        if (data.success) {
          resolve();
        } else {
          reject(new Error(data.error || 'Failed to update presence'));
        }
      });
    });
  };

  // Clear events
  const clearEvents = () => {
    setEvents([]);
  };

  return {
    socket,
    isConnected,
    events,
    sendMessage,
    markMessageAsRead,
    updatePresence,
    joinConnection,
    leaveConnection,
    clearEvents
  };
};
