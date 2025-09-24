const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { 
  upsertConversation, 
  saveMessage, 
  updateConversation, 
  getMessages, 
  getConversations, 
  markMessagesAsRead, 
  updateMessageStatus 
} = require('./database');

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
    
    // Criar logger
    const logger = pino({ level: 'silent' });
    
    // Criar socket WhatsApp
    const sock = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 5,
      msgRetryCounterCache: new Map(),
      getMessage: async (key) => {
        return {
          conversation: "Mensagem não encontrada"
        };
      }
    });

    // Evento de conexão
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(`📱 QR Code gerado para ${connectionId}`);
        // Gerar QR Code em base64
        QRCode.toDataURL(qr, { type: 'png', width: 300 })
          .then(qrDataUrl => {
            activeConnections.set(connectionId, {
              id: connectionId,
              name: `Conexão ${connectionId}`,
              connectionState: 'connecting',
              isConnected: false,
              phoneNumber: null,
              whatsappInfo: null,
              qrCode: qrDataUrl,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          })
          .catch(err => console.error('Erro ao gerar QR Code:', err));
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
      }
    });

    // Evento de credenciais
    sock.ev.on('creds.update', saveCreds);

    // Evento de mensagens
    sock.ev.on('messages.upsert', async (m) => {
      console.log(`📨 Nova mensagem recebida em ${connectionId}:`, m.messages.length);
      
      for (const msg of m.messages) {
        try {
          // Extrair informações da mensagem
          const jid = msg.key.remoteJid;
          const messageId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const isFromMe = msg.key.fromMe;
          const waMsgId = msg.key.id;
          const timestamp = new Date((msg.messageTimestamp || Date.now()) * 1000);
          
          // Detectar tipo de mensagem e extrair conteúdo
          let messageType = 'text';
          let messageBody = '';
          let mediaUrl = null;
          let mediaMimetype = null;
          let caption = null;

          if (msg.message?.conversation) {
            messageType = 'text';
            messageBody = msg.message.conversation;
          } else if (msg.message?.imageMessage) {
            messageType = 'image';
            messageBody = msg.message.imageMessage.caption || '[Imagem]';
            mediaUrl = msg.message.imageMessage.url;
            mediaMimetype = msg.message.imageMessage.mimetype;
            caption = msg.message.imageMessage.caption;
          } else if (msg.message?.videoMessage) {
            messageType = 'video';
            messageBody = msg.message.videoMessage.caption || '[Vídeo]';
            mediaUrl = msg.message.videoMessage.url;
            mediaMimetype = msg.message.videoMessage.mimetype;
            caption = msg.message.videoMessage.caption;
          } else if (msg.message?.audioMessage) {
            messageType = 'audio';
            messageBody = '[Áudio]';
            mediaUrl = msg.message.audioMessage.url;
            mediaMimetype = msg.message.audioMessage.mimetype;
          } else if (msg.message?.documentMessage) {
            messageType = 'document';
            messageBody = msg.message.documentMessage.caption || msg.message.documentMessage.fileName || '[Documento]';
            mediaUrl = msg.message.documentMessage.url;
            mediaMimetype = msg.message.documentMessage.mimetype;
            caption = msg.message.documentMessage.caption;
          } else if (msg.message?.extendedTextMessage) {
            messageType = 'text';
            messageBody = msg.message.extendedTextMessage.text || '';
          } else if (msg.message?.stickerMessage) {
            messageType = 'sticker';
            messageBody = '[Sticker]';
            mediaUrl = msg.message.stickerMessage.url;
            mediaMimetype = msg.message.stickerMessage.mimetype;
          } else {
            messageType = 'text';
            messageBody = '[Mensagem]';
          }

          // Determinar status da mensagem
          let status = 'delivered';
          if (isFromMe) {
            status = 'sent';
          }
          
          // Criar/obter conversa no banco
          const tenantId = 'default';
          const contactId = jid.split('@')[0];
          const { id: conversationId } = upsertConversation(tenantId, connectionId, jid, contactId);
          
          // Salvar mensagem no banco
          const messageData = {
            id: messageId,
            tenantId,
            conversationId,
            waMsgId,
            jid,
            direction: isFromMe ? 'out' : 'in',
            type: messageType,
            body: messageBody,
            mediaUrl,
            mediaMimetype,
            caption,
            createdAt: timestamp.toISOString(),
            status
          };
          
          saveMessage(messageData);
          
          // Atualizar conversa
          updateConversation(conversationId, timestamp.toISOString(), isFromMe ? 0 : 1);
          
          console.log(`💾 Mensagem salva no banco: ${messageId}`);

          // Emitir via Socket.IO
          io.emit('message.new', {
            id: messageId,
            conversationId,
            direction: isFromMe ? 'out' : 'in',
            type: messageType,
            body: messageBody,
            createdAt: timestamp.toISOString(),
            status
          });
          console.log(`📡 Mensagem emitida via Socket.IO: ${messageId}`);
          
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
        }
      }
    });

    // Evento de atualização de status de mensagem
    sock.ev.on('messages.update', (updates) => {
      console.log(`📊 Atualização de status de mensagem:`, updates);
      
      for (const update of updates) {
        if (update.update?.status) {
          const waMsgId = update.key.id;
          let status = 'sent';
          
          switch (update.update.status) {
            case 1: status = 'sent'; break;
            case 2: status = 'delivered'; break;
            case 3: status = 'read'; break;
            case 4: status = 'failed'; break;
          }
          
          updateMessageStatus(waMsgId, status);
          
          // Emitir via Socket.IO
          io.emit('message.status', {
            messageId: waMsgId,
            status
          });
        }
      }
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

// Listar conexões
app.get('/api/baileys-simple/connections', (req, res) => {
  const connections = Array.from(activeConnections.values());
  res.json({ success: true, data: connections });
});

// Criar nova conexão
app.post('/api/baileys-simple/connections', async (req, res) => {
  try {
    const { connectionId, name } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({ success: false, error: 'connectionId é obrigatório' });
    }

    if (activeConnections.has(connectionId)) {
      return res.status(409).json({ success: false, error: 'Conexão já existe' });
    }

    // Criar conexão
    await createWhatsAppConnection(connectionId);
    
    res.json({ 
      success: true, 
      data: {
        id: connectionId,
        name: name || `Conexão ${connectionId}`,
        connectionState: 'connecting',
        isConnected: false,
        phoneNumber: null,
        whatsappInfo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao criar conexão:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter QR Code
app.get('/api/baileys-simple/connections/:id/qr', (req, res) => {
  const { id } = req.params;
  const connection = activeConnections.get(id);
  
  if (!connection) {
    return res.status(404).json({ success: false, error: 'Conexão não encontrada' });
  }

  res.json({ 
    success: true, 
    data: { 
      qrCode: connection.qrCode,
      connectionState: connection.connectionState,
      isConnected: connection.isConnected
    }
  });
});

// Listar conversas
app.get('/api/conversations', (req, res) => {
  try {
    const { connectionId, limit = 30 } = req.query;
    
    if (!connectionId) {
      return res.status(400).json({ success: false, error: 'connectionId é obrigatório' });
    }

    const conversations = getConversations(connectionId, parseInt(limit));
    
    res.json({
      success: true,
      items: conversations,
      nextCursor: null
    });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Buscar mensagens de uma conversa
app.get('/api/conversations/:conversationId/messages', (req, res) => {
  try {
    const { conversationId } = req.params;
    const { cursor, limit = 20 } = req.query;
    
    const result = getMessages(conversationId, cursor, parseInt(limit));
    
    res.json({
      success: true,
      items: result.items,
      nextCursor: result.nextCursor
    });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enviar mensagem
app.post('/api/messages/send', async (req, res) => {
  try {
    const { connectionId, conversationId, to, type, payload } = req.body;
    
    if (!connectionId || !to) {
      return res.status(400).json({ success: false, error: 'connectionId e to são obrigatórios' });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.sock) {
      return res.status(404).json({ success: false, error: 'Conexão não encontrada' });
    }

    const sock = connection.sock;
    let content = {};

    // Preparar conteúdo da mensagem
    switch (type) {
      case 'text':
        content = { text: payload.body };
        break;
      case 'image':
        content = { 
          image: { url: payload.url }, 
          caption: payload.caption 
        };
        break;
      case 'audio':
        content = { 
          audio: { url: payload.url }, 
          mimetype: payload.mimetype 
        };
        break;
      default:
        content = { text: payload.body };
    }

    // Enviar mensagem via Baileys
    const result = await sock.sendMessage(to, content);
    
    // Salvar mensagem no banco
    const messageId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tenantId = 'default';
    const contactId = to.split('@')[0];
    const { id: dbConversationId } = upsertConversation(tenantId, connectionId, to, contactId);
    
    const messageData = {
      id: messageId,
      tenantId,
      conversationId: dbConversationId,
      waMsgId: result?.key?.id,
      jid: to,
      direction: 'out',
      type,
      body: payload.body,
      mediaUrl: payload.url,
      mediaMimetype: payload.mimetype,
      caption: payload.caption,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };
    
    saveMessage(messageData);
    updateConversation(dbConversationId, new Date().toISOString(), 0);
    
    // Emitir via Socket.IO
    io.emit('message.new', {
      id: messageId,
      conversationId: dbConversationId,
      direction: 'out',
      type,
      body: payload.body,
      createdAt: messageData.createdAt,
      status: 'sent'
    });

    res.json({ 
      success: true, 
      data: { 
        id: messageId, 
        status: 'queued' 
      }
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Marcar mensagens como lidas
app.post('/api/messages/read', (req, res) => {
  try {
    const { conversationId, messageIds } = req.body;
    
    if (!conversationId || !messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ success: false, error: 'conversationId e messageIds são obrigatórios' });
    }

    markMessagesAsRead(conversationId, messageIds);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Indicador de digitação
app.post('/api/messages/typing', (req, res) => {
  try {
    const { conversationId, state } = req.body;
    
    // Emitir via Socket.IO
    io.emit('typing', {
      conversationId,
      from: 'agent',
      state
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar indicador de digitação:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook para verificação
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado com sucesso');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Falha na verificação do webhook');
    res.status(403).send('Forbidden');
  }
});

// Webhook para receber mensagens
app.post('/api/webhook', (req, res) => {
  console.log('📨 Webhook recebido:', req.body);
  res.status(200).send('OK');
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado via Socket.IO');
  
  socket.on('join', ({ connectionId, conversationId }) => {
    console.log(`👤 Cliente entrou na sala: ${connectionId}/${conversationId}`);
    socket.join(`${connectionId}/${conversationId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado do Socket.IO');
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 WhatsApp Business API disponível em http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});
