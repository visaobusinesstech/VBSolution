#!/usr/bin/env node

/**
 * Script para testar o sistema de buffering de mensagens
 * Simula o envio de múltiplas mensagens para testar o debounce
 */

const Redis = require('ioredis');
const { Queue } = require('bullmq');
const { INTEGRATIONS_CONFIG } = require('./src/config/integrations.config');

console.log('🧪 Testando sistema de buffering de mensagens...\n');

// Configurar Redis
const redis = new Redis({
  host: INTEGRATIONS_CONFIG.REDIS.HOST,
  port: INTEGRATIONS_CONFIG.REDIS.PORT,
  password: INTEGRATIONS_CONFIG.REDIS.PASSWORD,
  username: INTEGRATIONS_CONFIG.REDIS.USERNAME,
  connectTimeout: 60000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 60000
});

// Configurar BullMQ
const messageQueue = new Queue('message-buffer', {
  connection: {
    host: INTEGRATIONS_CONFIG.REDIS.HOST,
    port: INTEGRATIONS_CONFIG.REDIS.PORT,
    password: INTEGRATIONS_CONFIG.REDIS.PASSWORD,
    username: INTEGRATIONS_CONFIG.REDIS.USERNAME,
    connectTimeout: 60000,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxLoadingTimeout: 60000
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
});

// Dados de teste
const testSessionId = 'test-session-' + Date.now();
const testOwnerId = 'test-owner-123';
const testConnectionId = 'test-connection-456';
const testChatId = 'test-chat-789';

// Mensagens de teste (simulando usuário enviando múltiplas mensagens)
const testMessages = [
  'Olá',
  'Como você está?',
  'Quero saber se você trabalha com automações',
  'Quanto você cobra por uma automação?',
  'Quero implementar no meu negócio'
];

async function testMessageBuffering() {
  console.log('📝 Iniciando teste de buffering de mensagens...\n');
  
  try {
    // Enviar mensagens com delay entre elas
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      const messageData = {
        id: `msg-${i}-${Date.now()}`,
        text: message,
        timestamp: Date.now(),
        contactId: 'test-contact',
        ownerId: testOwnerId,
        connectionId: testConnectionId,
        chatId: testChatId,
        messageType: 'text'
      };
      
      console.log(`📤 Enviando mensagem ${i + 1}/${testMessages.length}: "${message}"`);
      
      // Adicionar ao buffer Redis
      await redis.rpush(`conv:${testSessionId}:buf`, JSON.stringify(messageData));
      
      // Agendar job de agregação
      const jobName = `aggregate:${testSessionId}`;
      const debounceTime = 30000; // 30 segundos
      
      // Cancelar job anterior se existir
      const existingJobs = await messageQueue.getJobs(['delayed'], 0, -1);
      for (const job of existingJobs) {
        if (job.name === jobName) {
          await job.remove();
          console.log('🔄 Job anterior cancelado');
        }
      }
      
      // Agendar novo job
      await messageQueue.add('message-aggregation', {
        sessionId: testSessionId,
        messageData: messageData,
        ownerId: testOwnerId,
        connectionId: testConnectionId,
        chatId: testChatId
      }, {
        delay: debounceTime,
        jobId: jobName
      });
      
      console.log(`⏰ Job de agregação agendado para ${debounceTime}ms`);
      
      // Delay entre mensagens (simulando usuário digitando)
      if (i < testMessages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 segundos entre mensagens
      }
    }
    
    console.log('\n✅ Todas as mensagens foram enviadas!');
    console.log('⏳ Aguardando processamento...');
    
    // Verificar status do job
    setTimeout(async () => {
      try {
        const jobs = await messageQueue.getJobs(['delayed', 'waiting', 'active'], 0, -1);
        const sessionJob = jobs.find(job => job.name === `aggregate:${testSessionId}`);
        
        if (sessionJob) {
          console.log(`📊 Status do job: ${sessionJob.name} - Estado: ${sessionJob.opts.delay ? 'Delayed' : 'Active'}`);
          console.log(`⏰ Delay restante: ${sessionJob.opts.delay}ms`);
        } else {
          console.log('✅ Job processado ou não encontrado');
        }
        
        // Verificar buffer Redis
        const bufferLength = await redis.llen(`conv:${testSessionId}:buf`);
        console.log(`📦 Mensagens no buffer: ${bufferLength}`);
        
        if (bufferLength > 0) {
          const bufferedMessages = await redis.lrange(`conv:${testSessionId}:buf`, 0, -1);
          console.log('📋 Mensagens no buffer:');
          bufferedMessages.forEach((msg, index) => {
            const parsed = JSON.parse(msg);
            console.log(`   ${index + 1}. "${parsed.text}"`);
          });
        }
        
      } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
      }
    }, 10000); // Verificar após 10 segundos
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para limpar dados de teste
async function cleanupTestData() {
  console.log('\n🧹 Limpando dados de teste...');
  
  try {
    // Limpar buffer Redis
    await redis.del(`conv:${testSessionId}:buf`);
    
    // Limpar jobs
    const jobs = await messageQueue.getJobs(['delayed', 'waiting', 'active'], 0, -1);
    for (const job of jobs) {
      if (job.name.includes(testSessionId)) {
        await job.remove();
      }
    }
    
    console.log('✅ Dados de teste limpos');
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
  }
}

// Executar teste
testMessageBuffering();

// Cleanup após 60 segundos
setTimeout(async () => {
  await cleanupTestData();
  await redis.disconnect();
  process.exit(0);
}, 60000);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Interrompendo teste...');
  await cleanupTestData();
  await redis.disconnect();
  process.exit(0);
});
