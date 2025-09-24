import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WorkGroupMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  position: string;
  avatar?: string;
}

export interface WorkGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  photo?: string;
  sector: string;
  members: WorkGroupMember[];
  tasksCount: number;
  completedTasks: number;
  activeProjects: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkGroupContextType {
  workGroups: WorkGroup[];
  addWorkGroup: (workGroup: Omit<WorkGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWorkGroup: (id: string, updates: Partial<WorkGroup>) => Promise<void>;
  deleteWorkGroup: (id: string) => Promise<void>;
  getWorkGroupById: (id: string) => WorkGroup | undefined;
  loading: boolean;
}

const WorkGroupContext = createContext<WorkGroupContextType | undefined>(undefined);

export const useWorkGroup = () => {
  const context = useContext(WorkGroupContext);
  if (context === undefined) {
    throw new Error('useWorkGroup must be used within a WorkGroupProvider');
  }
  return context;
};

interface WorkGroupProviderProps {
  children: ReactNode;
}

// Dados iniciais vazios - serão carregados do Supabase
const initialWorkGroups: WorkGroup[] = [];

export const WorkGroupProvider: React.FC<WorkGroupProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>(initialWorkGroups);
  const [loading, setLoading] = useState(true);

  // Carregar dados do Supabase
  useEffect(() => {
    if (user) {
      fetchWorkGroups();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchWorkGroups = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar empresa do usuário
      const { data: companyData, error: companyError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      if (companyData?.company_id) {
        // Buscar grupos de trabalho da empresa
        const { data: workGroupsData, error: workGroupsError } = await supabase
          .from('work_groups')
          .select(`
            *,
            work_group_members (
              *,
              profiles (*)
            )
          `)
          .eq('company_id', companyData.company_id);

        if (workGroupsError) throw workGroupsError;

        // Converter dados do Supabase para o formato esperado
        const formattedWorkGroups = (workGroupsData || []).map(wg => ({
          id: wg.id,
          name: wg.name,
          description: wg.description || '',
          color: wg.color,
          photo: wg.photo_url || '',
          sector: wg.sector || '',
          members: (wg.work_group_members || []).map(member => ({
            id: member.profiles?.id || member.user_id,
            name: member.profiles?.name || 'Usuário',
            initials: member.profiles?.name ? member.profiles.name.substring(0, 2).toUpperCase() : 'U',
            email: member.profiles?.email || '',
            position: member.position || ''
          })),
          tasksCount: 0, // Será implementado quando tivermos tabela de tarefas
          completedTasks: 0,
          activeProjects: 0,
          createdAt: new Date(wg.created_at),
          updatedAt: new Date(wg.updated_at)
        }));

        setWorkGroups(formattedWorkGroups);
      }
    } catch (err) {
      console.error('Erro ao buscar grupos de trabalho:', err);
    } finally {
      setLoading(false);
    }
  };

  const addWorkGroup = async (workGroupData: Omit<WorkGroup, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      // Buscar empresa do usuário
      const { data: companyData, error: companyError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      if (companyData?.company_id) {
        // Criar grupo de trabalho no Supabase
        const { data: newWorkGroup, error: createError } = await supabase
          .from('work_groups')
          .insert([{
            name: workGroupData.name,
            description: workGroupData.description,
            color: workGroupData.color,
            sector: workGroupData.sector,
            company_id: companyData.company_id
          }])
          .select()
          .single();

        if (createError) throw createError;

        // Recarregar dados
        await fetchWorkGroups();
      }
    } catch (err) {
      console.error('Erro ao criar grupo de trabalho:', err);
    }
  };

  const updateWorkGroup = async (id: string, updates: Partial<WorkGroup>) => {
    try {
      const { error } = await supabase
        .from('work_groups')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          sector: updates.sector
        })
        .eq('id', id);

      if (error) throw error;

      // Recarregar dados
      await fetchWorkGroups();
    } catch (err) {
      console.error('Erro ao atualizar grupo de trabalho:', err);
    }
  };

  const deleteWorkGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('work_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Recarregar dados
      await fetchWorkGroups();
    } catch (err) {
      console.error('Erro ao deletar grupo de trabalho:', err);
    }
  };

  const getWorkGroupById = (id: string) => {
    return workGroups.find(group => group.id === id);
  };

  const value: WorkGroupContextType = {
    workGroups,
    addWorkGroup,
    updateWorkGroup,
    deleteWorkGroup,
    getWorkGroupById,
    loading,
  };

  return (
    <WorkGroupContext.Provider value={value}>
      {children}
    </WorkGroupContext.Provider>
  );
};
