// Script para criar usuário de teste
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🔄 Criando usuário de teste...');

  try {
    // Primeiro, verificar se a tabela users existe
    console.log('📋 Verificando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Tabela users não existe ou erro:', usersError.message);
      
      // Tentar criar a tabela users
      console.log('🔧 Tentando criar tabela users...');
      const { data: createResult, error: createError } = await supabase
        .rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS users (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              email TEXT UNIQUE NOT NULL,
              name TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });

      if (createError) {
        console.error('❌ Erro ao criar tabela users:', createError.message);
        return;
      }

      console.log('✅ Tabela users criada');
    } else {
      console.log('✅ Tabela users existe');
    }

    // Criar usuário de teste
    const testUserId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    console.log('👤 Criando usuário de teste...');
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        id: testUserId,
        email: 'teste@empresa.com',
        name: 'Usuário Teste'
      }])
      .select();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError.message);
    } else {
      console.log('✅ Usuário criado com sucesso:', user);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestUser();
