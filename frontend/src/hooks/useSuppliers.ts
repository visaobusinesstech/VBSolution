
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  contact_person?: string;
  status: 'active' | 'inactive';
  owner_id: string; // Coluna real da tabela
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSuppliers = async () => {
    console.log('🔍 fetchSuppliers: Iniciando busca...', { user: user?.id });
    
    if (!user) {
      console.log('❌ fetchSuppliers: Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ fetchSuppliers: Erro ao buscar fornecedores:', error);
        throw error;
      }

      console.log('✅ fetchSuppliers: Dados recebidos:', data?.length || 0, 'fornecedores');
      setSuppliers(data || []);
    } catch (err) {
      console.error('❌ fetchSuppliers: Erro ao buscar fornecedores:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (formData: any) => {
    console.log('🚀 createSupplier: Iniciando criação de fornecedor...', { formData, user: user?.id });
    
    if (!user) {
      console.error('❌ createSupplier: Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }

    try {
      // Validar dados obrigatórios
      if (!formData.name || formData.name.trim() === '') {
        throw new Error('Nome do fornecedor é obrigatório');
      }

      // Mapear dados do formulário para o schema da tabela (apenas campos que existem)
      const supplierData = {
        name: formData.name.trim(),
        cnpj: formData.cnpj || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        contact_person: formData.contact_person || null,
        status: 'active' as const,
        owner_id: user.id
      };

      console.log('📝 createSupplier: Dados mapeados para inserção:', supplierData);

      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) {
        console.error('❌ createSupplier: Erro do Supabase:', error);
        throw error;
      }
      
      console.log('✅ createSupplier: Fornecedor criado com sucesso:', data);
      await fetchSuppliers(); // Recarregar dados
      return data;
    } catch (err) {
      console.error('❌ createSupplier: Erro ao criar fornecedor:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar fornecedor');
      throw err;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchSuppliers(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar fornecedor');
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchSuppliers(); // Recarregar dados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir fornecedor');
      throw err;
    }
  };

  const getSuppliersByStatus = (status: Supplier['status']) => {
    return suppliers.filter(supplier => supplier.status === status);
  };

  const getSuppliersByState = (state: string) => {
    return suppliers.filter(supplier => supplier.state === state);
  };

  const getSuppliersByCity = (city: string) => {
    return suppliers.filter(supplier => supplier.city === city);
  };

  const searchSuppliers = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(lowerQuery) ||
      (supplier.cnpj && supplier.cnpj.includes(lowerQuery)) ||
      (supplier.email && supplier.email.toLowerCase().includes(lowerQuery)) ||
      (supplier.contact_person && supplier.contact_person.toLowerCase().includes(lowerQuery))
    );
  };

  const getActiveSuppliers = () => {
    return suppliers.filter(supplier => supplier.status === 'active');
  };

  const getTopRatedSuppliers = (limit: number = 5) => {
    return suppliers
      .filter(supplier => supplier.rating && supplier.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  };

  const updateSupplierRating = async (id: string, rating: number) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ rating: Math.max(1, Math.min(5, rating)) })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchSuppliers(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar avaliação do fornecedor');
      throw err;
    }
  };

  const suspendSupplier = async (id: string, reason?: string) => {
    try {
      const updates: Partial<Supplier> = { status: 'suspended' };
      if (reason) {
        updates.notes = reason;
      }

      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchSuppliers(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao suspender fornecedor');
      throw err;
    }
  };

  const activateSupplier = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ status: 'active' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchSuppliers(); // Recarregar dados
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar fornecedor');
      throw err;
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSuppliers();
    } else {
      setSuppliers([]);
      setError(null);
      setLoading(false);
    }
  }, [user?.id]);

  // Função para limpar erros
  const clearError = () => {
    setError(null);
  };

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSuppliersByStatus,
    getSuppliersByState,
    getSuppliersByCity,
    searchSuppliers,
    getActiveSuppliers,
    getTopRatedSuppliers,
    updateSupplierRating,
    suspendSupplier,
    activateSupplier,
    refetch: fetchSuppliers,
    clearError
  };
};
