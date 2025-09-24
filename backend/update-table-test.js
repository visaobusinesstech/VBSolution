const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTable() {
  try {
    console.log('🔧 Atualizando tabela whatsapp_sessions...');
    
    // Adicionar colunas que estão faltando
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.whatsapp_sessions 
        ADD COLUMN IF NOT EXISTS connection_id TEXT,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS whatsapp_info JSONB;
      `
    });
    
    if (alterError) {
      console.error('❌ Erro ao adicionar colunas:', alterError);
      return;
    }
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
    // Criar índice único para connection_id
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_sessions_connection_id 
        ON public.whatsapp_sessions (connection_id);
      `
    });
    
    if (indexError) {
      console.error('❌ Erro ao criar índice único:', indexError);
      return;
    }
    
    console.log('✅ Índice único criado com sucesso!');
    
    // Testar inserção
    const testPayload = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      session_name: 'Teste Conexão',
      status: 'disconnected',
      connection_id: 'test_connection_456',
      qr_code: null,
      phone: null,
      whatsapp_info: null,
      connected_at: null,
      disconnected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .upsert(testPayload, { 
        onConflict: 'connection_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ Erro ao testar upsert:', error);
      return;
    }
    
    console.log('✅ Upsert funcionando corretamente!');
    
    // Limpar teste
    const { error: deleteError } = await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('connection_id', 'test_connection_456');
    
    if (deleteError) {
      console.error('❌ Erro ao limpar teste:', deleteError);
    } else {
      console.log('🧹 Teste limpo com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

updateTable();
