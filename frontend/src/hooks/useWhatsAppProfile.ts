import { useState, useCallback, useEffect } from 'react';
import { useConnections } from '@/contexts/ConnectionsContext';

export interface WhatsAppProfile {
  jid: string;
  profilePictureUrl?: string;
  businessProfile?: {
    description?: string;
    category?: string;
    website?: string[];
    email?: string;
    businessHours?: any;
  };
  presence?: {
    lastSeen?: number;
    isOnline?: boolean;
    isTyping?: boolean;
  };
  name?: string;
  status?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useWhatsAppProfile() {
  const { activeConnection } = useConnections();
  const [profiles, setProfiles] = useState<Map<string, WhatsAppProfile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca a foto de perfil de um contato
   */
  const getProfilePicture = useCallback(async (jid: string, highRes: boolean = false): Promise<string | null> => {
    if (!activeConnection?.id) {
      console.error('❌ No connectionId available');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-profile/${activeConnection.id}/profile-picture/${encodeURIComponent(jid)}?highRes=${highRes}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao buscar foto de perfil');
      }

      const profilePictureUrl = data.data.profilePictureUrl;
      
      // Atualizar cache local
      setProfiles(prev => {
        const newProfiles = new Map(prev);
        const existingProfile = newProfiles.get(jid) || { jid };
        newProfiles.set(jid, {
          ...existingProfile,
          profilePictureUrl
        });
        return newProfiles;
      });

      return profilePictureUrl;
    } catch (error) {
      console.error('❌ Erro ao buscar foto de perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Busca o perfil de negócio de um contato
   */
  const getBusinessProfile = useCallback(async (jid: string): Promise<any | null> => {
    if (!activeConnection?.id) {
      console.error('❌ No connectionId available');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-profile/${activeConnection.id}/business-profile/${encodeURIComponent(jid)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao buscar perfil de negócio');
      }

      const businessProfile = data.data.businessProfile;
      
      // Atualizar cache local
      setProfiles(prev => {
        const newProfiles = new Map(prev);
        const existingProfile = newProfiles.get(jid) || { jid };
        newProfiles.set(jid, {
          ...existingProfile,
          businessProfile
        });
        return newProfiles;
      });

      return businessProfile;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil de negócio:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Busca informações de presença de um contato
   */
  const getPresence = useCallback(async (jid: string): Promise<any | null> => {
    if (!activeConnection?.id) {
      console.error('❌ No connectionId available');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-profile/${activeConnection.id}/presence/${encodeURIComponent(jid)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao buscar presença');
      }

      const presence = data.data.presence;
      
      // Atualizar cache local
      setProfiles(prev => {
        const newProfiles = new Map(prev);
        const existingProfile = newProfiles.get(jid) || { jid };
        newProfiles.set(jid, {
          ...existingProfile,
          presence
        });
        return newProfiles;
      });

      return presence;
    } catch (error) {
      console.error('❌ Erro ao buscar presença:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Busca informações completas do perfil
   */
  const getFullProfile = useCallback(async (jid: string): Promise<WhatsAppProfile | null> => {
    if (!activeConnection?.id) {
      console.error('❌ No connectionId available');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-profile/${activeConnection.id}/full-profile/${encodeURIComponent(jid)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao buscar perfil completo');
      }

      const profile = data.data;
      
      // Atualizar cache local
      setProfiles(prev => {
        const newProfiles = new Map(prev);
        newProfiles.set(jid, profile);
        return newProfiles;
      });

      return profile;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil completo:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualiza a foto de perfil
   */
  const updateProfilePicture = useCallback(async (jid: string, imageUrl: string): Promise<boolean> => {
    if (!activeConnection?.id) {
      console.error('❌ No connectionId available');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-profile/${activeConnection.id}/update-profile-picture/${encodeURIComponent(jid)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar foto de perfil');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar foto de perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Remove a foto de perfil
   */
  const removeProfilePicture = useCallback(async (jid: string): Promise<boolean> => {
    if (!activeConnection?.id) {
      console.error('❌ No connectionId available');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-profile/${activeConnection.id}/remove-profile-picture/${encodeURIComponent(jid)}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao remover foto de perfil');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao remover foto de perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualiza o nome do perfil
   */
  const updateProfileName = useCallback(async (name: string): Promise<boolean> => {
    if (!activeConnection?.id) {
      console.error('❌ No connectionId available');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-profile/${activeConnection.id}/update-profile-name`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar nome do perfil');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar nome do perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Atualiza o status do perfil
   */
  const updateProfileStatus = useCallback(async (status: string): Promise<boolean> => {
    if (!activeConnection?.id) {
      console.error('❌ No connectionId available');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/whatsapp-profile/${activeConnection.id}/update-profile-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar status do perfil');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar status do perfil:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeConnection?.id]);

  /**
   * Obtém um perfil do cache local
   */
  const getCachedProfile = useCallback((jid: string): WhatsAppProfile | undefined => {
    return profiles.get(jid);
  }, [profiles]);

  /**
   * Limpa o cache de perfis
   */
  const clearCache = useCallback(() => {
    setProfiles(new Map());
  }, []);

  return {
    // Estados
    profiles: Array.from(profiles.values()),
    loading,
    error,
    
    // Métodos
    getProfilePicture,
    getBusinessProfile,
    getPresence,
    getFullProfile,
    updateProfilePicture,
    removeProfilePicture,
    updateProfileName,
    updateProfileStatus,
    getCachedProfile,
    clearCache,
  };
}
