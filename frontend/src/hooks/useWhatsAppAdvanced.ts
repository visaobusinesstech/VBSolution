import { useState, useCallback, useEffect } from 'react';
import { useConnections } from '@/contexts/ConnectionsContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface MediaMessage {
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  url?: string;
  stream?: Buffer;
  caption?: string;
  mimetype?: string;
  fileName?: string;
  gifPlayback?: boolean;
  ptt?: boolean;
}

export interface PollMessage {
  name: string;
  values: string[];
  selectableCount: number;
  toAnnouncementGroup?: boolean;
}

export interface LocationMessage {
  degreesLatitude: number;
  degreesLongitude: number;
  name?: string;
  address?: string;
}

export interface ContactMessage {
  displayName: string;
  contacts: Array<{
    vcard: string;
  }>;
}

export interface GroupMetadata {
  id: string;
  subject: string;
  desc?: string;
  participants: Array<{
    id: string;
    admin?: string;
  }>;
  owner?: string;
  creation?: number;
}

export function useWhatsAppAdvanced() {
  const { activeConnection } = useConnections();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Conectar com configurações avançadas
   */
  const connectAdvanced = useCallback(async (config: {
    authPath?: string;
    enableLogging?: boolean;
    enableStore?: boolean;
    enableGroupCache?: boolean;
    markOnlineOnConnect?: boolean;
  } = {}) => {
    if (!activeConnection?.id) {
      throw new Error('Nenhuma conexão ativa');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao conectar');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Enviar mensagem de texto
   */
  const sendTextMessage = useCallback(async (jid: string, text: string, options?: any) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/send-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, text, options })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar mensagem');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao enviar texto:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Enviar mensagem de mídia
   */
  const sendMediaMessage = useCallback(async (jid: string, media: MediaMessage, file?: File) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('jid', jid);
      formData.append('type', media.type);
      
      if (media.caption) formData.append('caption', media.caption);
      if (media.mimetype) formData.append('mimetype', media.mimetype);
      if (media.fileName) formData.append('fileName', media.fileName);
      if (media.gifPlayback) formData.append('gifPlayback', media.gifPlayback.toString());
      if (media.ptt) formData.append('ptt', media.ptt.toString());
      if (media.url) formData.append('url', media.url);
      
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/send-media`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar mídia');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao enviar mídia:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Enviar mensagem de localização
   */
  const sendLocationMessage = useCallback(async (jid: string, location: LocationMessage) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/send-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, ...location })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar localização');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao enviar localização:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Enviar mensagem de contato
   */
  const sendContactMessage = useCallback(async (jid: string, contact: ContactMessage) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/send-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, ...contact })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar contato');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao enviar contato:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Enviar enquete
   */
  const sendPollMessage = useCallback(async (jid: string, poll: PollMessage) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/send-poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, ...poll })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar enquete');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao enviar enquete:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Reagir a mensagem
   */
  const reactToMessage = useCallback(async (jid: string, messageKey: any, emoji: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, messageKey, emoji })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao reagir');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao reagir:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Fixar mensagem
   */
  const pinMessage = useCallback(async (jid: string, messageKey: any, timeInSeconds: number = 86400) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, messageKey, timeInSeconds })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao fixar mensagem');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao fixar mensagem:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Marcar mensagens como lidas
   */
  const markMessagesAsRead = useCallback(async (jid: string, messageKeys: any[]) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, messageKeys })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao marcar como lida');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualizar presença
   */
  const updatePresence = useCallback(async (presence: 'available' | 'composing' | 'recording' | 'paused', jid?: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presence, jid })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar presença');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao atualizar presença:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Obter foto de perfil
   */
  const getProfilePicture = useCallback(async (jid: string, highRes: boolean = false): Promise<string | null> => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-advanced/${activeConnection.id}/profile-picture/${encodeURIComponent(jid)}?highRes=${highRes}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter foto de perfil');
      }

      return data.data.profilePictureUrl;
    } catch (error) {
      console.error('❌ Erro ao obter foto de perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Obter perfil de negócio
   */
  const getBusinessProfile = useCallback(async (jid: string): Promise<any> => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-advanced/${activeConnection.id}/business-profile/${encodeURIComponent(jid)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter perfil de negócio');
      }

      return data.data.businessProfile;
    } catch (error) {
      console.error('❌ Erro ao obter perfil de negócio:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Inscrever-se em presença
   */
  const subscribeToPresence = useCallback(async (jid: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/subscribe-presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao inscrever-se em presença');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao inscrever-se em presença:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualizar nome do perfil
   */
  const updateProfileName = useCallback(async (name: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/update-profile-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar nome do perfil');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao atualizar nome do perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualizar status do perfil
   */
  const updateProfileStatus = useCallback(async (status: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/update-profile-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar status do perfil');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao atualizar status do perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualizar foto de perfil
   */
  const updateProfilePicture = useCallback(async (jid: string, imageFile: File | string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('jid', jid);
      
      if (typeof imageFile === 'string') {
        formData.append('url', imageFile);
      } else {
        formData.append('image', imageFile);
      }

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/update-profile-picture`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar foto de perfil');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao atualizar foto de perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Remover foto de perfil
   */
  const removeProfilePicture = useCallback(async (jid: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/remove-profile-picture`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao remover foto de perfil');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao remover foto de perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Verificar se ID existe no WhatsApp
   */
  const checkWhatsAppId = useCallback(async (jid: string): Promise<boolean> => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-advanced/${activeConnection.id}/check-whatsapp-id/${encodeURIComponent(jid)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao verificar ID do WhatsApp');
      }

      return data.data.exists;
    } catch (error) {
      console.error('❌ Erro ao verificar ID do WhatsApp:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Obter metadados do grupo
   */
  const getGroupMetadata = useCallback(async (jid: string): Promise<GroupMetadata | null> => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-advanced/${activeConnection.id}/group-metadata/${encodeURIComponent(jid)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter metadados do grupo');
      }

      return data.data.metadata;
    } catch (error) {
      console.error('❌ Erro ao obter metadados do grupo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Criar grupo
   */
  const createGroup = useCallback(async (subject: string, participants: string[]) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/create-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, participants })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao criar grupo');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Erro ao criar grupo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualizar participantes do grupo
   */
  const updateGroupParticipants = useCallback(async (jid: string, participants: string[], action: 'add' | 'remove' | 'promote' | 'demote') => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/update-group-participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, participants, action })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar participantes do grupo');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao atualizar participantes do grupo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualizar assunto do grupo
   */
  const updateGroupSubject = useCallback(async (jid: string, subject: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/update-group-subject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, subject })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar assunto do grupo');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao atualizar assunto do grupo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualizar descrição do grupo
   */
  const updateGroupDescription = useCallback(async (jid: string, description: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/update-group-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, description })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar descrição do grupo');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao atualizar descrição do grupo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Sair do grupo
   */
  const leaveGroup = useCallback(async (jid: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/leave-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao sair do grupo');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao sair do grupo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Obter código de convite do grupo
   */
  const getGroupInviteCode = useCallback(async (jid: string): Promise<string> => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-advanced/${activeConnection.id}/group-invite-code/${encodeURIComponent(jid)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter código de convite');
      }

      return data.data.code;
    } catch (error) {
      console.error('❌ Erro ao obter código de convite:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Revogar código de convite do grupo
   */
  const revokeGroupInviteCode = useCallback(async (jid: string): Promise<string> => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/revoke-group-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao revogar código de convite');
      }

      return data.data.newCode;
    } catch (error) {
      console.error('❌ Erro ao revogar código de convite:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Aceitar convite do grupo
   */
  const acceptGroupInvite = useCallback(async (code: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/accept-group-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao aceitar convite');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Erro ao aceitar convite:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Obter informações do convite do grupo
   */
  const getGroupInviteInfo = useCallback(async (code: string) => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-advanced/${activeConnection.id}/group-invite-info/${encodeURIComponent(code)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter informações do convite');
      }

      return data.data.info;
    } catch (error) {
      console.error('❌ Erro ao obter informações do convite:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Bloquear/desbloquear usuário
   */
  const updateBlockStatus = useCallback(async (jid: string, action: 'block' | 'unblock') => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/block-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid, action })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao bloquear/desbloquear usuário');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao bloquear/desbloquear usuário:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Obter configurações de privacidade
   */
  const getPrivacySettings = useCallback(async () => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-advanced/${activeConnection.id}/privacy-settings`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter configurações de privacidade');
      }

      return data.data;
    } catch (error) {
      console.error('❌ Erro ao obter configurações de privacidade:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Obter lista de bloqueados
   */
  const getBlockList = useCallback(async (): Promise<string[]> => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-advanced/${activeConnection.id}/block-list`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao obter lista de bloqueados');
      }

      return data.data.blockList;
    } catch (error) {
      console.error('❌ Erro ao obter lista de bloqueados:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Desconectar
   */
  const disconnect = useCallback(async () => {
    if (!activeConnection?.id) throw new Error('Nenhuma conexão ativa');

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/whatsapp-advanced/${activeConnection.id}/disconnect`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao desconectar');
      }

      return data.result;
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  return {
    // Estados
    loading,
    error,
    
    // Conexão
    connectAdvanced,
    disconnect,
    
    // Mensagens
    sendTextMessage,
    sendMediaMessage,
    sendLocationMessage,
    sendContactMessage,
    sendPollMessage,
    reactToMessage,
    pinMessage,
    markMessagesAsRead,
    
    // Presença
    updatePresence,
    subscribeToPresence,
    
    // Perfil
    getProfilePicture,
    getBusinessProfile,
    updateProfileName,
    updateProfileStatus,
    updateProfilePicture,
    removeProfilePicture,
    
    // Verificações
    checkWhatsAppId,
    
    // Grupos
    getGroupMetadata,
    createGroup,
    updateGroupParticipants,
    updateGroupSubject,
    updateGroupDescription,
    leaveGroup,
    getGroupInviteCode,
    revokeGroupInviteCode,
    acceptGroupInvite,
    getGroupInviteInfo,
    
    // Privacidade
    updateBlockStatus,
    getPrivacySettings,
    getBlockList,
  };
}
