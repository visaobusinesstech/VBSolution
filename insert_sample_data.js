// Script para inserir dados de exemplo no Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSampleData() {
  try {
    console.log('Inserindo dados de exemplo...');

    // 1. Inserir stages do funil
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .insert([
        {
          name: 'Qualified',
          order_position: 1,
          color: '#10b981',
          probability: 10
        },
        {
          name: 'Contact Made',
          order_position: 2,
          color: '#3b82f6',
          probability: 25
        },
        {
          name: 'Demo Scheduled',
          order_position: 3,
          color: '#8b5cf6',
          probability: 50
        },
        {
          name: 'Proposal Made',
          order_position: 4,
          color: '#f59e0b',
          probability: 75
        },
        {
          name: 'Negotiations Started',
          order_position: 5,
          color: '#ef4444',
          probability: 90
        }
      ])
      .select();

    if (stagesError) throw stagesError;
    console.log('✅ Stages inseridos:', stages.length);

    // 2. Inserir leads de exemplo
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .insert([
        {
          name: 'João Silva',
          email: 'joao@empresa.com',
          phone: '(11) 99999-0001',
          company: 'Empresa A',
          value: 15000,
          stage_id: stages[0].id,
          priority: 'high',
          status: 'open',
          source: 'website'
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
          source: 'referral'
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
          source: 'linkedin'
        },
        {
          name: 'Ana Lima',
          email: 'ana@empresa.com',
          phone: '(11) 99999-0004',
          company: 'Empresa D',
          value: 12000,
          stage_id: stages[3].id,
          priority: 'low',
          status: 'open',
          source: 'email'
        },
        {
          name: 'Carlos Oliveira',
          email: 'carlos@empresa.com',
          phone: '(11) 99999-0005',
          company: 'Empresa E',
          value: 30000,
          stage_id: stages[4].id,
          priority: 'urgent',
          status: 'won',
          source: 'website'
        }
      ])
      .select();

    if (leadsError) throw leadsError;
    console.log('✅ Leads inseridos:', leads.length);

    // 3. Inserir templates de exemplo
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .insert([
        {
          name: 'Proposta Comercial Padrão',
          type: 'proposal',
          subject: 'Proposta Comercial - {{company_name}}',
          content: 'Prezado(a) {{contact_name}},\n\nSegue nossa proposta comercial para {{company_name}}.\n\nValor: {{deal_value}}\nPrazo: {{delivery_time}}\n\nAtenciosamente,\nEquipe Comercial',
          variables: {
            company_name: 'Nome da empresa',
            contact_name: 'Nome do contato',
            deal_value: 'Valor do negócio',
            delivery_time: 'Prazo de entrega'
          }
        },
        {
          name: 'Follow-up WhatsApp',
          type: 'whatsapp',
          content: 'Olá {{contact_name}}! Como está o andamento da nossa proposta para {{company_name}}? Temos algumas novidades que podem interessar! 😊',
          variables: {
            contact_name: 'Nome do contato',
            company_name: 'Nome da empresa'
          }
        },
        {
          name: 'Email de Apresentação',
          type: 'email',
          subject: 'Apresentação - {{company_name}}',
          content: 'Prezado(a) {{contact_name}},\n\nGostaria de agendar uma apresentação para {{company_name}}.\n\nDisponibilidade:\n- Segunda-feira: 14h às 16h\n- Terça-feira: 10h às 12h\n- Quarta-feira: 15h às 17h\n\nAguardo seu retorno!\n\nAtenciosamente,\n{{sales_rep_name}}',
          variables: {
            contact_name: 'Nome do contato',
            company_name: 'Nome da empresa',
            sales_rep_name: 'Nome do vendedor'
          }
        }
      ])
      .select();

    if (templatesError) throw templatesError;
    console.log('✅ Templates inseridos:', templates.length);

    console.log('🎉 Dados de exemplo inseridos com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`- ${stages.length} stages do funil`);
    console.log(`- ${leads.length} leads`);
    console.log(`- ${templates.length} templates`);

  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
  }
}

// Executar o script
insertSampleData();
