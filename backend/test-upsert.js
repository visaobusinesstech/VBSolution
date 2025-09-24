const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
  try {
    console.log('🔍 Testando upsert com connection_id...');
    
    const testPayload = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      session_name: 'Teste Upsert',
      status: 'disconnected',
      connection_id: 'test_upsert_123',
      qr_code: null,
      phone: '2147483647',
      whatsapp_info: { test: 'upsert data' },
      connected_at: null,
      disconnected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📤 Tentando upsert:', JSON.stringify(testPayload, null, 2));
    
    // Primeiro insert
    const { data: insertData, error: insertError } = await supabase
      .from('whatsapp_sessions')
      .upsert(testPayload, { 
        onConflict: 'connection_id',
        ignoreDuplicates: false 
      });
    
    if (insertError) {
      console.error('❌ Erro no primeiro upsert:', insertError);
      return;
    }
    
    console.log('✅ Primeiro upsert realizado com sucesso!');
    
    // Segundo upsert (deve atualizar)
    const updatePayload = {
      ...testPayload,
      session_name: 'Teste Upsert Atualizado',
      status: 'connected',
      phone: '2147483647',
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📤 Tentando segundo upsert (atualização):', JSON.stringify(updatePayload, null, 2));
    
    const { data: updateData, error: updateError } = await supabase
      .from('whatsapp_sessions')
      .upsert(updatePayload, { 
        onConflict: 'connection_id',
        ignoreDuplicates: false 
      });
    
    if (updateError) {
      console.error('❌ Erro no segundo upsert:', updateError);
      return;
    }
    
    console.log('✅ Segundo upsert realizado com sucesso!');
    
    // Verificar se foi atualizado
    const { data: verifyData, error: verifyError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('connection_id', 'test_upsert_123');
    
    if (verifyError) {
      console.error('❌ Erro ao verificar dados:', verifyError);
      return;
    }
    
    console.log('📋 Dados verificados:', JSON.stringify(verifyData, null, 2));
    
    // Limpar teste
    const { error: deleteError } = await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('connection_id', 'test_upsert_123');
    
    if (deleteError) {
      console.error('❌ Erro ao limpar teste:', deleteError);
    } else {
      console.log('🧹 Teste limpo com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testUpsert();
