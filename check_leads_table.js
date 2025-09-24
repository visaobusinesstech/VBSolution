// Script para verificar a estrutura da tabela leads
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeadsTable() {
  console.log('🔍 Verificando estrutura da tabela leads...');

  try {
    // Verificar se a tabela leads existe
    console.log('📋 Verificando tabela leads...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (leadsError) {
      console.error('❌ Erro na tabela leads:', leadsError.message);
      
      // Se a tabela não existe, vamos tentar criar
      console.log('🔧 Tentando criar tabela leads...');
      const { data: createResult, error: createError } = await supabase
        .rpc('exec', {
          sql: `
            CREATE TABLE IF NOT EXISTS leads (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              owner_id UUID REFERENCES users(id),
              company_id UUID,
              name TEXT NOT NULL,
              email TEXT,
              phone TEXT,
              company TEXT,
              value DECIMAL(10,2),
              stage_id UUID REFERENCES funnel_stages(id),
              priority TEXT DEFAULT 'medium',
              status TEXT DEFAULT 'open',
              source TEXT,
              notes TEXT,
              expected_close_date TIMESTAMP WITH TIME ZONE,
              tags JSONB DEFAULT '[]',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        });

      if (createError) {
        console.error('❌ Erro ao criar tabela leads:', createError.message);
      } else {
        console.log('✅ Tabela leads criada');
      }
    } else {
      console.log('✅ Tabela leads existe');
      if (leads && leads.length > 0) {
        console.log('📊 Colunas da tabela leads:', Object.keys(leads[0]));
      }
    }

    // Verificar se há leads existentes
    console.log('📋 Verificando leads existentes...');
    const { data: existingLeads, error: existingError } = await supabase
      .from('leads')
      .select('id, name, owner_id')
      .limit(5);

    if (existingError) {
      console.error('❌ Erro ao buscar leads existentes:', existingError.message);
    } else {
      console.log('✅ Leads existentes:', existingLeads);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkLeadsTable();
