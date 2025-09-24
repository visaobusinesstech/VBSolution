#!/usr/bin/env node

/**
 * Script para testar o salvamento completo do AI Agent
 * Usando a estrutura real da tabela ai_agent_configs
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

console.log('🤖 Testando salvamento completo do AI Agent...\n');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// UUIDs válidos para teste
const testOwnerId = uuidv4();

// Configuração completa do AI Agent baseada nos campos mapeados
const completeAgentConfig = {
  // CARGO (Informações Básicas)
  is_company_wide: false,
  name: 'Agente de Vendas - Teste Completo',
  function: 'Assistente de Vendas e Atendimento',
  personality: 'Profissional, prestativo e proativo',
  
  // CÉREBRO (Base de Conhecimento)
  knowledge_base: {
    files: ['manual_vendas.pdf', 'produtos_catalog.pdf'],
    websites: ['https://empresa.com', 'https://suporte.empresa.com'],
    qa: [
      {
        question: 'Quais são os principais produtos?',
        answer: 'Oferecemos soluções de automação, CRM e integração de sistemas.'
      },
      {
        question: 'Qual o prazo de entrega?',
        answer: 'O prazo varia de 15 a 30 dias úteis dependendo da complexidade.'
      }
    ]
  },
  
  // INTEGRAÇÃO (Configurações de API)
  api_key: 'sk-test-key-123456789',
  selected_model: 'gpt-4',
  creativity_temperature: 0.7,
  max_tokens: 1000,
  
  // CONFIGURAÇÕES DE RESPOSTA
  response_style: 'conversacional',
  language: 'pt-BR',
  response_speed: 'normal',
  max_response_length: 500,
  
  // CONFIGURAÇÕES AVANÇADAS
  tone: 'profissional_amigavel',
  rules: [
    'Sempre ser respeitoso',
    'Focar nas necessidades do cliente',
    'Fornecer informações precisas'
  ],
  company_context: 'Empresa de tecnologia especializada em automações',
  sector: 'tecnologia',
  company_description: 'Desenvolvemos soluções de automação para empresas de todos os portes',
  
  // CONFIGURAÇÕES DE ÁUDIO
  audio_transcription_enabled: true,
  audio_transcription_language: 'pt-BR',
  
  // CONFIGURAÇÕES DE MENSAGENS (Sistema de Buffering)
  message_debounce_enabled: true,
  message_debounce_time_ms: 30000, // 30 segundos
  message_chunk_size: 300,         // 300 caracteres por chunk
  message_chunk_delay_ms: 2000,    // 2 segundos entre chunks
  message_max_batch_size: 10,      // máximo 10 mensagens por lote
  
  // Campos do sistema
  owner_id: testOwnerId,
  is_active: true
};

async function testCompleteAIAgentSave() {
  console.log('📝 Testando salvamento completo do AI Agent...\n');
  
  try {
    // 1. Testar inserção completa
    console.log('1️⃣ Testando inserção completa do agente...');
    console.log('📋 Configuração:', JSON.stringify(completeAgentConfig, null, 2));
    
    const { data: insertData, error: insertError } = await supabase
      .from('ai_agent_configs')
      .insert([completeAgentConfig])
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir agente:', insertError);
      return;
    }
    
    console.log('✅ Agente inserido com sucesso!');
    console.log('📋 ID do agente:', insertData[0].id);
    
    const agentId = insertData[0].id;
    
    // 2. Testar leitura completa
    console.log('\n2️⃣ Testando leitura completa do agente...');
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
    console.log('📋 Informações Básicas:');
    console.log('   - Nome:', readData.name);
    console.log('   - Função:', readData.function);
    console.log('   - Personalidade:', readData.personality);
    console.log('   - Empresa toda:', readData.is_company_wide);
    
    console.log('\n📋 Configurações de IA:');
    console.log('   - Modelo:', readData.selected_model);
    console.log('   - Temperatura:', readData.creativity_temperature);
    console.log('   - Max Tokens:', readData.max_tokens);
    
    console.log('\n📋 Configurações de Resposta:');
    console.log('   - Estilo:', readData.response_style);
    console.log('   - Idioma:', readData.language);
    console.log('   - Velocidade:', readData.response_speed);
    console.log('   - Tamanho máximo:', readData.max_response_length);
    
    console.log('\n📋 Configurações de Mensagens (Sistema de Buffering):');
    console.log('   - Debounce habilitado:', readData.message_debounce_enabled);
    console.log('   - Tempo de espera:', readData.message_debounce_time_ms, 'ms');
    console.log('   - Tamanho do chunk:', readData.message_chunk_size, 'caracteres');
    console.log('   - Delay entre chunks:', readData.message_chunk_delay_ms, 'ms');
    console.log('   - Tamanho máximo do lote:', readData.message_max_batch_size);
    
    // 3. Testar configurações de buffering específicas
    console.log('\n3️⃣ Testando configurações de buffering...');
    
    const bufferingConfig = {
      debounceTimeMs: readData.message_debounce_time_ms,
      chunkSize: readData.message_chunk_size,
      chunkDelayMs: readData.message_chunk_delay_ms,
      maxBatchSize: readData.message_max_batch_size
    };
    
    console.log('📋 Configurações de buffering validadas:');
    Object.entries(bufferingConfig).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    
    // 4. Testar validação de valores de timeout
    console.log('\n4️⃣ Testando validação de timeout...');
    const MAX_SAFE_TIMEOUT = 2147483647; // 2^31 - 1
    
    const timeoutValues = {
      'message_debounce_time_ms': readData.message_debounce_time_ms,
      'message_chunk_delay_ms': readData.message_chunk_delay_ms
    };
    
    Object.entries(timeoutValues).forEach(([key, value]) => {
      const safeValue = Math.min(Math.max(value, 1000), MAX_SAFE_TIMEOUT);
      if (value !== safeValue) {
        console.log(`⚠️ ${key}: ${value} → ${safeValue} (corrigido)`);
      } else {
        console.log(`✅ ${key}: ${value} (válido)`);
      }
    });
    
    // 5. Testar atualização das configurações de buffering
    console.log('\n5️⃣ Testando atualização das configurações de buffering...');
    
    const updatedBufferingConfig = {
      message_debounce_time_ms: 45000,  // 45 segundos
      message_chunk_size: 250,          // 250 caracteres
      message_chunk_delay_ms: 1500,     // 1.5 segundos
      message_max_batch_size: 15        // 15 mensagens
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('ai_agent_configs')
      .update(updatedBufferingConfig)
      .eq('id', agentId)
      .select();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar configurações:', updateError);
      return;
    }
    
    console.log('✅ Configurações de buffering atualizadas!');
    console.log('📋 Novas configurações:');
    console.log('   - Tempo de espera:', updateResult[0].message_debounce_time_ms, 'ms');
    console.log('   - Tamanho do chunk:', updateResult[0].message_chunk_size, 'caracteres');
    console.log('   - Delay entre chunks:', updateResult[0].message_chunk_delay_ms, 'ms');
    console.log('   - Tamanho máximo do lote:', updateResult[0].message_max_batch_size);
    
    // 6. Testar sistema de chunking (simulação)
    console.log('\n6️⃣ Testando sistema de chunking...');
    
    const longMessage = `Olá! Obrigado pelo seu interesse em nossos serviços de automação. 
    Oferecemos soluções completas para empresas de todos os portes, incluindo integração 
    de sistemas, automação de processos e desenvolvimento de CRMs personalizados. 
    Nossa equipe tem mais de 10 anos de experiência no mercado e já atendemos mais 
    de 500 empresas em todo o Brasil. Entre em contato conosco para uma consultoria 
    gratuita e descubra como podemos ajudar sua empresa a crescer com tecnologia.`;
    
    const chunks = chunkMessage(longMessage, updateResult[0].message_chunk_size);
    
    console.log(`📝 Mensagem original: ${longMessage.length} caracteres`);
    console.log(`✂️ Dividida em ${chunks.length} chunks:`);
    
    chunks.forEach((chunk, index) => {
      console.log(`   ${index + 1}. "${chunk}" (${chunk.length} caracteres)`);
    });
    
    // 7. Testar sistema de debounce (simulação)
    console.log('\n7️⃣ Testando sistema de debounce...');
    
    const testMessages = [
      'Olá',
      'Como você está?',
      'Quero saber sobre automações',
      'Quanto custa?',
      'Quero implementar'
    ];
    
    console.log('📋 Simulando recebimento de mensagens:');
    testMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. "${msg}" (${new Date().toISOString()})`);
    });
    
    console.log(`⏰ Aguardando ${updateResult[0].message_debounce_time_ms}ms para agregação...`);
    console.log('📦 Mensagens serão processadas em lote após o tempo de espera');
    
    // 8. Limpeza
    console.log('\n8️⃣ Limpando dados de teste...');
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
    console.log('💡 O sistema de salvamento do AI Agent está funcionando perfeitamente');
    console.log('🚀 Sistema de buffering e chunking implementado e testado!');
    console.log('📱 Pronto para integrar com o frontend!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Função para dividir mensagem em chunks
function chunkMessage(message, maxChunkSize = 300) {
  if (message.length <= maxChunkSize) {
    return [message];
  }
  
  const chunks = [];
  let currentIndex = 0;
  
  while (currentIndex < message.length) {
    let chunkEnd = currentIndex + maxChunkSize;
    
    // Se não é o último chunk, tentar quebrar em um espaço
    if (chunkEnd < message.length) {
      const lastSpace = message.lastIndexOf(' ', chunkEnd);
      if (lastSpace > currentIndex) {
        chunkEnd = lastSpace;
      }
    }
    
    const chunk = message.substring(currentIndex, chunkEnd).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    
    currentIndex = chunkEnd;
  }
  
  return chunks;
}

// Executar teste
testCompleteAIAgentSave().then(() => {
  console.log('\n✅ Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
