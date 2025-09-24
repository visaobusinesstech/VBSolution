import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  name: string;
  position: string;
  department: string;
  avatar_url: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    position: '',
    department: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('name, position, department, avatar_url')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = não encontrado
        throw fetchError;
      }

      if (data) {
        setProfile({
          name: data.name || '',
          position: data.position || '',
          department: data.department || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        // Se não existe perfil, usar dados básicos do usuário
        setProfile({
          name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          position: '',
          department: '',
          avatar_url: user.user_metadata?.avatar_url || ''
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Atualizar estado local
      setProfile(prev => ({ ...prev, ...updates }));
      
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carregar perfil quando usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile
  };
}
