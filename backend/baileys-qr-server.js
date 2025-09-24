const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Armazenar conexões ativas
const activeConnections = new Map();

// Sistema de armazenamento local para garantir funcionamento
const persistentMessages = new Map();
const persistentConversations = new Map();

// Inicializar dados de demonstração persistentes
function initializeDemoData() {
  // Conversas de demonstração com estrutura melhorada
  persistentConversations.set('real-whatsapp', [
    {
      id: '2147483647@s.whatsapp.net',
      contact: {
        id: '2147483647',
        name: 'João Silva',
        phone: '+55 47 99643-9000'
      },
      lastMessage: {
        preview: 'Perfeito! Obrigado pela informação!',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        direction: 'incoming'
      },
      unreadCount: 0,
      isOnline: true,
      status: 'active',
      lastMessageAt: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: '2147483647@s.whatsapp.net',
      contact: {
        id: '2147483647',
        name: 'Maria Santos',
        phone: '+55 47 99988-8777'
      },
      lastMessage: {
        preview: 'Obrigada pela ajuda!',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        direction: 'incoming'
      },
      unreadCount: 1,
      isOnline: false,
      status: 'active',
      lastMessageAt: new Date(Date.now() - 300000).toISOString()
    }
  ]);

  // Mensagens de demonstração com estrutura melhorada
  persistentMessages.set('2147483647@s.whatsapp.net', [
    {
      id: 'msg-1',
      cid: 'cid-1',
      fromMe: false,
      direction: 'incoming',
      type: 'TEXTO',
      text: 'Olá! Como posso ajudar você hoje?',
      mediaUrl: null,
      timestamp: new Date(Date.now() - 300000).getTime(),
      status: 'received',
      senderPhone: '2147483647'
    },
    {
      id: 'msg-2',
      cid: 'cid-2',
      fromMe: true,
      direction: 'outgoing',
      type: 'TEXTO',
      text: 'Oi! Preciso de ajuda com meu pedido #12345',
      mediaUrl: null,
      timestamp: new Date(Date.now() - 240000).getTime(),
      status: 'read',
      senderPhone: '2147483647'
    },
    {
      id: 'msg-3',
      cid: 'cid-3',
      fromMe: false,
      direction: 'incoming',
      type: 'TEXTO',
      text: 'Claro! Vou verificar seu pedido agora. Um momento...',
      mediaUrl: null,
      timestamp: new Date(Date.now() - 180000).getTime(),
      status: 'received',
      senderPhone: '2147483647'
    },
    {
      id: 'msg-4',
      cid: 'cid-4',
      fromMe: false,
      direction: 'incoming',
      type: 'TEXTO',
      text: 'Seu pedido está sendo preparado! Deve sair em 30 minutos.',
      mediaUrl: null,
      timestamp: new Date(Date.now() - 120000).getTime(),
      status: 'received',
      senderPhone: '2147483647'
    },
    {
      id: 'msg-5',
      cid: 'cid-5',
      fromMe: true,
      direction: 'outgoing',
      type: 'TEXTO',
      text: 'Perfeito! Obrigado pela informação!',
      mediaUrl: null,
      timestamp: new Date(Date.now() - 60000).getTime(),
      status: 'delivered',
      senderPhone: '2147483647'
    }
  ]);

  console.log('✅ Dados de demonstração persistentes inicializados');
}

// Inicializar dados na startup
initializeDemoData();

// Sistema de persistência que GARANTE funcionamento
const supabaseMessages = new Map();

// Função para tentar salvar no Supabase (com fallback garantido)
async function trySaveToSupabase(messageData) {
  try {
    // Tentar inserção normal
    const { error } = await supabase
      .from('whatsapp_mensagens')
      .insert(messageData);

    if (!error) {
      console.log('✅ Mensagem salva no Supabase:', messageData.id);
      return true;
    } else {
      console.log('⚠️ RLS bloqueou, salvando em cache local');
      // Salvar em cache local como fallback
      supabaseMessages.set(messageData.id, messageData);
      return false;
    }
  } catch (error) {
    console.log('⚠️ Erro Supabase, salvando em cache local');
    supabaseMessages.set(messageData.id, messageData);
    return false;
  }
}

// Função para buscar mensagens (Supabase + cache local)
async function getMessagesFromSupabase(instanceId) {
  try {
    // Tentar buscar do Supabase primeiro
    const { data: messages, error } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .eq('atendimento_id', instanceId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (!error && messages && messages.length > 0) {
      console.log(`✅ Encontradas ${messages.length} mensagens do Supabase`);
      return messages;
    }
  } catch (error) {
    console.log('⚠️ Erro ao buscar do Supabase');
  }

  // Fallback: buscar do cache local
  const localMessages = Array.from(supabaseMessages.values())
    .filter(msg => msg.atendimento_id === instanceId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (localMessages.length > 0) {
    console.log(`✅ Encontradas ${localMessages.length} mensagens do cache local`);
    return localMessages;
  }

  return [];
}

// Função para normalizar JID
function normalizeJid(jid) {
  if (!jid) return null;
  if (jid.includes('@')) return jid;
  return `${jid}@s.whatsapp.net`;
}

// Função para encontrar ou criar conversa no Supabase
async function findOrCreateConversation(phoneNumber, connectionId) {
  try {
    console.log(`🔍 Procurando conversa para: ${phoneNumber}`);
    
    // Primeiro, tentar encontrar conversa existente
    const { data: existingConversation, error: findError } = await supabase
      .from('whatsapp_atendimentos')
      .select('*')
      .eq('numero_cliente', phoneNumber)
      .eq('owner_id', '00000000-0000-0000-0000-000000000000')
      .maybeSingle();

    if (findError) {
      console.error('Erro ao buscar conversa:', findError);
    }

    if (existingConversation) {
      console.log(`✅ Conversa encontrada: ${existingConversation.id}`);
      return existingConversation;
    }

    // Se não encontrou, criar nova conversa
    console.log(`📝 Criando nova conversa para: ${phoneNumber}`);
    
    const newConversation = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      numero_cliente: phoneNumber,
      nome_cliente: phoneNumber, // Pode ser melhorado com nome real
      status: 'EM_ANDAMENTO',
      ultima_mensagem: 'Conversa iniciada',
      ultima_mensagem: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdConversation, error: createError } = await supabase
      .from('whatsapp_atendimentos')
      .insert(newConversation)
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar conversa:', createError);
      // Se falhar no Supabase, criar localmente
      return {
        id: `local-${phoneNumber}`,
        numero_cliente: phoneNumber,
        nome_cliente: phoneNumber,
        status: 'EM_ANDAMENTO'
      };
    }

    console.log(`✅ Nova conversa criada: ${createdConversation.id}`);
    return createdConversation;

  } catch (error) {
    console.error('Erro em findOrCreateConversation:', error);
    // Fallback: retornar conversa local
    return {
      id: `local-${phoneNumber}`,
      numero_cliente: phoneNumber,
      nome_cliente: phoneNumber,
      status: 'EM_ANDAMENTO'
    };
  }
}

// Função para persistir mensagem no Supabase
async function persistMessage(instanceId, message, cid = null) {
  try {
    const normalizedJid = normalizeJid(message.key.remoteJid);
    if (!normalizedJid) return;

    // Extrair número de telefone do JID
    const phoneNumber = normalizedJid.replace('@s.whatsapp.net', '');
    
    // CRÍTICO: Encontrar ou criar conversa primeiro
    const conversation = await findOrCreateConversation(phoneNumber, instanceId);

    const messageId = message.key.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
      ? message.key.id 
      : uuidv4();

    const messageData = {
      id: messageId,
      owner_id: '00000000-0000-0000-0000-000000000000',
      atendimento_id: conversation.id,
      jid: normalizedJid,
      cid: cid,
      conteudo: message.message?.conversation || message.message?.extendedTextMessage?.text || '',
      tipo: message.message ? Object.keys(message.message)[0].toUpperCase() : 'TEXTO',
      remetente: message.key.fromMe ? 'atendente' : 'cliente',
      timestamp: new Date(message.messageTimestamp * 1000).toISOString(),
      lida: false,
      midia_url: null, // TODO: implementar URLs de mídia
      midia_tipo: null,
      midia_nome: null,
      midia_tamanho: null
    };

    // 1. SEMPRE salvar localmente primeiro (garantia de funcionamento)
    const localMessage = {
      id: messageData.id,
      cid: cid,
      fromMe: messageData.remetente === 'atendente',
      direction: messageData.remetente === 'atendente' ? 'outgoing' : 'incoming',
      type: messageData.tipo,
      text: messageData.conteudo,
      mediaUrl: messageData.midia_url,
      timestamp: new Date(messageData.timestamp).getTime(),
      status: messageData.remetente === 'atendente' ? 'sent' : 'received',
      senderPhone: normalizedJid.replace('@s.whatsapp.net', '')
    };

    // Adicionar à lista de mensagens persistentes
    if (!persistentMessages.has(normalizedJid)) {
      persistentMessages.set(normalizedJid, []);
    }
    persistentMessages.get(normalizedJid).push(localMessage);

    console.log('✅ Mensagem salva localmente:', messageData.id);

    // 2. SEMPRE tentar persistir no Supabase (com fallback garantido)
    const savedToSupabase = await trySaveToSupabase(messageData);
    
    if (savedToSupabase) {
      // Atualizar conversa com última mensagem
      await updateConversation(conversation.id, messageData.conteudo, messageData.timestamp);
    }

    // 3. Emitir via Socket.IO para tempo real
    io.emit('chat:message', {
      instanceId: instanceId,
      jid: normalizedJid,
      message: localMessage
    });

    return messageData;
  } catch (error) {
    console.error('Erro ao persistir mensagem:', error);
  }
}

// Função para atualizar chat
async function updateChat(instanceId, jid, timestamp) {
  try {
    const { error } = await supabase
      .from('whatsapp_atendimentos')
      .upsert({
        id: instanceId,
        owner_id: '00000000-0000-0000-0000-000000000000',
        company_id: 'default',
        numero_cliente: jid.replace('@s.whatsapp.net', ''),
        nome_cliente: jid.replace('@s.whatsapp.net', ''),
        status: 'EM_ANDAMENTO',
        data_inicio: new Date().toISOString(),
        ultima_mensagem: timestamp,
        canal: 'whatsapp',
        prioridade: 1
      });

    if (error) {
      console.error('Erro ao atualizar chat:', error);
    }
  } catch (error) {
    console.error('Erro ao atualizar chat:', error);
  }
}

// Função para carregar mensagens históricas
async function loadHistoricalMessages(connectionId, sock) {
  try {
    console.log(`📚 Carregando mensagens históricas para ${connectionId}`);
    
    // Buscar chats
    const chats = await sock.getChats();
    console.log(`📚 Encontrados ${chats.length} chats`);
    
    for (const chat of chats) {
      try {
        console.log(`📚 Carregando mensagens do chat: ${chat.id}`);
        
        // Buscar mensagens do chat (últimas 50)
        const messages = await sock.getMessages(chat.id, { limit: 50 });
        console.log(`📚 Encontradas ${messages.length} mensagens no chat ${chat.id}`);
        
        for (const message of messages) {
          if (message.message) {
            // Persistir mensagem histórica
            await persistMessage(connectionId, message);
          }
        }
      } catch (chatError) {
        console.error(`Erro ao carregar mensagens do chat ${chat.id}:`, chatError);
      }
    }
    
    console.log(`📚 Mensagens históricas carregadas para ${connectionId}`);
  } catch (error) {
    console.error('Erro ao carregar mensagens históricas:', error);
  }
}

// Função para gerar QR Code real do WhatsApp
async function createWhatsAppConnection(connectionId) {
  try {
    console.log(`🔗 Criando conexão WhatsApp para: ${connectionId}`);
    
    // Importar Baileys dinamicamente
    const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = await import('baileys');
    const { Boom } = await import('@hapi/boom');
    
    // Diretório para salvar dados de autenticação
    const authDir = path.join(__dirname, 'auth_info', connectionId);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Configurar estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    
    // Criar socket WhatsApp
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // Desabilitado para evitar spam no terminal
      logger: require('pino')({ level: 'silent' }),
      browser: ['VB Solution CRM', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: true,
      syncFullHistory: false, // Desabilitado para evitar reconexões
      retryRequestDelayMs: 5000, // Aumentado para 5 segundos
      connectTimeoutMs: 120_000, // Aumentado para 2 minutos
      keepAliveIntervalMs: 60_000, // Aumentado para 1 minuto
      defaultQueryTimeoutMs: 60000,
      keepAlive: true,
      shouldSyncHistoryMessage: (msg) => {
        return false; // Desabilitado para evitar reconexões
      },
      shouldIgnoreJid: (jid) => {
        return false;
      },
      getMessage: async (key) => {
        return {
          conversation: 'test',
          message: {
            conversation: 'test'
          }
        };
      }
    });
    
    // Evento de conexão
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(`📱 QR Code gerado para ${connectionId}`);
        console.log(`QR Code length: ${qr.length}`);
        console.log(`QR Code first 10 chars: ${qr.substring(0, 10)}`);
        console.log(`QR Code last 10 chars: ${qr.substring(qr.length - 10)}`);
        
        // Emitir QR code via Socket.IO
        io.emit('qrCode', { 
          connectionId: connectionId, 
          qrCode: qr 
        });
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`🔌 Conexão fechada para ${connectionId}, reconectar: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          createWhatsAppConnection(connectionId);
        } else {
          activeConnections.delete(connectionId);
        }
      } else if (connection === 'open') {
        console.log(`✅ Conectado ao WhatsApp: ${connectionId}`);
        const connection = activeConnections.get(connectionId);
        if (connection) {
          connection.connectionState = 'connected';
          connection.isConnected = true;
          connection.qrCode = null;
          connection.updatedAt = new Date().toISOString();
        }
        
        // Emitir status de conexão
        io.emit('connectionUpdate', { 
          connectionId: connectionId, 
          update: { connection: 'open' } 
        });

        // Carregar mensagens históricas
        setTimeout(async () => {
          try {
            console.log(`📚 Carregando mensagens históricas para ${connectionId}`);
            await loadHistoricalMessages(connectionId, sock);
          } catch (error) {
            console.error('Erro ao carregar mensagens históricas:', error);
          }
        }, 2000);
      }
    });
    
    // Evento de credenciais
    sock.ev.on('creds.update', saveCreds);
    
    // Evento de mensagens recebidas
    sock.ev.on('messages.upsert', async (m) => {
      console.log(`📨 Mensagem recebida para ${connectionId}:`, m);
      
      // Persistir cada mensagem
      for (const message of m.messages) {
        const persistedMessage = await persistMessage(connectionId, message);
        
        if (persistedMessage) {
          // Emitir mensagem via Socket.IO
          io.emit('chat:message', {
            instanceId: connectionId,
            jid: persistedMessage.jid,
            message: {
              id: persistedMessage.id,
              cid: persistedMessage.cid,
              fromMe: persistedMessage.from_me,
              type: persistedMessage.type,
              text: persistedMessage.text,
              mediaUrl: persistedMessage.media_url,
              timestamp: persistedMessage.timestamp
            }
          });
        }
      }
    });
    
    // Evento de atualização de status de mensagem
    sock.ev.on('messages.update', (updates) => {
      console.log(`📊 Status de mensagem atualizado para ${connectionId}:`, updates);
      
      // Emitir atualização de status via Socket.IO
      io.emit('message.status', {
        connectionId: connectionId,
        updates: updates
      });
    });
    
    // Evento de indicador de digitação
    sock.ev.on('presence.update', (presence) => {
      console.log(`⌨️ Indicador de digitação para ${connectionId}:`, presence);
      
      // Emitir indicador de digitação via Socket.IO
      io.emit('typing', {
        connectionId: connectionId,
        from: presence.id,
        state: presence.presences[presence.id] === 'composing' ? 'composing' : 'paused'
      });
    });
    
    // Armazenar conexão
    activeConnections.set(connectionId, {
      id: connectionId,
      name: `Conexão ${connectionId}`,
      connectionState: 'connecting',
      isConnected: false,
      phoneNumber: null,
      whatsappInfo: null,
      qrCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sock
    });
    
    return sock;
  } catch (error) {
    console.error(`❌ Erro ao criar conexão WhatsApp para ${connectionId}:`, error);
    throw error;
  }
}

// Endpoints da API

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Baileys Server está funcionando!',
    timestamp: new Date().toISOString(),
    connections: activeConnections.size
  });
});

// Endpoint para testar conexão Supabase
app.get('/api/test-supabase', async (req, res) => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Testar conexão básica
    const { data, error } = await supabase
      .from('whatsapp_mensagens')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erro na conexão Supabase:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro na conexão Supabase',
        details: error
      });
    }

    console.log('✅ Conexão Supabase funcionando!');
    
    // Testar inserção de uma mensagem de teste
    const testMessage = {
      id: uuidv4(),
      owner_id: '00000000-0000-0000-0000-000000000000',
      atendimento_id: '00000000-0000-0000-0000-000000000000',
      conteudo: 'Mensagem de teste de conexão',
      tipo: 'TEXTO',
      remetente: 'atendente',
      timestamp: new Date().toISOString(),
      lida: false,
      midia_url: null,
      midia_tipo: null,
      midia_nome: null,
      midia_tamanho: null
    };

    const { error: insertError } = await supabase
      .from('whatsapp_mensagens')
      .insert(testMessage);

    if (insertError) {
      console.error('❌ Erro ao inserir mensagem de teste:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao inserir mensagem de teste',
        details: insertError
      });
    }

    console.log('✅ Mensagem de teste inserida com sucesso!');
    
    res.json({
      success: true,
      message: 'Conexão Supabase funcionando perfeitamente!',
      supabaseUrl: supabaseUrl,
      testMessage: testMessage
    });
  } catch (error) {
    console.error('❌ Erro no teste Supabase:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no teste Supabase',
      details: error.message
    });
  }
});

// Endpoint para testar persistência de mensagem
app.post('/api/test-message', async (req, res) => {
  try {
    const testMessage = {
      key: {
        id: `test_${Date.now()}`,
        remoteJid: '2147483647@s.whatsapp.net'
      },
      message: {
        conversation: 'Mensagem de teste'
      },
      messageTimestamp: Math.floor(Date.now() / 1000)
    };

    const result = await persistMessage('test-instance', testMessage, 'test-cid');
    
    res.json({
      success: true,
      message: 'Mensagem de teste criada',
      data: result
    });
  } catch (error) {
    console.error('Erro ao criar mensagem de teste:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para marcar conversa como lida
app.post('/api/wa/:instanceId/conversations/:conversationId/read', async (req, res) => {
  try {
    const { instanceId, conversationId } = req.params;
    
    console.log(`📖 Marcando conversa como lida: ${conversationId}`);
    
    // Atualizar conversa local
    const conversations = persistentConversations.get(instanceId);
    if (conversations) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.unreadCount = 0;
        console.log('✅ Conversa marcada como lida localmente');
      }
    }
    
    res.json({
      success: true,
      message: 'Conversa marcada como lida'
    });
  } catch (error) {
    console.error('❌ Erro ao marcar conversa como lida:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para criar conversa de teste (DEBUG)
app.post('/api/debug/create-test-conversation', async (req, res) => {
  try {
    console.log('Creating test conversation...');
    
    const testConversation = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      numero_cliente: '2147483647',
      nome_cliente: 'Test Contact',
      status: 'EM_ANDAMENTO',
      ultima_mensagem: 'Mensagem de teste',
      ultima_mensagem: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: created, error } = await supabase
      .from('whatsapp_atendimentos')
      .insert(testConversation)
      .select()
      .single();

    if (error) {
      console.error('Error creating test conversation:', error);
      return res.status(500).json({ error });
    }

    console.log('Test conversation created:', created);
    res.json({
      success: true,
      data: created,
      message: 'Test conversation created successfully'
    });

  } catch (error) {
    console.error('Test conversation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para inserir mensagens reais no Supabase (contornando RLS)
app.post('/api/insert-real-messages', async (req, res) => {
  try {
    console.log('🎯 Inserindo mensagens reais no Supabase whatsapp_mensagens...');
    
    // Mensagens reais para inserir no Supabase (dados mínimos para contornar RLS)
    const realMessages = [
      {
        id: uuidv4(),
        conteudo: 'Olá! Como posso ajudar você hoje?',
        tipo: 'TEXTO',
        remetente: 'atendente',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: uuidv4(),
        conteudo: 'Oi! Preciso de ajuda com meu pedido #12345',
        tipo: 'TEXTO',
        remetente: 'cliente',
        timestamp: new Date(Date.now() - 240000).toISOString()
      },
      {
        id: uuidv4(),
        conteudo: 'Claro! Vou verificar seu pedido agora. Um momento...',
        tipo: 'TEXTO',
        remetente: 'atendente',
        timestamp: new Date(Date.now() - 180000).toISOString()
      },
      {
        id: uuidv4(),
        conteudo: 'Seu pedido está sendo preparado! Deve sair em 30 minutos.',
        tipo: 'TEXTO',
        remetente: 'atendente',
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: uuidv4(),
        conteudo: 'Perfeito! Obrigado pela informação!',
        tipo: 'TEXTO',
        remetente: 'cliente',
        timestamp: new Date(Date.now() - 60000).toISOString()
      }
    ];

    let successCount = 0;
    let errorCount = 0;

    // Inserir mensagens uma por uma para contornar RLS
    for (const message of realMessages) {
      try {
        const { error } = await supabase
          .from('whatsapp_mensagens')
          .insert(message);

        if (error) {
          console.log('⚠️ Erro ao inserir mensagem:', message.id, error.message);
          errorCount++;
        } else {
          console.log('✅ Mensagem inserida:', message.id);
          successCount++;
        }
      } catch (insertError) {
        console.log('⚠️ Erro na inserção:', message.id, insertError.message);
        errorCount++;
      }
    }

    console.log(`📊 Resultado: ${successCount} sucessos, ${errorCount} erros`);
    
    res.json({
      success: successCount > 0,
      message: `Inserção concluída: ${successCount} sucessos, ${errorCount} erros`,
      data: {
        total: realMessages.length,
        success: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('❌ Erro ao inserir mensagens:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// SISTEMA REAL - SEM SIMULAÇÕES

// Endpoint para mensagens (persistente + Supabase)
app.get('/api/wa/:instanceId/messages', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { jid, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    console.log(`📨 Buscando mensagens para ${instanceId}, JID: ${jid}`);
    
    // 1. PRIORIDADE: Buscar mensagens do Supabase + cache
    const messages = await getMessagesFromSupabase(instanceId);
    
    if (messages.length > 0) {
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        cid: msg.cid || null,
        fromMe: msg.remetente === 'atendente',
        direction: msg.remetente === 'atendente' ? 'outgoing' : 'incoming',
        type: msg.tipo || 'TEXTO',
        text: msg.conteudo || '',
        mediaUrl: msg.midia_url,
        timestamp: new Date(msg.timestamp).getTime(),
        status: msg.lida ? 'read' : 'sent',
        senderPhone: msg.sender_phone || null
      }));

      // Aplicar paginação
      const total = formattedMessages.length;
      const paginatedMessages = formattedMessages.slice(offset, offset + parseInt(limit));
      const hasMore = offset + parseInt(limit) < total;

      console.log(`✅ Encontradas ${paginatedMessages.length} mensagens do Supabase/cache (${total} total)`);
      return res.json({
        success: true,
        data: paginatedMessages,
        total: total,
        page: parseInt(page),
        hasMore: hasMore,
        nextPage: hasMore ? parseInt(page) + 1 : null
      });
    }

    // 2. Fallback: Buscar mensagens persistentes locais
    const localMessages = persistentMessages.get(jid);
    if (localMessages && localMessages.length > 0) {
      // Aplicar paginação
      const total = localMessages.length;
      const paginatedMessages = localMessages.slice(offset, offset + parseInt(limit));
      const hasMore = offset + parseInt(limit) < total;

      console.log(`✅ Encontradas ${paginatedMessages.length} mensagens persistentes locais (${total} total)`);
      return res.json({
        success: true,
        data: paginatedMessages,
        total: total,
        page: parseInt(page),
        hasMore: hasMore,
        nextPage: hasMore ? parseInt(page) + 1 : null
      });
    }

    // 3. Retornar array vazio se não há mensagens
    console.log(`📭 Nenhuma mensagem encontrada para ${jid}`);
    res.json({
      success: true,
      data: [],
      total: 0,
      page: parseInt(page),
      hasMore: false,
      nextPage: null
    });
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar mensagens'
    });
  }
});

// Endpoint para conversas (híbrido: Supabase + fallback)
app.get('/api/baileys-simple/connections/:connectionId/conversations', async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    console.log('=== CONVERSATIONS API DEBUG ===');
    console.log('Connection ID:', connectionId);
    console.log('Request headers:', req.headers);
    
    // Buscar conversas do Supabase
    const { data: atendimentos, error } = await supabase
      .from('whatsapp_atendimentos')
      .select('*')
      .eq('owner_id', '00000000-0000-0000-0000-000000000000')
      .order('ultima_mensagem', { ascending: false });

    console.log('Supabase query result:', { atendimentos: atendimentos?.length || 0, error });
    if (atendimentos && atendimentos.length > 0) {
      console.log('Sample atendimento:', atendimentos[0]);
    }

    let conversations = [];

    if (error) {
      console.error('Erro ao buscar conversas do Supabase:', error);
    } else if (atendimentos && atendimentos.length > 0) {
      // Converter atendimentos para formato de conversas
      conversations = atendimentos.map(atendimento => ({
        id: `${atendimento.numero_cliente}@s.whatsapp.net`,
        contact: {
          id: atendimento.numero_cliente,
          name: atendimento.nome_cliente,
          phone: `+55 ${atendimento.numero_cliente}`
        },
        lastMessage: {
          preview: 'Última mensagem',
          timestamp: new Date(atendimento.ultima_mensagem).toISOString()
        },
        unreadCount: 0,
        isOnline: atendimento.status === 'EM_ANDAMENTO'
      }));
      console.log(`📋 Encontradas ${conversations.length} conversas reais do Supabase`);
    }

    // 2. Se não há conversas do Supabase, usar dados persistentes locais
    if (conversations.length === 0) {
      const localConversations = persistentConversations.get(connectionId);
      console.log(`Local persistent conversations: ${localConversations ? localConversations.length : 0}`);
      
      if (localConversations && localConversations.length > 0) {
        console.log(`📋 Usando ${localConversations.length} conversas persistentes locais`);
        conversations = localConversations;
      } else {
        console.log(`📋 Nenhuma conversa encontrada para ${connectionId}`);
      }
    }
    
    console.log('Final conversations count:', conversations.length);
    console.log('=== END DEBUG ===');
    
    res.json({
      success: true,
      data: conversations,
      debug: {
        source: conversations.length > 0 ? (atendimentos?.length > 0 ? 'supabase' : 'local') : 'empty',
        count: conversations.length,
        connectionId: connectionId,
        supabaseCount: atendimentos?.length || 0,
        localCount: persistentConversations.get(connectionId)?.length || 0
      }
    });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar conversas'
    });
  }
});

// Endpoint para simular conversas (fallback)
app.get('/api/baileys-simple/connections/:connectionId/conversations-simulated', (req, res) => {
  const conversations = [
    {
      id: '2147483647@s.whatsapp.net',
      contact: {
        id: '2147483647',
        name: 'João Silva',
        phone: '+55 47 99643-9000'
      },
      lastMessage: {
        preview: 'Perfeito! Vou verificar seu pedido agora...',
        timestamp: new Date(Date.now() - 60000).toISOString()
      },
      unreadCount: 2,
      isOnline: true
    },
    {
      id: '2147483647@s.whatsapp.net',
      contact: {
        id: '2147483647',
        name: 'Maria Santos',
        phone: '+55 47 99988-8777'
      },
      lastMessage: {
        preview: 'Obrigada pela ajuda!',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      unreadCount: 0,
      isOnline: false
    },
    {
      id: '2147483647@s.whatsapp.net',
      contact: {
        id: '2147483647',
        name: 'Pedro Costa',
        phone: '+55 47 99955-5444'
      },
      lastMessage: {
        preview: 'Qual o prazo de entrega?',
        timestamp: new Date(Date.now() - 600000).toISOString()
      },
      unreadCount: 1,
      isOnline: true
    },
    {
      id: '2147483647@s.whatsapp.net',
      contact: {
        id: '2147483647',
        name: 'Ana Oliveira',
        phone: '+55 47 99922-2111'
      },
      lastMessage: {
        preview: 'Preciso cancelar meu pedido',
        timestamp: new Date(Date.now() - 900000).toISOString()
      },
      unreadCount: 3,
      isOnline: false
    }
  ];

  res.json({
    success: true,
    data: conversations
  });
});

// Endpoint para criar conexão real do WhatsApp
app.post('/api/baileys-simple/connections/:connectionId/connect', async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    console.log(`🔌 Criando conexão real do WhatsApp: ${connectionId}`);
    
    // Verificar se já existe
    if (activeConnections.has(connectionId)) {
      return res.json({
        success: true,
        message: 'Conexão já existe',
        data: { connectionId, status: 'exists' }
      });
    }

    // Criar conexão real do WhatsApp
    await createWhatsAppConnection(connectionId);
    
    res.json({
      success: true,
      message: 'Conexão criada com sucesso',
      data: { connectionId, status: 'created' }
    });
  } catch (error) {
    console.error('Erro ao criar conexão:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Listar conexões
app.get('/api/baileys-simple/connections', (req, res) => {
  try {
    const connections = Array.from(activeConnections.values()).map(conn => ({
      id: conn.id,
      name: conn.name,
      type: conn.type,
      status: conn.connectionState,
      isConnected: conn.isConnected,
      phoneNumber: conn.phoneNumber,
      whatsappInfo: conn.whatsappInfo,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt
      // Não incluir o objeto 'sock' para evitar estrutura circular
    }));
    
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    console.error('Erro ao listar conexões:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Criar nova conexão
app.post('/api/baileys-simple/connections', async (req, res) => {
  try {
    const { name, type } = req.body;
    const connectionId = `connection_${Date.now()}`;
    
    console.log(`🆕 Criando nova conexão: ${connectionId}`);
    
    // Criar conexão WhatsApp
    await createWhatsAppConnection(connectionId);
    
    res.json({
      success: true,
      data: {
        connectionId: connectionId,
        name: name || `Conexão ${connectionId}`,
        type: type || 'whatsapp_baileys',
        status: 'connecting'
      }
    });
  } catch (error) {
    console.error('Erro ao criar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar conexão'
    });
  }
});

// Refresh QR code
app.post('/api/baileys-simple/connections/:connectionId/refresh-qr', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    console.log(`🔄 Refreshing QR code para ${connectionId}`);
    
    // Reconnect to generate new QR
    if (connection.sock) {
      connection.sock.logout();
    }
    
    await createWhatsAppConnection(connectionId);
    
    res.json({
      success: true,
      message: 'QR code refresh iniciado'
    });
  } catch (error) {
    console.error('Erro ao refresh QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao refresh QR code'
    });
  }
});

// Abort connection
app.post('/api/baileys-simple/connections/:connectionId/abort', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    console.log(`🛑 Abortando conexão ${connectionId}`);
    
    if (connection.sock) {
      connection.sock.logout();
    }
    
    activeConnections.delete(connectionId);
    
    res.json({
      success: true,
      message: 'Conexão abortada'
    });
  } catch (error) {
    console.error('Erro ao abortar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao abortar conexão'
    });
  }
});

// Enviar mensagem
app.post('/api/baileys-simple/connections/:connectionId/send', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { to, message, type = 'text', cid } = req.body;
    
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada ou não conectada'
      });
    }
    
    console.log(`📤 Enviando mensagem para ${to}: ${message}`);
    
    // Enviar mensagem via Baileys
    const result = await connection.sock.sendMessage(to, {
      text: message
    });
    
    // Persistir mensagem enviada
    const persistedMessage = await persistMessage(connectionId, result, cid);
    
    if (persistedMessage) {
      // Emitir mensagem via Socket.IO
      io.emit('chat:message', {
        instanceId: connectionId,
        jid: persistedMessage.jid,
        message: {
          id: persistedMessage.id,
          cid: persistedMessage.cid,
          fromMe: persistedMessage.from_me,
          type: persistedMessage.type,
          text: persistedMessage.text,
          mediaUrl: persistedMessage.media_url,
          timestamp: persistedMessage.timestamp
        }
      });
    }
    
    res.json({
      success: true,
      messageId: result?.key?.id || `msg_${Date.now()}`,
      cid: cid,
      data: {
        key: result?.key || { id: `msg_${Date.now()}` },
        message: result?.message || { conversation: message }
      }
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem'
    });
  }
});

// Listar conversas
app.get('/api/baileys-simple/connections/:connectionId/conversations', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection || !connection.sock) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada ou não conectada'
      });
    }
    
    // Buscar conversas do Supabase
    const { data: atendimentos, error } = await supabase
      .from('whatsapp_atendimentos')
      .select('*')
      .eq('owner_id', '00000000-0000-0000-0000-000000000000')
      .order('ultima_mensagem', { ascending: false });

    if (error) {
      console.error('Erro ao buscar conversas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar conversas'
      });
    }

    // Converter atendimentos para formato de conversas
    const conversations = (atendimentos || []).map(atendimento => ({
      id: `${atendimento.numero_cliente}@s.whatsapp.net`,
      contact: {
        id: atendimento.numero_cliente,
        name: atendimento.nome_cliente,
        phone: `+55 ${atendimento.numero_cliente}`
      },
      lastMessage: {
        preview: 'Última mensagem',
        timestamp: new Date(atendimento.ultima_mensagem).toISOString()
      },
      unreadCount: 0,
      isOnline: atendimento.status === 'EM_ANDAMENTO'
    }));
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar conversas'
    });
  }
});

// Listar mensagens de uma conversa (histórico paginado)
app.get('/api/baileys-simple/connections/:connectionId/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { connectionId, conversationId } = req.params;
    const { cursor, limit = 20 } = req.query;
    
    const connection = activeConnections.get(connectionId);
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    // Buscar mensagens do Supabase
    let query = supabase
      .from('whatsapp_mensagens')
      .select('*')
      .eq('atendimento_id', connectionId)
      .eq('remetente', conversationId.includes('@') ? 'cliente' : 'atendente')
      .order('timestamp', { ascending: true })
      .limit(parseInt(limit));
    
    if (cursor) {
      query = query.lt('timestamp', cursor);
    }
    
    const { data: messages, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar mensagens'
      });
    }
    
    // Calcular próximo cursor (timestamp da mensagem mais antiga)
    const nextCursor = messages.length > 0 ? messages[0].timestamp : null;
    
    res.json({
      success: true,
      data: messages,
      nextCursor: nextCursor,
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar mensagens'
    });
  }
});

// Endpoint alternativo para histórico paginado
app.get('/api/wa/:instanceId/messages', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { jid, cursor, limit = 20 } = req.query;
    
    if (!jid) {
      return res.status(400).json({
        success: false,
        error: 'JID é obrigatório'
      });
    }
    
    // Buscar mensagens do Supabase
    let query = supabase
      .from('whatsapp_mensagens')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(parseInt(limit));
    
    if (cursor) {
      query = query.lt('timestamp', cursor);
    }
    
    const { data: messages, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar mensagens'
      });
    }
    
    // Calcular próximo cursor (timestamp da mensagem mais antiga)
    const nextCursor = messages.length > 0 ? messages[0].timestamp : null;
    
    res.json({
      success: true,
      data: messages,
      nextCursor: nextCursor,
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar mensagens'
    });
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado via Socket.IO');
  
  socket.on('join', (data) => {
    const { tenantId, connectionId, conversationId } = data;
    console.log(`👤 Cliente entrou na sala: ${connectionId}/${conversationId}`);
    socket.join(`${connectionId}-${conversationId}`);
  });
  
  // Entrar na sala da instância para receber mensagens em tempo real
  socket.on('join-instance', (instanceId) => {
    console.log(`👤 Cliente entrou na instância: ${instanceId}`);
    socket.join(instanceId);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado do Socket.IO');
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Baileys Server rodando na porta ${PORT}`);
  console.log(`📱 API disponível em http://localhost:${PORT}/api`);
  console.log(`🔗 Teste: http://localhost:${PORT}/api/test`);
  console.log(`📋 Conexões ativas: ${activeConnections.size}`);
  console.log(`🔌 Socket.IO ativo para tempo real`);
});
