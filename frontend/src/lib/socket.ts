import { io, Socket } from 'socket.io-client';
import {
  SocketEvents,
  ClientToServerEvents,
  WhatsAppStatus,
  WhatsAppMessage,
} from '@/types';

class SocketClient {
  private socket: Socket<SocketEvents, ClientToServerEvents> | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }

  connect(token: string = 'vb_dev_token_12345') {
    if (this.socket?.connected) {
      console.log('Socket já está conectado');
      return;
    }

    try {
      this.socket = io('http://localhost:3001/chat', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Erro ao conectar Socket.IO:', error);
      console.error('Erro ao conectar com o servidor em tempo real');
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // Conexão
    this.socket.on('connect', () => {
      console.log('Socket.IO conectado');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Conectado em tempo real');
    });

    // Desconexão
    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO desconectado:', reason);
      this.isConnected = false;

      if (reason === 'io server disconnect') {
        // Desconexão iniciada pelo servidor
        console.error('Desconectado pelo servidor');
      } else if (reason === 'io client disconnect') {
        // Desconexão iniciada pelo cliente
        console.log('Desconexão iniciada pelo cliente');
      } else {
        // Desconexão por erro de rede
        console.error('Conexão perdida. Tentando reconectar...');
        this.attemptReconnect();
      }
    });

    // Erro de conexão
    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.IO:', error);
      this.isConnected = false;

      if (error.message === 'Invalid token') {
        console.error('Token de autenticação inválido');
      } else {
        console.error('Erro ao conectar com o servidor');
        this.attemptReconnect();
      }
    });

    // Eventos específicos do chat
    this.socket.on('chat:qr', (qrCode: string) => {
      console.log('QR Code recebido');
      // O store será atualizado pelo hook useSocket
    });

    this.socket.on('chat:session_status', (status: WhatsAppStatus) => {
      console.log('Status da sessão atualizado:', status);
      // O store será atualizado pelo hook useSocket
    });

    this.socket.on('chat:message_in', (message: WhatsAppMessage) => {
      console.log('Nova mensagem recebida:', message);
      // O store será atualizado pelo hook useSocket
    });

    this.socket.on('chat:typing', (data: { atendimentoId: string; isTyping: boolean }) => {
      console.log('Status de digitação:', data);
      // O store será atualizado pelo hook useSocket
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Tentativa de reconexão ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }

  private stopReconnectAttempts() {
    this.reconnectAttempts = this.maxReconnectAttempts;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket.IO desconectado');
    }
  }

  // Métodos para emitir eventos
  subscribeToChat(atendimentoId: string) {
    if (this.socket?.connected) {
      this.socket.emit('chat:subscribe', atendimentoId);
    } else {
      console.warn('Socket não está conectado');
    }
  }

  sendTypingStatus(atendimentoId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('chat:typing', { atendimentoId, isTyping });
    } else {
      console.warn('Socket não está conectado');
    }
  }

  // Getters
  get connected() {
    return this.isConnected && this.socket?.connected;
  }

  get socketInstance() {
    return this.socket;
  }
}

// Instância singleton
export const socketClient = new SocketClient();

// Hook para usar o socket (será implementado em um hook separado)
export const useSocket = () => {
  return {
    connect: socketClient.connect.bind(socketClient),
    disconnect: socketClient.disconnect.bind(socketClient),
    subscribeToChat: socketClient.subscribeToChat.bind(socketClient),
    sendTypingStatus: socketClient.sendTypingStatus.bind(socketClient),
    connected: socketClient.connected,
    socket: socketClient.socketInstance,
  };
};
