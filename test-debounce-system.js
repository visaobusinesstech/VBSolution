#!/usr/bin/env node

/**
 * Script de teste para o sistema de debounce e chunking
 * 
 * Uso:
 *   node test-debounce-system.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const WEBHOOK_URL = `${BASE_URL}/webhooks/wa`;

// Configurações de teste
const TEST_CONFIG = {
  chatId: '5511999999999',
  ownerId: 'test-user-uuid',
  connectionId: 'test-connection-uuid'
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

// Teste 1: Mensagens consecutivas (deve agrupar)
async function testConsecutiveMessages() {
  console.log('\n🧪 TESTE 1: Mensagens Consecutivas (deve agrupar)');
  console.log('=' .repeat(50));
  
  const messages = [
    { text: 'Oi, tudo bem?' },
    { text: 'Preciso de ajuda com automação' },
    { text: 'Quanto custa para implementar?' },
    { text: 'Qual o prazo de entrega?' },
    { text: 'Posso falar com um especialista?' }
  ];
  
  // Enviar todas as mensagens rapidamente
  for (let i = 0; i < messages.length; i++) {
    await sendWebhook(messages[i]);
    await sleep(1000); // 1 segundo entre mensagens
  }
  
  console.log('⏳ Aguardando 35 segundos para processamento...');
  await sleep(35000);
  
  console.log('✅ Teste 1 concluído - Verifique se houve apenas 1 resposta agrupada');
}

// Teste 2: Mensagem única (deve responder após 30s)
async function testSingleMessage() {
  console.log('\n🧪 TESTE 2: Mensagem Única (deve responder após 30s)');
  console.log('=' .repeat(50));
  
  await sendWebhook({ text: 'Olá, como posso ajudar?' });
  
  console.log('⏳ Aguardando 35 segundos para processamento...');
  await sleep(35000);
  
  console.log('✅ Teste 2 concluído - Verifique se houve 1 resposta após 30s');
}

// Teste 3: Mensagem com áudio (deve transcrever)
async function testAudioMessage() {
  console.log('\n🧪 TESTE 3: Mensagem com Áudio (deve transcrever)');
  console.log('=' .repeat(50));
  
  await sendWebhook({ 
    audio: {
      url: 'https://example.com/audio.ogg',
      mimetype: 'audio/ogg'
    }
  });
  
  console.log('⏳ Aguardando 35 segundos para processamento...');
  await sleep(35000);
  
  console.log('✅ Teste 3 concluído - Verifique se o áudio foi transcrito');
}

// Teste 4: Mensagem com imagem (deve processar legenda)
async function testImageMessage() {
  console.log('\n🧪 TESTE 4: Mensagem com Imagem (deve processar legenda)');
  console.log('=' .repeat(50));
  
  await sendWebhook({ 
    image: {
      url: 'https://example.com/image.jpg',
      caption: 'Este é um exemplo de imagem'
    }
  });
  
  console.log('⏳ Aguardando 35 segundos para processamento...');
  await sleep(35000);
  
  console.log('✅ Teste 4 concluído - Verifique se a legenda foi processada');
}

// Teste 5: Nova janela de tempo (deve iniciar novo agrupamento)
async function testNewTimeWindow() {
  console.log('\n🧪 TESTE 5: Nova Janela de Tempo (deve iniciar novo agrupamento)');
  console.log('=' .repeat(50));
  
  // Primeira mensagem
  await sendWebhook({ text: 'Primeira mensagem' });
  
  console.log('⏳ Aguardando 35 segundos...');
  await sleep(35000);
  
  // Segunda mensagem após janela fechar
  await sendWebhook({ text: 'Segunda mensagem - nova janela' });
  
  console.log('⏳ Aguardando 35 segundos para processamento...');
  await sleep(35000);
  
  console.log('✅ Teste 5 concluído - Verifique se houve 2 respostas separadas');
}

// Função principal
async function runTests() {
  console.log('🚀 INICIANDO TESTES DO SISTEMA DE DEBOUNCE E CHUNKING');
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
  
  // Executar testes
  await testConsecutiveMessages();
  await testSingleMessage();
  await testAudioMessage();
  await testImageMessage();
  await testNewTimeWindow();
  
  console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
  console.log('=' .repeat(60));
  console.log('📝 Verifique os logs do worker para ver o processamento');
  console.log('📱 Verifique o WhatsApp para ver as respostas');
  console.log('🔍 Verifique o banco de dados para ver as mensagens salvas');
}

// Executar testes
runTests().catch(console.error);
