// Script para inserir leads de teste no Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestLeads() {
  console.log('🔄 Inserindo leads de teste...');

  try {
    // Primeiro, verificar se os stages existem
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .select('*')
      .order('order_position', { ascending: true });

    if (stagesError) {
      console.error('❌ Erro ao carregar stages:', stagesError);
      return;
    }

    console.log('✅ Stages encontrados:', stages.length);

    if (stages.length === 0) {
      console.log('⚠️ Nenhum stage encontrado. Criando stages padrão...');
      
      const defaultStages = [
        { name: 'Qualified', order_position: 1, color: '#10b981', probability: 10 },
        { name: 'Contact Made', order_position: 2, color: '#3b82f6', probability: 25 },
        { name: 'Demo Scheduled', order_position: 3, color: '#8b5cf6', probability: 50 },
        { name: 'Proposal Made', order_position: 4, color: '#f59e0b', probability: 75 },
        { name: 'Negotiations Started', order_position: 5, color: '#ef4444', probability: 90 }
      ];

      const { data: newStages, error: insertStagesError } = await supabase
        .from('funnel_stages')
        .insert(defaultStages)
        .select();

      if (insertStagesError) {
        console.error('❌ Erro ao inserir stages:', insertStagesError);
        return;
      }

      console.log('✅ Stages criados:', newStages.length);
      stages.push(...newStages);
    }

    // Criar leads de teste - usando apenas campos básicos
    const testLeads = [
      {
        name: 'João Silva',
        email: 'joao@empresa.com',
        phone: '(11) 99999-0001',
        company: 'Empresa A',
        value: 15000,
        stage_id: stages[0].id,
        priority: 'high',
        status: 'open',
        source: 'website',
        owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      },
      {
        name: 'Maria Santos',
        email: 'maria@empresa.com',
        phone: '(11) 99999-0002',
        company: 'Empresa B',
        value: 25000,
        stage_id: stages[1].id,
        priority: 'medium',
        status: 'open',
        source: 'referral',
        owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      },
      {
        name: 'Pedro Costa',
        email: 'pedro@empresa.com',
        phone: '(11) 99999-0003',
        company: 'Empresa C',
        value: 18000,
        stage_id: stages[2].id,
        priority: 'high',
        status: 'open',
        source: 'linkedin',
        owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      },
      {
        name: 'Ana Oliveira',
        email: 'ana@empresa.com',
        phone: '(11) 99999-0004',
        company: 'Empresa D',
        value: 32000,
        stage_id: stages[3].id,
        priority: 'medium',
        status: 'open',
        source: 'email',
        owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      },
      {
        name: 'Carlos Ferreira',
        email: 'carlos@empresa.com',
        phone: '(11) 99999-0005',
        company: 'Empresa E',
        value: 22000,
        stage_id: stages[4].id,
        priority: 'high',
        status: 'open',
        source: 'phone',
        owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      }
    ];

    console.log('📝 Inserindo leads de teste...');
    
    // Inserir leads um por vez para evitar problemas de trigger
    const insertedLeads = [];
    for (let i = 0; i < testLeads.length; i++) {
      try {
        const { data, error } = await supabase
          .from('leads')
          .insert([testLeads[i]])
          .select();

        if (error) {
          console.error(`❌ Erro ao inserir lead ${i + 1}:`, error);
          continue;
        }

        insertedLeads.push(data[0]);
        console.log(`✅ Lead ${i + 1} inserido: ${testLeads[i].name}`);
      } catch (error) {
        console.error(`❌ Erro ao inserir lead ${i + 1}:`, error);
      }
    }

    console.log('✅ Leads inseridos com sucesso:', insertedLeads.length);
    console.log('🎉 Dados de teste criados! Agora você pode testar o pipeline.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

insertTestLeads();