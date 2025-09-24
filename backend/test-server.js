#!/usr/bin/env node

// Script de teste simples para verificar se o servidor está funcionando

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('🔄 Testando conexão com Supabase...');
    
    // Testar conexão básica
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão com Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase OK');
    
    // Testar inserção de uma sessão de teste
    const testSession = {
      id: require('uuid').v4(),
      owner_id: '00000000-0000-0000-0000-000000000000',
      session_name: 'Teste de Conexão',
      status: 'disconnected',
      connection_id: 'test_connection_' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🔄 Testando inserção de sessão...');
    const { error: insertError } = await supabase
      .from('whatsapp_sessions')
      .insert(testSession);
    
    if (insertError) {
      console.error('❌ Erro ao inserir sessão:', insertError.message);
      return false;
    }
    
    console.log('✅ Inserção de sessão OK');
    
    // Limpar sessão de teste
    await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('connection_id', testSession.connection_id);
    
    console.log('✅ Limpeza de teste OK');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

async function testBaileysImport() {
  try {
    console.log('🔄 Testando importação do Baileys...');
    
    const baileys = await import('baileys');
    console.log('✅ Baileys importado com sucesso');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao importar Baileys:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Iniciando testes do sistema WhatsApp...\n');
  
  const supabaseOk = await testSupabaseConnection();
  console.log('');
  
  const baileysOk = await testBaileysImport();
  console.log('');
  
  if (supabaseOk && baileysOk) {
    console.log('🎉 Todos os testes passaram! O sistema está pronto para uso.');
    console.log('🚀 Execute: node persistent-baileys-server.js');
  } else {
    console.log('❌ Alguns testes falharam. Verifique os erros acima.');
    process.exit(1);
  }
}

main().catch(console.error);
