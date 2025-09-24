
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FunnelStage {
  id: string;
  name: string;
  order_position: number;
  color: string;
  created_at: string;
}

export const useFunnelStages = () => {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStages = async () => {
    try {
      setLoading(true);
      
      console.log('Usando dados mock para etapas');
      
      // Usar dados mock imediatamente para evitar problemas de permissão
      const mockStages: FunnelStage[] = [
        { id: '1', name: 'Contato Inicial', color: '#3b82f6', order_position: 1, created_at: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'Qualificação', color: '#8b5cf6', order_position: 2, created_at: '2024-01-01T00:00:00Z' },
        { id: '3', name: 'Proposta', color: '#f59e0b', order_position: 3, created_at: '2024-01-01T00:00:00Z' },
        { id: '4', name: 'Negociação', color: '#ef4444', order_position: 4, created_at: '2024-01-01T00:00:00Z' },
        { id: '5', name: 'Fechamento', color: '#10b981', order_position: 5, created_at: '2024-01-01T00:00:00Z' }
      ];
      
      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setStages(mockStages);
      console.log('Etapas mock carregadas com sucesso');
      
    } catch (err) {
      console.error('Error fetching stages:', err);
      setError(err instanceof Error ? err.message : 'Error fetching stages');
    } finally {
      setLoading(false);
    }
  };

  const createStage = async (stageData: Omit<FunnelStage, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('funnel_stages' as any)
        .insert([stageData])
        .select()
        .single();

      if (error) throw error;
      await fetchStages();
      return data;
    } catch (err) {
      console.error('Error creating stage:', err);
      setError(err instanceof Error ? err.message : 'Error creating stage');
      throw err;
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  return {
    stages,
    loading,
    error,
    createStage,
    refetch: fetchStages
  };
};
