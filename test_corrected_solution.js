// Script para testar a solução corrigida
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCorrectedOperations() {
  console.log('🧪 Testando operações corrigidas...\n');
  
  const companyId = '11111111-1111-1111-1111-111111111111';
  
  // 1. Testar criação de área (deve funcionar agora)
  console.log('1️⃣ Testando criação de área...');
  try {
    const { data: areaData, error: areaError } = await supabase
      .from('company_areas')
      .insert([{
        company_id: companyId,
        name: 'Área de Teste Corrigida',
        description: 'Teste após correção do RLS e estrutura'
      }])
      .select()
      .single();
    
    if (areaError) {
      console.log('❌ Erro ao criar área:', areaError.message);
    } else {
      console.log('✅ Área criada com sucesso:', areaData.name);
    }
  } catch (err) {
    console.log('❌ Erro geral ao criar área:', err.message);
  }
  
  // 2. Testar criação de cargo (SEM permissions)
  console.log('\n2️⃣ Testando criação de cargo...');
  try {
    const { data: roleData, error: roleError } = await supabase
      .from('company_roles')
      .insert([{
        company_id: companyId,
        name: 'Cargo de Teste Corrigido',
        description: 'Teste após correção da estrutura'
      }])
      .select()
      .single();
    
    if (roleError) {
      console.log('❌ Erro ao criar cargo:', roleError.message);
    } else {
      console.log('✅ Cargo criado com sucesso:', roleData.name);
    }
  } catch (err) {
    console.log('❌ Erro geral ao criar cargo:', err.message);
  }
  
  // 3. Testar criação de usuário
  console.log('\n3️⃣ Testando criação de usuário...');
  try {
    const { data: userData, error: userError } = await supabase
      .from('company_users')
      .insert([{
        company_id: companyId,
        full_name: 'Usuário Teste Corrigido',
        email: 'testecorrigido@empresa.com',
        password_hash: 'hash123',
        status: 'active'
      }])
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Erro ao criar usuário:', userError.message);
    } else {
      console.log('✅ Usuário criado com sucesso:', userData.full_name);
    }
  } catch (err) {
    console.log('❌ Erro geral ao criar usuário:', err.message);
  }
  
  // 4. Testar busca de dados
  console.log('\n4️⃣ Testando busca de dados...');
  try {
    const { data: areas, error: areasError } = await supabase
      .from('company_areas')
      .select('*')
      .eq('company_id', companyId);
    
    if (areasError) {
      console.log('❌ Erro ao buscar áreas:', areasError.message);
    } else {
      console.log('✅ Áreas encontradas:', areas?.length || 0);
      areas?.forEach(area => {
        console.log(`   - ${area.name} (${area.id})`);
      });
    }
  } catch (err) {
    console.log('❌ Erro geral ao buscar áreas:', err.message);
  }
  
  // 5. Testar busca de cargos
  console.log('\n5️⃣ Testando busca de cargos...');
  try {
    const { data: roles, error: rolesError } = await supabase
      .from('company_roles')
      .select('*')
      .eq('company_id', companyId);
    
    if (rolesError) {
      console.log('❌ Erro ao buscar cargos:', rolesError.message);
    } else {
      console.log('✅ Cargos encontrados:', roles?.length || 0);
      roles?.forEach(role => {
        console.log(`   - ${role.name} (${role.id})`);
      });
    }
  } catch (err) {
    console.log('❌ Erro geral ao buscar cargos:', err.message);
  }
}

async function checkDataStatus() {
  console.log('📊 Verificando status dos dados...\n');
  
  try {
    // Verificar empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, fantasy_name')
      .limit(5);
    
    if (companiesError) {
      console.log('❌ Erro ao buscar empresas:', companiesError.message);
    } else {
      console.log('📊 Empresas encontradas:', companies?.length || 0);
      companies?.forEach(company => {
        console.log(`   - ${company.fantasy_name} (${company.id})`);
      });
    }
    
    // Verificar configurações
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('id, company_name')
      .limit(5);
    
    if (settingsError) {
      console.log('❌ Erro ao buscar configurações:', settingsError.message);
    } else {
      console.log('📊 Configurações encontradas:', settings?.length || 0);
    }
    
  } catch (err) {
    console.log('❌ Erro ao verificar dados:', err.message);
  }
}

async function main() {
  console.log('🚀 TESTE DA SOLUÇÃO CORRIGIDA\n');
  console.log('Este script testa se as operações funcionam após a correção.\n');
  
  await checkDataStatus();
  console.log('\n' + '='.repeat(50) + '\n');
  await testCorrectedOperations();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ TESTE CONCLUÍDO!');
  console.log('\nSe você viu mensagens de sucesso acima,');
  console.log('o sistema de configurações deve funcionar agora!');
  console.log('\n🎯 Próximos passos:');
  console.log('1. Execute o arquivo SOLUCAO_CORRIGIDA.sql no Supabase');
  console.log('2. Teste criando uma área na página /settings → Estrutura');
  console.log('3. Se ainda houver erros, verifique o console do navegador');
}

main().catch(console.error);
