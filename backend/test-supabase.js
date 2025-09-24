const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Testar inserção de uma sessão de teste
    const testPayload = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      session_name: 'Teste Conexão',
      status: 'disconnected',
      connection_id: 'test_connection_123',
      qr_code: null,
      phone: null,
      whatsapp_info: null,
      connected_at: null,
      disconnected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📤 Enviando payload de teste:', JSON.stringify(testPayload, null, 2));
    
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .upsert(testPayload, { 
        onConflict: 'connection_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ Erro ao inserir sessão de teste:', error);
      return;
    }
    
    console.log('✅ Sessão de teste inserida com sucesso!');
    
    // Testar busca de sessões
    const { data: sessions, error: searchError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('owner_id', '00000000-0000-0000-0000-000000000000')
      .order('created_at', { ascending: false });
    
    if (searchError) {
      console.error('❌ Erro ao buscar sessões:', searchError);
      return;
    }
    
    console.log(`📋 Encontradas ${sessions?.length || 0} sessões:`);
    console.log(JSON.stringify(sessions, null, 2));
    
    // Limpar sessão de teste
    const { error: deleteError } = await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('connection_id', 'test_connection_123');
    
    if (deleteError) {
      console.error('❌ Erro ao limpar sessão de teste:', deleteError);
    } else {
      console.log('🧹 Sessão de teste removida com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSupabase();
