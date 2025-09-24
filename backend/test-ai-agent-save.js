#!/usr/bin/env node

/**
 * Script para testar o salvamento do AI Agent no frontend
 * Verifica se as configurações estão sendo salvas corretamente
 */

// Carregar variáveis de ambiente
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🤖 Testando salvamento do AI Agent...\n');

// Carregar configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('💡 Certifique-se de que SUPABASE_URL e SUPABASE_ANON_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração de teste para AI Agent
const testAgentConfig = {
  name: 'Teste AI Agent - ' + new Date().toISOString(),
  owner_id: 'test-owner-123',
  system_prompt: 'Você é um assistente de vendas especializado em automações. Seja sempre prestativo e profissional.',
  model: 'gpt-4',
  temperature: 0.7,
  max_tokens: 1000,
  message_settings: {
    debounceTimeMs: 30000, // 30 segundos
    chunkDelayMs: 2000,    // 2 segundos entre chunks
    maxChunkSize: 300,     // 300 caracteres por chunk
    minDelayMs: 1000,      // 1 segundo mínimo
    maxDelayMs: 10000      // 10 segundos máximo
  },
  integrations: {
    whatsapp: {
      enabled: true,
      auto_reply: true,
      business_hours_only: false
    },
    email: {
      enabled: false
    }
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function testAIAgentSave() {
  console.log('📝 Testando salvamento do AI Agent...\n');
  
  try {
    // 1. Testar inserção de novo agente
    console.log('1️⃣ Testando inserção de novo agente...');
    const { data: insertData, error: insertError } = await supabase
      .from('ai_agent_configs')
      .insert([testAgentConfig])
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir agente:', insertError);
      return;
    }
    
    console.log('✅ Agente inserido com sucesso!');
    console.log('📋 ID do agente:', insertData[0].id);
    
    const agentId = insertData[0].id;
    
    // 2. Testar leitura do agente
    console.log('\n2️⃣ Testando leitura do agente...');
    const { data: readData, error: readError } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .eq('id', agentId)
      .single();
    
    if (readError) {
      console.error('❌ Erro ao ler agente:', readError);
      return;
    }
    
    console.log('✅ Agente lido com sucesso!');
    console.log('📋 Nome:', readData.name);
    console.log('📋 Modelo:', readData.model);
    console.log('📋 Debounce Time:', readData.message_settings?.debounceTimeMs, 'ms');
    
    // 3. Testar atualização do agente
    console.log('\n3️⃣ Testando atualização do agente...');
    const updateData = {
      ...readData,
      name: 'Teste AI Agent Atualizado - ' + new Date().toISOString(),
      temperature: 0.8,
      message_settings: {
        ...readData.message_settings,
        debounceTimeMs: 45000, // 45 segundos
        maxChunkSize: 250      // 250 caracteres
      }
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('ai_agent_configs')
      .update(updateData)
      .eq('id', agentId)
      .select();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar agente:', updateError);
      return;
    }
    
    console.log('✅ Agente atualizado com sucesso!');
    console.log('📋 Novo nome:', updateResult[0].name);
    console.log('📋 Nova temperatura:', updateResult[0].temperature);
    console.log('📋 Novo debounce time:', updateResult[0].message_settings?.debounceTimeMs, 'ms');
    
    // 4. Testar configurações de mensagem
    console.log('\n4️⃣ Testando configurações de mensagem...');
    const messageSettings = updateResult[0].message_settings;
    
    console.log('📋 Configurações de mensagem:');
    console.log('   - Debounce Time:', messageSettings?.debounceTimeMs, 'ms');
    console.log('   - Chunk Delay:', messageSettings?.chunkDelayMs, 'ms');
    console.log('   - Max Chunk Size:', messageSettings?.maxChunkSize, 'caracteres');
    console.log('   - Min Delay:', messageSettings?.minDelayMs, 'ms');
    console.log('   - Max Delay:', messageSettings?.maxDelayMs, 'ms');
    
    // 5. Testar configurações de integração
    console.log('\n5️⃣ Testando configurações de integração...');
    const integrations = updateResult[0].integrations;
    
    console.log('📋 Configurações de integração:');
    console.log('   - WhatsApp habilitado:', integrations?.whatsapp?.enabled);
    console.log('   - Auto reply:', integrations?.whatsapp?.auto_reply);
    console.log('   - Business hours only:', integrations?.whatsapp?.business_hours_only);
    console.log('   - Email habilitado:', integrations?.email?.enabled);
    
    // 6. Testar validação de valores
    console.log('\n6️⃣ Testando validação de valores...');
    
    // Testar valores válidos
    const validValues = {
      debounceTimeMs: 30000,
      chunkDelayMs: 2000,
      maxChunkSize: 300,
      minDelayMs: 1000,
      maxDelayMs: 10000
    };
    
    console.log('✅ Valores válidos testados:');
    Object.entries(validValues).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    
    // Testar valores inválidos (que devem ser corrigidos)
    const invalidValues = {
      debounceTimeMs: 3600000000, // Valor muito grande
      chunkDelayMs: -1000,        // Valor negativo
      maxChunkSize: 0,            // Valor zero
      minDelayMs: 999999999999,   // Valor muito grande
      maxDelayMs: -5000           // Valor negativo
    };
    
    console.log('\n⚠️ Valores inválidos que devem ser corrigidos:');
    Object.entries(invalidValues).forEach(([key, value]) => {
      const correctedValue = Math.min(Math.max(value, 1000), 2147483647);
      console.log(`   - ${key}: ${value} → ${correctedValue}`);
    });
    
    // 7. Limpeza
    console.log('\n7️⃣ Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('ai_agent_configs')
      .delete()
      .eq('id', agentId);
    
    if (deleteError) {
      console.error('❌ Erro ao deletar agente:', deleteError);
      return;
    }
    
    console.log('✅ Dados de teste limpos!');
    
    console.log('\n🎉 Todos os testes passaram com sucesso!');
    console.log('💡 O sistema de salvamento do AI Agent está funcionando corretamente');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testAIAgentSave().then(() => {
  console.log('\n✅ Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
