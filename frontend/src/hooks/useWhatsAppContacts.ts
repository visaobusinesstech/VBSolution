import { useState, useEffect, useCallback } from 'react';
import { useConnections } from '@/contexts/ConnectionsContext';
import { supabase } from '@/integrations/supabase/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface WhatsAppContact {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  email?: string;
  whatsapp_jid?: string;
  whatsapp_name?: string;
  whatsapp_profile_picture?: string;
  whatsapp_business_profile?: any;
  whatsapp_presence?: any;
  whatsapp_last_seen?: string;
  whatsapp_is_typing?: boolean;
  whatsapp_is_online?: boolean;
  whatsapp_connection_id?: string;
  whatsapp_registered_at?: string;
  whatsapp_message_count?: number;
  whatsapp_last_message_at?: string;
  whatsapp_last_message_content?: string;
  whatsapp_last_message_type?: string;
  status: string;
  whatsapp_opted: boolean;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_contact_at: string;
  
  // Campos de perfil de negócio
  whatsapp_business_name?: string;
  whatsapp_business_description?: string;
  whatsapp_business_category?: string;
  whatsapp_business_email?: string;
  whatsapp_business_website?: string;
  whatsapp_business_address?: string;
  whatsapp_verified?: boolean;
  whatsapp_blocked?: boolean;
  whatsapp_muted?: boolean;
  whatsapp_pinned?: boolean;
  whatsapp_archived?: boolean;
  whatsapp_status?: string;
  
  // Campos de grupo
  whatsapp_is_group?: boolean;
  whatsapp_group_subject?: string;
  whatsapp_group_description?: string;
  whatsapp_group_owner?: string;
  whatsapp_group_admins?: string; // JSON string
  whatsapp_group_participants?: string; // JSON string
  whatsapp_group_created?: string;
  whatsapp_group_settings?: string; // JSON string
  
  // Dados brutos
  whatsapp_raw_data?: string; // JSON string
}

export function useWhatsAppContacts() {
  const { activeConnection } = useConnections();
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar contatos do WhatsApp
   */
  const loadContacts = useCallback(async () => {
    if (!activeConnection?.owner_id) {
      setContacts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', activeConnection.owner_id)
        .not('whatsapp_jid', 'is', null)
        .order('last_contact_at', { ascending: false });

      if (error) {
        throw error;
      }

      setContacts(data || []);

    } catch (err: any) {
      console.error('❌ Erro ao carregar contatos:', err);
      setError(err.message || 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.owner_id]);

  /**
   * Sincronizar contatos do WhatsApp usando a nova API completa
   */
  const syncContacts = useCallback(async () => {
    if (!activeConnection?.id || !activeConnection?.owner_id) {
      throw new Error('Conexão ativa não encontrada');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando sincronização completa de contatos...');

      const response = await fetch(`${API_URL}/api/contact/sync-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          connectionId: activeConnection.id,
          ownerId: activeConnection.owner_id 
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao sincronizar contatos');
      }

      console.log('✅ Sincronização completa realizada:', data.data);

      // Recarregar contatos após sincronização
      await loadContacts();

      return data.data;

    } catch (err: any) {
      console.error('❌ Erro ao sincronizar contatos:', err);
      setError(err.message || 'Erro ao sincronizar contatos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id, activeConnection?.owner_id, loadContacts]);

  /**
   * Buscar contato por JID do WhatsApp
   */
  const findContactByJid = useCallback(async (jid: string): Promise<WhatsAppContact | null> => {
    if (!activeConnection?.owner_id) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/whatsapp-contacts/find-by-jid?ownerId=${activeConnection.owner_id}&jid=${encodeURIComponent(jid)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return null;
      }

      return data.data;

    } catch (err: any) {
      console.error('❌ Erro ao buscar contato por JID:', err);
      return null;
    }
  }, [activeConnection?.owner_id]);

  /**
   * Buscar contato por número de telefone
   */
  const findContactByPhone = useCallback(async (phone: string): Promise<WhatsAppContact | null> => {
    if (!activeConnection?.owner_id) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/whatsapp-contacts/find-by-phone?ownerId=${activeConnection.owner_id}&phone=${encodeURIComponent(phone)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return null;
      }

      return data.data;

    } catch (err: any) {
      console.error('❌ Erro ao buscar contato por telefone:', err);
      return null;
    }
  }, [activeConnection?.owner_id]);

  /**
   * Atualizar presença de um contato
   */
  const updateContactPresence = useCallback(async (
    contactId: string,
    presence: any,
    isOnline: boolean,
    isTyping: boolean
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp-contacts/${contactId}/presence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presence, isOnline, isTyping })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar presença');
      }

      // Atualizar contato na lista local
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, whatsapp_presence: presence, whatsapp_is_online: isOnline, whatsapp_is_typing: isTyping }
          : contact
      ));

      return data.data;

    } catch (err: any) {
      console.error('❌ Erro ao atualizar presença:', err);
      throw err;
    }
  }, []);

  /**
   * Atualizar foto de perfil de um contato
   */
  const updateContactProfilePicture = useCallback(async (
    contactId: string,
    profilePictureUrl: string
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp-contacts/${contactId}/profile-picture`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePictureUrl })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar foto de perfil');
      }

      // Atualizar contato na lista local
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, whatsapp_profile_picture: profilePictureUrl }
          : contact
      ));

      return data.data;

    } catch (err: any) {
      console.error('❌ Erro ao atualizar foto de perfil:', err);
      throw err;
    }
  }, []);

  /**
   * Registrar contato automaticamente
   */
  const registerContact = useCallback(async (contactData: {
    jid: string;
    phone: string;
    whatsappName?: string;
    connectionId: string;
    lastMessageContent?: string;
    lastMessageType?: string;
    lastMessageAt?: string;
  }) => {
    if (!activeConnection?.owner_id) {
      throw new Error('Conexão ativa não encontrada');
    }

    try {
      const response = await fetch(`${API_URL}/api/whatsapp-contacts/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...contactData,
          ownerId: activeConnection.owner_id
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao registrar contato');
      }

      // Adicionar contato à lista local
      setContacts(prev => [data.data, ...prev]);

      return data.data;

    } catch (err: any) {
      console.error('❌ Erro ao registrar contato:', err);
      throw err;
    }
  }, [activeConnection?.owner_id]);

  /**
   * Filtrar contatos por status
   */
  const getContactsByStatus = useCallback((status: string) => {
    return contacts.filter(contact => contact.status === status);
  }, [contacts]);

  /**
   * Filtrar contatos online
   */
  const getOnlineContacts = useCallback(() => {
    return contacts.filter(contact => contact.whatsapp_is_online);
  }, [contacts]);

  /**
   * Filtrar contatos com IA habilitada
   */
  const getAIContacts = useCallback(() => {
    return contacts.filter(contact => contact.ai_enabled);
  }, [contacts]);

  /**
   * Buscar contatos por nome ou telefone
   */
  const searchContacts = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.name?.toLowerCase().includes(lowerQuery) ||
      contact.phone?.includes(query) ||
      contact.whatsapp_name?.toLowerCase().includes(lowerQuery)
    );
  }, [contacts]);

  // Carregar contatos quando a conexão mudar
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Escutar eventos de contatos via Socket.IO
  useEffect(() => {
    const handleContactCreated = (data: any) => {
      console.log('📞 Novo contato criado:', data.contact);
      setContacts(prev => [data.contact, ...prev]);
    };

    const handleContactUpdated = (data: any) => {
      console.log('📞 Contato atualizado:', data.contact);
      setContacts(prev => prev.map(contact => 
        contact.id === data.contact.id ? data.contact : contact
      ));
    };

    // Aqui você pode adicionar listeners do Socket.IO se necessário
    // socket.on('contact:created', handleContactCreated);
    // socket.on('contact:updated', handleContactUpdated);

    return () => {
      // Cleanup listeners se necessário
    };
  }, []);

  return {
    // Estados
    contacts,
    loading,
    error,
    
    // Ações
    loadContacts,
    syncContacts,
    findContactByJid,
    findContactByPhone,
    updateContactPresence,
    updateContactProfilePicture,
    registerContact,
    
    // Filtros
    getContactsByStatus,
    getOnlineContacts,
    getAIContacts,
    searchContacts,
    
    // Estatísticas
    totalContacts: contacts.length,
    onlineContacts: getOnlineContacts().length,
    aiContacts: getAIContacts().length
  };
}
