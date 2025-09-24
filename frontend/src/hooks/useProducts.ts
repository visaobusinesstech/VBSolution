
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  type: 'product' | 'service';
  sku?: string;
  description?: string;
  category?: string;
  base_price: number;
  currency: string;
  unit: string;
  stock?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Iniciando busca de produtos...');
      
      // Verificar se o cliente Supabase está configurado
      if (!supabase) {
        throw new Error('Cliente Supabase não está configurado');
      }
      
      console.log('✅ Cliente Supabase configurado');
      console.log('🌐 URL do Supabase:', supabase.supabaseUrl);
      
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Sessão atual:', session ? 'Autenticado' : 'Não autenticado');
      
      // Testar conexão básica
      console.log('🔍 Testando conexão com Supabase...');
      try {
        const { data: healthData, error: healthError } = await supabase
          .from('products')
          .select('id')
          .limit(1);
        
        if (healthError) {
          console.error('❌ Erro de saúde da tabela products:', healthError);
          
          // Tentar uma consulta mais simples
          console.log('🔄 Tentando consulta alternativa...');
          const { error: simpleError } = await supabase
            .from('products')
            .select('*')
            .limit(0);
          
          if (simpleError) {
            console.error('❌ Erro na consulta simples:', simpleError);
            throw new Error(`Problema de acesso à tabela products: ${simpleError.message}`);
          }
        }
        
        console.log('✅ Conexão com Supabase funcionando');
      } catch (connectionErr) {
        console.error('❌ Erro de conexão:', connectionErr);
        throw connectionErr;
      }
      
      // Buscar produtos do Supabase
      console.log('📡 Fazendo consulta à tabela products...');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro na consulta Supabase:', error);
        throw error;
      }
      
      console.log('✅ Consulta bem-sucedida, produtos encontrados:', data?.length || 0);
      console.log('📦 Dados dos produtos:', data);
      
      setProducts(data || []);
      
    } catch (err) {
      console.error('💥 Erro ao buscar produtos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar produtos';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      await fetchProducts();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating product');
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchProducts();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating product');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting product');
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
};
