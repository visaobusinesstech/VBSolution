import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  end_date?: string;
  due_date?: string;
  budget?: number;
  currency?: string;
  responsible_id?: string;
  company_id?: string;
  tags?: string[];
  progress?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  archived?: boolean; // Campo opcional para compatibilidade
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async (filters?: { search?: string; archived?: boolean; responsible_id?: string; work_group?: string; start_date?: string; end_date?: string }) => {
    if (!user) {
      console.log('useProjects: Usuário não autenticado');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('useProjects: Buscando projetos para usuário:', user.id);
      console.log('useProjects: URL do Supabase:', supabase.supabaseUrl);
      
      let query = supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id);

      // Aplicar filtros
      if (filters) {
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.trim();
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        if (filters.archived !== undefined) {
          query = query.eq('archived', filters.archived);
        }
        if (filters.responsible_id && filters.responsible_id !== 'all') {
          query = query.eq('responsible_id', filters.responsible_id);
        }
        if (filters.work_group && filters.responsible_id !== 'all') {
          query = query.eq('work_group', filters.work_group);
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
        console.error('useProjects: Erro Supabase ao buscar projetos:', error);
        throw error;
      }
      
      console.log('useProjects: Projetos encontrados:', data);
      setProjects(data || []);
    } catch (err) {
      console.error('useProjects: Erro ao buscar projetos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar projetos');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      console.log('useProjects: Usuário não autenticado para criar projeto');
      throw new Error('Usuário não autenticado');
    }
    
    try {
      console.log('useProjects: Dados recebidos para criação:', projectData);
      console.log('useProjects: Usuário autenticado:', user.id);
      console.log('useProjects: URL do Supabase:', supabase.supabaseUrl);
      
      // Preparar dados para inserção
      const projectToInsert = {
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        priority: projectData.priority,
        owner_id: user.id,
        currency: projectData.currency || 'BRL',
        progress: projectData.progress || 0,
        start_date: projectData.start_date || null,
        due_date: projectData.due_date || null,
        budget: projectData.budget || null,
        company_id: projectData.company_id || null,
        tags: projectData.tags || [],
        notes: projectData.notes || ''
      };

      console.log('useProjects: Dados para inserção:', projectToInsert);

      const { data, error } = await supabase
        .from('projects')
        .insert([projectToInsert])
        .select()
        .single();

      if (error) {
        console.error('useProjects: Erro Supabase ao criar projeto:', error);
        console.error('useProjects: Código do erro:', error.code);
        console.error('useProjects: Mensagem do erro:', error.message);
        console.error('useProjects: Detalhes do erro:', error.details);
        throw error;
      }
      
      console.log('useProjects: Projeto inserido com sucesso:', data);
      
      // Recarregar dados imediatamente para atualizar a lista
      await fetchProjects();
      return data;
    } catch (err) {
      console.error('useProjects: Erro ao criar projeto:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchProjects(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar projeto');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchProjects(); // Recarregar dados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir projeto');
      throw err;
    }
  };

  const getProjectsByStatus = (status: Project['status']) => {
    return projects.filter(project => project.status === status);
  };

  const getProjectsByPriority = (priority: Project['priority']) => {
    return projects.filter(project => project.priority === priority);
  };

  const getActiveProjects = () => {
    return projects.filter(project => project.status === 'active');
  };

  const getOverdueProjects = () => {
    const now = new Date();
    return projects.filter(project => 
      project.due_date && 
      project.status !== 'completed' && 
      new Date(project.due_date) < now
    );
  };

  const getProjectsByCompany = (companyId: string) => {
    return projects.filter(project => project.company_id === companyId);
  };

  const updateProjectProgress = async (id: string, progress: number) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ progress: Math.max(0, Math.min(100, progress)) })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchProjects(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar progresso do projeto');
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProjectsByStatus,
    getProjectsByPriority,
    getActiveProjects,
    getOverdueProjects,
    getProjectsByCompany,
    updateProjectProgress,
    refetch: fetchProjects
  };
};
