"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import io, { Socket } from 'socket.io-client';

// Socket / API base
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:3000";
const API_URL = import.meta.env.VITE_API_URL?.trim() || SOCKET_URL;

export interface WhatsAppConnection {
  id: string;
  name: string;
  type?: string;
  connectionState: 'disconnected' | 'connecting' | 'connected';
  isConnected: boolean;
  phoneNumber?: string;
  whatsappId?: string;
  whatsappInfo?: any;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
  connectedAt?: string;
  owner_id?: string;
}

interface ConnectionsContextType {
  connections: WhatsAppConnection[];
  activeConnection: WhatsAppConnection | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadConnections: (userId: string) => Promise<void>;
  createConnection: (name: string, type: string, userId: string) => Promise<WhatsAppConnection | null>;
  deleteConnection: (connectionId: string, userId: string) => Promise<void>;
  connectWhatsApp: (connectionId: string) => Promise<void>;
  disconnectWhatsApp: (connectionId: string, userId: string) => Promise<void>;
  generateQRCode: (connectionId: string) => Promise<string | null>;
  refreshQRCode: (connectionId: string) => Promise<void>;
  
  // Modal management
  openDisconnectModal: (connectionId: string) => void;
  closeDisconnectModal: () => void;
  isDisconnectModalOpen: boolean;
  connectionToDisconnect: string | null;
  
  // Delete modal management
  showDeleteConnectionModal: boolean;
  deleteConnectionData: WhatsAppConnection | null;
  openDeleteConnectionModal: (connection: WhatsAppConnection) => void;
  closeDeleteConnectionModal: () => void;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<WhatsAppConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [connectionToDisconnect, setConnectionToDisconnect] = useState<string | null>(null);
  
  // Delete modal states
  const [showDeleteConnectionModal, setShowDeleteConnectionModal] = useState(false);
  const [deleteConnectionData, setDeleteConnectionData] = useState<WhatsAppConnection | null>(null);

  // Load connections from Supabase
  const loadConnections = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections`, {
        headers: {
          'x-user-id': userId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load connections');
      }
      
      const data = await response.json();
      setConnections(data.data || []);
      
      // Set first connection as active if none is selected
      if (data.data && data.data.length > 0) {
        console.log('🔍 ConnectionsContext - Definindo conexão ativa:', data.data[0]);
        setActiveConnection(data.data[0]);
      } else {
        console.log('❌ ConnectionsContext - Nenhuma conexão encontrada');
      }
    } catch (err: any) {
      console.error('Error loading connections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new connection
  const createConnection = useCallback(async (name: string, type: string, userId: string): Promise<WhatsAppConnection | null> => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ name, type })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create connection');
      }
      
      const data = await response.json();
      const newConnection = data.data;
      
      setConnections(prev => [...prev, newConnection]);
      setActiveConnection(newConnection);
      
      return newConnection;
    } catch (err: any) {
      console.error('Error creating connection:', err);
      setError(err.message);
      return null;
    }
  }, [API_URL]);

  // Delete connection
  const deleteConnection = useCallback(async (connectionId: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete connection');
      }
      
      const result = await response.json();
      
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
      
      return { success: true, data: result };
    } catch (err: any) {
      console.error('Error deleting connection:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [activeConnection, API_URL]);

  // Connect WhatsApp
  const connectWhatsApp = useCallback(async (connectionId: string) => {
    try {
      // This will trigger QR code generation
      await generateQRCode(connectionId);
    } catch (err: any) {
      console.error('Error connecting WhatsApp:', err);
      setError(err.message);
    }
  }, []);

  // Disconnect WhatsApp
  const disconnectWhatsApp = useCallback(async (connectionId: string, userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}/abort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }
      
      // Update local state
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, connectionState: 'disconnected', isConnected: false, qrCode: undefined }
            : conn
        )
      );
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(prev => prev ? { ...prev, connectionState: 'disconnected', isConnected: false, qrCode: undefined } : null);
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Error disconnecting WhatsApp:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [activeConnection, API_URL]);

  // Generate QR Code
  const generateQRCode = useCallback(async (connectionId: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}/qr`);
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const data = await response.json();
      return data.data?.qrCode || null;
    } catch (err: any) {
      console.error('Error generating QR code:', err);
      setError(err.message);
      return null;
    }
  }, [API_URL]);

  // Refresh QR Code
  const refreshQRCode = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${connectionId}/refresh-qr`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh QR code');
      }
    } catch (err: any) {
      console.error('Error refreshing QR code:', err);
      setError(err.message);
    }
  }, [API_URL]);

  // Modal management
  const openDisconnectModal = useCallback((connectionId: string) => {
    setConnectionToDisconnect(connectionId);
    setIsDisconnectModalOpen(true);
  }, []);

  const closeDisconnectModal = useCallback(() => {
    setIsDisconnectModalOpen(false);
    setConnectionToDisconnect(null);
  }, []);

  // Delete modal management
  const openDeleteConnectionModal = useCallback((connection: WhatsAppConnection) => {
    setDeleteConnectionData(connection);
    setShowDeleteConnectionModal(true);
  }, []);

  const closeDeleteConnectionModal = useCallback(() => {
    setShowDeleteConnectionModal(false);
    setDeleteConnectionData(null);
  }, []);

  // Socket.IO connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      path: '/socket.io'
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO');
    });

    newSocket.on('qrCode', (data: { connectionId: string; qrCode: string }) => {
      setConnections(prev => 
        prev.map(conn => 
          conn.id === data.connectionId 
            ? { ...conn, qrCode: data.qrCode, connectionState: 'connecting' }
            : conn
        )
      );
      
      if (activeConnection?.id === data.connectionId) {
        setActiveConnection(prev => prev ? { ...prev, qrCode: data.qrCode, connectionState: 'connecting' } : null);
      }
    });

    newSocket.on('connectionUpdate', (data: { connectionId: string; update: any }) => {
      if (data.update.connection === 'open') {
        setConnections(prev => 
          prev.map(conn => 
            conn.id === data.connectionId 
              ? { ...conn, connectionState: 'connected', isConnected: true, qrCode: undefined }
              : conn
          )
        );
        
        if (activeConnection?.id === data.connectionId) {
          setActiveConnection(prev => prev ? { ...prev, connectionState: 'connected', isConnected: true, qrCode: undefined } : null);
        }
      }
    });

    newSocket.on('connectionRemoved', (data: { connectionId: string }) => {
      setConnections(prev => prev.filter(conn => conn.id !== data.connectionId));
      
      if (activeConnection?.id === data.connectionId) {
        setActiveConnection(null);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [activeConnection]);

  // QR Code renewal with timeout
  const startQRCodeRenewal = useCallback((connectionId: string) => {
    const renewalInterval = setInterval(async () => {
      try {
        await refreshQRCode(connectionId);
      } catch (error) {
        console.error('Error renewing QR code:', error);
        clearInterval(renewalInterval);
      }
    }, 30000); // Renew every 30 seconds

    // Stop renewal after 90 seconds
    setTimeout(() => {
      clearInterval(renewalInterval);
    }, 90000);

    return renewalInterval;
  }, [refreshQRCode]);

  const value: ConnectionsContextType = {
    connections,
    activeConnection,
    loading,
    error,
    loadConnections,
    createConnection,
    deleteConnection,
    connectWhatsApp,
    disconnectWhatsApp,
    generateQRCode,
    refreshQRCode,
    openDisconnectModal,
    closeDisconnectModal,
    isDisconnectModalOpen,
    connectionToDisconnect,
    showDeleteConnectionModal,
    deleteConnectionData,
    openDeleteConnectionModal,
    closeDeleteConnectionModal
  };

  return (
    <ConnectionsContext.Provider value={value}>
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (context === undefined) {
    throw new Error('useConnections must be used within a ConnectionsProvider');
  }
  return context;
}