#!/usr/bin/env node

/**
 * Script para testar inserção simples de AI Agent
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testando inserção simples de AI Agent...\n');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testSimpleInsert() {
  try {
    // Configuração mínima para teste
    const testAgent = {
      name: 'Teste Simples - ' + new Date().toISOString(),
      owner_id: 'test-owner-123',
      system_prompt: 'Você é um assistente de vendas.',
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1000
    };
    
    console.log('📝 Tentando inserir agente com configuração mínima...');
    console.log('📋 Dados:', JSON.stringify(testAgent, null, 2));
    
    const { data, error } = await supabase
      .from('ai_agent_configs')
      .insert([testAgent])
      .select();
    
    if (error) {
      console.error('❌ Erro ao inserir:', error);
      
      // Se ainda há erro, vamos tentar sem as colunas que podem não existir
      console.log('\n🔄 Tentando inserção ainda mais simples...');
      
      const minimalAgent = {
        name: 'Teste Mínimo - ' + new Date().toISOString(),
        owner_id: 'test-owner-123'
      };
      
      const { data: minimalData, error: minimalError } = await supabase
        .from('ai_agent_configs')
        .insert([minimalAgent])
        .select();
      
      if (minimalError) {
        console.error('❌ Erro na inserção mínima:', minimalError);
        console.log('\n💡 Vamos verificar quais colunas realmente existem...');
        await checkExistingColumns();
      } else {
        console.log('✅ Inserção mínima bem-sucedida!');
        console.log('📋 Dados inseridos:', minimalData);
        
        // Limpar dados de teste
        await supabase
          .from('ai_agent_configs')
          .delete()
          .eq('id', minimalData[0].id);
        
        console.log('🧹 Dados de teste limpos');
      }
      
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📋 Dados inseridos:', data);
      
      // Limpar dados de teste
      await supabase
        .from('ai_agent_configs')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Dados de teste limpos');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function checkExistingColumns() {
  try {
    // Tentar inserir um registro vazio para ver a estrutura
    console.log('🔍 Verificando estrutura da tabela...');
    
    // Fazer uma consulta com select * para ver as colunas
    const { data, error } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('❌ Erro ao consultar estrutura:', error);
    } else {
      console.log('✅ Estrutura consultada com sucesso');
    }
    
    // Tentar fazer uma inserção com apenas campos obrigatórios
    const requiredFields = {
      name: 'Teste Campos Obrigatórios',
      owner_id: 'test-owner-123'
    };
    
    console.log('📝 Tentando inserir apenas campos obrigatórios...');
    
    const { data: requiredData, error: requiredError } = await supabase
      .from('ai_agent_configs')
      .insert([requiredFields])
      .select();
    
    if (requiredError) {
      console.error('❌ Erro com campos obrigatórios:', requiredError);
    } else {
      console.log('✅ Campos obrigatórios funcionaram!');
      console.log('📋 Dados:', requiredData);
      
      // Limpar
      await supabase
        .from('ai_agent_configs')
        .delete()
        .eq('id', requiredData[0].id);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar colunas:', error);
  }
}

testSimpleInsert();
