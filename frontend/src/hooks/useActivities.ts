import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Activity {
  id: string;
  owner_id: string; // Mudança: usar owner_id em vez de created_by
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  due_date: string | null;
  start_date: string | null;
  end_date: string | null;
  responsible_id: string | null;
  company_id: string | null;
  project_id: string | null;
  work_group: string | null;
  department: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  attachments: any | null;
  comments: any | null;
  progress: number;
  is_urgent: boolean;
  is_public: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityData {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  responsible_id?: string;
  company_id?: string;
  project_id?: string;
  work_group?: string;
  department?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  attachments?: any;
  comments?: any;
  progress?: number;
  is_urgent?: boolean;
  is_public?: boolean;
  notes?: string;
}

export interface UpdateActivityData extends Partial<CreateActivityData> {}

export interface ActivityFilters {
  status?: string;
  priority?: string;
  type?: string;
  responsible_id?: string;
  company_id?: string;
  project_id?: string;
  work_group?: string;
  department?: string;
  is_urgent?: boolean;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getProfile } = useAuth();

  // Função para obter o company_id do usuário logado
  const getCompanyId = useCallback(async () => {
    try {
      const { profile } = await getProfile();
      if (!profile) {
        throw new Error('Usuário não autenticado');
      }
      
      // Se não tiver company_id, tentar buscar na tabela user_profiles
      if (!profile.company_id) {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', profile.id)
          .single();
        
        if (!userProfileError && userProfile?.company_id) {
          return userProfile.company_id;
        }
        
        // Se ainda não tiver, usar null (permitir criação sem empresa)
        return null;
      }
      
      return profile.company_id;
    } catch (error) {
      console.error('Erro ao obter company_id:', error);
      // Em caso de erro, permitir criação sem empresa
      return null;
    }
  }, [getProfile]);

  // Função para obter o ID do usuário logado
  const getOwnerId = useCallback(async () => {
    try {
      const { profile } = await getProfile();
      if (!profile) {
        throw new Error('Usuário não autenticado');
      }
      return profile.id;
    } catch (error) {
      console.error('Erro ao obter owner_id:', error);
      throw error;
    }
  }, [getProfile]);

  // Buscar todas as atividades do usuário
  const fetchActivities = useCallback(async (filters?: ActivityFilters) => {
    try {
      setLoading(true);
      setError(null);

      const companyId = await getCompanyId();
      const ownerId = await getOwnerId();

      let query = supabase
        .from('activities')
        .select('*');
      
      // Filtrar por empresa se disponível, senão filtrar por usuário
      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        query = query.eq('owner_id', ownerId);
      }

      // Aplicar filtros
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.responsible_id) {
          query = query.eq('responsible_id', filters.responsible_id);
        }
        if (filters.company_id) {
          query = query.eq('company_id', filters.company_id);
        }
        if (filters.project_id) {
          query = query.eq('project_id', filters.project_id);
        }
        if (filters.work_group) {
          query = query.eq('work_group', filters.work_group);
        }
        if (filters.department) {
          query = query.eq('department', filters.department);
        }
        if (filters.is_urgent !== undefined) {
          query = query.eq('is_urgent', filters.is_urgent);
        }
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.trim();
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        if (filters.start_date) {
          query = query.gte('due_date', filters.start_date);
        }
        if (filters.end_date) {
          query = query.lte('due_date', filters.end_date);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar atividades:', error);
        throw error;
      }

      setActivities(data || []);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar atividades';
      setError(errorMessage);
      console.error('Erro ao buscar atividades:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getCompanyId, getOwnerId]);

  // Criar nova atividade - versão simplificada e robusta
  const createActivity = useCallback(async (activityData: CreateActivityData) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verificar autenticação
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Verificar se o usuário existe na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // 2. Buscar company_id de forma simples
      let companyId = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!profileError && profileData?.company_id) {
          companyId = profileData.company_id;
        } else {
          // Tentar user_profiles como fallback
          const { data: userProfileData, error: userProfileError } = await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

          if (!userProfileError && userProfileData?.company_id) {
            companyId = userProfileData.company_id;
          }
        }
      } catch (profileErr) {
        // Ignorar erro e continuar
      }

      // 3. Preparar dados mínimos necessários
      const insertData = {
        title: activityData.title || 'Atividade sem título',
        description: activityData.description || null,
        type: activityData.type || 'task',
        priority: activityData.priority || 'medium',
        status: activityData.status || 'todo', // Mudança: usar 'todo' como padrão
        owner_id: user.id, // Usar ID do usuário autenticado
        company_id: companyId || activityData.company_id || null,
        // Campos opcionais
        due_date: activityData.due_date || null,
        responsible_id: activityData.responsible_id || null,
        project_id: activityData.project_id || null,
        work_group: activityData.work_group || null,
        department: activityData.department || null,
        progress: 0,
        is_urgent: false,
        is_public: false,
      };

      // 4. Inserir diretamente no Supabase
      const { data, error } = await supabase
        .from('activities')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        // Tratar erros específicos
        if (error.code === '42501') {
          throw new Error('Permissão negada: Verifique as políticas RLS da tabela activities');
        } else if (error.code === 'PGRST116') {
          throw new Error('Tabela activities não encontrada: Verifique se a tabela existe no Supabase');
        } else if (error.code === '23505') {
          throw new Error('Atividade duplicada: Já existe uma atividade com estes dados');
        } else {
          throw new Error(`Erro ao criar atividade: ${error.message}`);
        }
      }
      
      // 5. Atualizar estado local
      setActivities(prev => [data, ...prev]);
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado ao criar atividade';
      setError(errorMessage);
      console.error('Erro ao criar atividade:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar atividade existente
  const updateActivity = useCallback(async (id: string, updates: UpdateActivityData) => {
    try {
      setLoading(true);
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', ownerId) // Garantir que só atualiza atividades próprias
        .select()
        .single();

      if (error) {
        throw error;
      }

      setActivities(prev => prev.map(activity => 
        activity.id === id ? data : activity
      ));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar atividade';
      setError(errorMessage);
      console.error('Erro ao atualizar atividade:', err);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getCompanyId]);

  // Excluir atividade
  const deleteActivity = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const ownerId = await getOwnerId();

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('owner_id', ownerId); // Garantir que só exclui atividades próprias

      if (error) {
        throw error;
      }

      setActivities(prev => prev.filter(activity => activity.id !== id));
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir atividade';
      setError(errorMessage);
      console.error('Erro ao excluir atividade:', err);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getCompanyId]);

  // Buscar atividade por ID
  const getActivityById = useCallback(async (id: string) => {
    try {
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .eq('owner_id', ownerId) // Garantir que só busca atividades próprias
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar atividade';
      setError(errorMessage);
      console.error('Erro ao buscar atividade:', err);
      return { data: null, error: errorMessage };
    }
  }, [getCompanyId]);

  // Atualizar progresso de uma atividade
  const updateActivityProgress = useCallback(async (id: string, progress: number) => {
    try {
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('activities')
        .update({
          progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setActivities(prev => prev.map(activity => 
        activity.id === id ? data : activity
      ));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar progresso';
      setError(errorMessage);
      console.error('Erro ao atualizar progresso:', err);
      return { data: null, error: errorMessage };
    }
  }, [getCompanyId]);

  // Marcar atividade como urgente/não urgente
  const toggleUrgent = useCallback(async (id: string, isUrgent: boolean) => {
    try {
      setError(null);

      const ownerId = await getOwnerId();

      const { data, error } = await supabase
        .from('activities')
        .update({
          is_urgent: isUrgent,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setActivities(prev => prev.map(activity => 
        activity.id === id ? data : activity
      ));

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar urgência';
      setError(errorMessage);
      console.error('Erro ao alterar urgência:', err);
      return { data: null, error: errorMessage };
    }
  }, [getCompanyId]);

  // Carregar atividades ao inicializar - versão simplificada
  useEffect(() => {
    let isMounted = true;
    
    const loadActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const { profile } = await getProfile();
        if (!profile) {
          throw new Error('Usuário não autenticado');
        }
        
        // Buscar company_id
        let companyId = profile.company_id;
        if (!companyId) {
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('company_id')
            .eq('id', profile.id)
            .single();
          companyId = userProfile?.company_id || null;
        }

        let query = supabase
          .from('activities')
          .select('*');
        
        // Filtrar por empresa se disponível, senão filtrar por usuário
        if (companyId) {
          query = query.eq('company_id', companyId);
        } else {
          query = query.eq('owner_id', profile.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (isMounted) {
          setActivities(data || []);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar atividades';
          setError(errorMessage);
          console.error('Erro ao buscar atividades:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadActivities();
    
    return () => {
      isMounted = false;
    };
  }, []); // Remover getProfile da dependência para evitar loops


  // Função para mover atividade entre status (drag and drop) - SIMPLIFICADA
  const moveActivity = useCallback(async (activityId: string, newStatus: string) => {
    try {
      setError(null);

      // Usar a função updateActivity existente que já funciona
      const result = await updateActivity(activityId, { status: newStatus });
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao mover atividade';
      setError(errorMessage);
      console.error('Erro ao mover atividade:', err);
      return { data: null, error: errorMessage };
    }
  }, [updateActivity]);



  // Função para recarregar atividades (alias para fetchActivities)
  const refetch = useCallback(() => {
    return fetchActivities();
  }, [fetchActivities]);

  // Debug simplificado apenas quando necessário
  if (process.env.NODE_ENV === 'development' && activities.length > 0) {
    console.log('📊 Atividades carregadas:', activities.length);
  }

  return {
    activities,
    loading,
    error,
    fetchActivities,
    refetch,
    createActivity,
    updateActivity,
    deleteActivity,
    moveActivity,
    getActivityById,
    updateActivityProgress,
    toggleUrgent,
  };
}
