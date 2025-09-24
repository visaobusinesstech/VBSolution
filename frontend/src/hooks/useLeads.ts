import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  assigned_to?: string;
  value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar leads
  const fetchLeads = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VB_DEV_TOKEN',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar leads');
      }

      const data = await response.json();
      
      if (data.success) {
        setLeads(data.data);
      } else {
        throw new Error(data.error || 'Erro ao buscar leads');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar leads:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Criar lead
  const createLead = useCallback(async (leadData: Partial<Lead>): Promise<Lead | null> => {
    if (!user?.id) return null;

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VB_DEV_TOKEN',
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar lead');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchLeads(); // Recarregar lista
        return data.data;
      } else {
        throw new Error(data.error || 'Erro ao criar lead');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao criar lead:', err);
      return null;
    }
  }, [user?.id, fetchLeads]);

  // Atualizar lead
  const updateLead = useCallback(async (leadId: string, leadData: Partial<Lead>): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VB_DEV_TOKEN',
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar lead');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchLeads(); // Recarregar lista
        return true;
      } else {
        throw new Error(data.error || 'Erro ao atualizar lead');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar lead:', err);
      return false;
    }
  }, [user?.id, fetchLeads]);

  // Deletar lead
  const deleteLead = useCallback(async (leadId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id,
          'Content-Type': 'application/json',
          'Authorization': 'Bearer VB_DEV_TOKEN',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar lead');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchLeads(); // Recarregar lista
        return true;
      } else {
        throw new Error(data.error || 'Erro ao deletar lead');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar lead:', err);
      return false;
    }
  }, [user?.id, fetchLeads]);

  // Buscar lead por ID
  const getLeadById = useCallback((leadId: string): Lead | undefined => {
    return leads.find(lead => lead.id === leadId);
  }, [leads]);

  // Buscar leads por status
  const getLeadsByStatus = useCallback((status: Lead['status']): Lead[] => {
    return leads.filter(lead => lead.status === status);
  }, [leads]);

  // Carregar leads iniciais
  useEffect(() => {
    if (user?.id) {
      fetchLeads();
    }
  }, [user?.id, fetchLeads]);

  return {
    leads,
    loading,
    error,
    createLead,
    updateLead,
    deleteLead,
    getLeadById,
    getLeadsByStatus,
    refreshLeads: fetchLeads,
  };
}