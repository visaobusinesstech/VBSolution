#!/usr/bin/env node

/**
 * Teste rápido do sistema de debounce e chunking com delay aleatório
 * 
 * Uso:
 *   node test-quick.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const WEBHOOK_URL = `${BASE_URL}/webhooks/wa`;

// Configurações de teste
const TEST_CONFIG = {
  chatId: '5511999999999',
  ownerId: 'test-user-uuid',
  connectionId: 'test-connection'
};

// Função para enviar webhook
async function sendWebhook(messageData) {
  try {
    const response = await axios.post(WEBHOOK_URL, {
      ...messageData,
      ...TEST_CONFIG,
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Webhook enviado:', messageData.text || messageData.type);
    console.log('   Resposta:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.message);
    return null;
  }
}

// Função para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Teste principal
async function runTest() {
  console.log('🚀 TESTE RÁPIDO DO SISTEMA DE DEBOUNCE E CHUNKING');
  console.log('=' .repeat(60));
  console.log('📋 Configurações:');
  console.log(`   - Webhook URL: ${WEBHOOK_URL}`);
  console.log(`   - Chat ID: ${TEST_CONFIG.chatId}`);
  console.log(`   - Owner ID: ${TEST_CONFIG.ownerId}`);
  console.log('=' .repeat(60));
  
  // Verificar se o servidor está rodando
  try {
    const statusResponse = await axios.get(`${BASE_URL}/webhooks/status`);
    console.log('✅ Servidor está rodando');
    console.log('📊 Status:', statusResponse.data);
  } catch (error) {
    console.error('❌ Servidor não está rodando. Inicie o servidor primeiro.');
    process.exit(1);
  }
  
  console.log('\n🧪 TESTE: Mensagens Consecutivas com Delay Aleatório');
  console.log('=' .repeat(60));
  
  const messages = [
    { text: 'Oi, tudo bem?' },
    { text: 'Preciso de ajuda com automação' },
    { text: 'Quanto custa para implementar?' },
    { text: 'Qual o prazo de entrega?' },
    { text: 'Posso falar com um especialista?' }
  ];
  
  // Enviar todas as mensagens rapidamente
  console.log('📤 Enviando 5 mensagens consecutivas...');
  for (let i = 0; i < messages.length; i++) {
    await sendWebhook(messages[i]);
    await sleep(1000); // 1 segundo entre envios
  }
  
  console.log('\n⏳ Aguardando 35 segundos para processamento...');
  console.log('   (O sistema irá agrupar as mensagens e enviar resposta com delay aleatório de 3-5s entre chunks)');
  
  await sleep(35000);
  
  console.log('\n✅ Teste concluído!');
  console.log('=' .repeat(60));
  console.log('📝 Verifique os logs do worker para ver o processamento');
  console.log('📱 Verifique o WhatsApp para ver as respostas com delay aleatório');
  console.log('🔍 Verifique o banco de dados para ver as mensagens salvas');
  console.log('\n🎯 O sistema deve ter:');
  console.log('   - Agrupado as 5 mensagens em uma única conversa');
  console.log('   - Enviado a resposta dividida em chunks');
  console.log('   - Aplicado delay aleatório de 3-5s entre cada chunk');
  console.log('   - Salvo tudo no Supabase');
}

// Executar teste
runTest().catch(console.error);
