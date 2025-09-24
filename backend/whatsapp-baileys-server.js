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
    
    // Criar socket do WhatsApp
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // Não imprimir QR no terminal
      logger: logger
    });
    
    // Armazenar conexão
    const connection = {
      id: connectionId,
      socket: sock,
      qrCode: null,
      isConnected: false,
      phoneNumber: null,
      whatsappInfo: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    activeConnections.set(connectionId, connection);
    
    // Evento de QR Code
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log(`📱 QR Code gerado para ${connectionId}`);
        try {
          // Gerar QR Code como data URL
          const qrCodeDataURL = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
          });
          
          // Atualizar conexão com QR Code
          const conn = activeConnections.get(connectionId);
          if (conn) {
            conn.qrCode = qrCodeDataURL;
            conn.updatedAt = new Date();
            console.log(`✅ QR Code atualizado para ${connectionId}`);
          }
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
        }
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`❌ Conexão fechada para ${connectionId}, reconectar: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          // Reconectar após 5 segundos
          setTimeout(() => {
            createWhatsAppConnection(connectionId);
          }, 5000);
        } else {
          // Remover conexão
          activeConnections.delete(connectionId);
        }
      } else if (connection === 'open') {
        console.log(`✅ WhatsApp conectado para ${connectionId}`);
        const conn = activeConnections.get(connectionId);
        if (conn) {
          conn.isConnected = true;
          conn.qrCode = null; // Limpar QR Code após conectar
          conn.updatedAt = new Date();
          
          // Obter informações do WhatsApp
          const phoneNumber = sock.user?.id?.split(':')[0];
          if (phoneNumber) {
            conn.phoneNumber = phoneNumber;
            conn.whatsappInfo = {
              name: sock.user?.name || 'Usuário WhatsApp',
              phone: phoneNumber,
              whatsappId: sock.user?.id,
              jid: sock.user?.id,
              profilePicture: null,
              connectedAt: new Date().toISOString()
            };
          }
        }
      }
    });
    
    // Evento de credenciais salvas
    sock.ev.on('creds.update', saveCreds);
    
    // Evento de status de mensagem (entregue, lida, etc.)
    sock.ev.on('messages.update', (updates) => {
      console.log('📊 Atualização de status de mensagem:', updates);
      
      for (const update of updates) {
        const messageId = update.key.id;
        const status = update.update.status;
        
        // Emitir status via Socket.IO
        io.emit('message.status', {
          messageId,
          status: status === 'read' ? 'read' : 
                 status === 'delivered' ? 'delivered' : 
                 status === 'sent' ? 'sent' : 'failed'
        });
      }
    });
    
    // Evento de mensagens
    sock.ev.on('messages.upsert', async (m) => {
      console.log(`📨 Nova mensagem recebida em ${connectionId}:`, m.messages.length);
      
      // Usar o connectionId real da conexão
      const storageConnectionId = connectionId;
      
      for (const msg of m.messages) {
        // Processar tanto mensagens recebidas quanto enviadas
        const conversationId = msg.key.remoteJid;
        const messageId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const isFromMe = msg.key.fromMe;
        
        // Detectar tipo de mensagem e extrair conteúdo
        let messageType = 'text';
        let messageBody = '';
        let mediaUrl = '';
        let mediaMimetype = '';
        let caption = '';

        if (msg.message?.conversation) {
          messageType = 'text';
          messageBody = msg.message.conversation;
        } else if (msg.message?.imageMessage) {
          messageType = 'image';
          messageBody = msg.message.imageMessage.caption || 'Imagem';
          mediaUrl = msg.message.imageMessage.url;
          mediaMimetype = msg.message.imageMessage.mimetype;
          caption = msg.message.imageMessage.caption;
        } else if (msg.message?.videoMessage) {
          messageType = 'video';
          messageBody = msg.message.videoMessage.caption || 'Vídeo';
          mediaUrl = msg.message.videoMessage.url;
          mediaMimetype = msg.message.videoMessage.mimetype;
          caption = msg.message.videoMessage.caption;
        } else if (msg.message?.audioMessage) {
          messageType = 'audio';
          messageBody = 'Áudio';
          mediaUrl = msg.message.audioMessage.url;
          mediaMimetype = msg.message.audioMessage.mimetype;
        } else if (msg.message?.documentMessage) {
          messageType = 'document';
          messageBody = msg.message.documentMessage.caption || msg.message.documentMessage.fileName || 'Documento';
          mediaUrl = msg.message.documentMessage.url;
          mediaMimetype = msg.message.documentMessage.mimetype;
          caption = msg.message.documentMessage.caption;
        } else if (msg.message?.extendedTextMessage) {
          messageType = 'text';
          messageBody = msg.message.extendedTextMessage.text || '';
        } else if (msg.message?.stickerMessage) {
          messageType = 'sticker';
          messageBody = 'Sticker';
          mediaUrl = msg.message.stickerMessage.url;
          mediaMimetype = msg.message.stickerMessage.mimetype;
        } else {
          // Fallback para outros tipos de mensagem
          messageType = 'text';
          messageBody = 'Mensagem';
        }

        // Criar objeto de mensagem
        const message = {
          id: messageId,
          waMsgId: msg.key.id,
          conversationId,
          direction: isFromMe ? 'out' : 'in',
          type: messageType,
          body: messageBody,
          mediaUrl: mediaUrl,
          mediaMimetype: mediaMimetype,
          caption: caption,
          createdAt: new Date(msg.messageTimestamp * 1000).toISOString(),
          status: isFromMe ? 'sent' : 'delivered'
        };

        console.log(`💾 Armazenando mensagem em ${storageConnectionId}:`, {
          id: message.id,
          direction: message.direction,
          body: message.body,
          conversationId: message.conversationId
        });

        // Armazenar mensagem sempre em connection_1
        if (!messages.has(storageConnectionId)) {
          messages.set(storageConnectionId, new Map());
        }
        if (!messages.get(storageConnectionId).has(conversationId)) {
          messages.get(storageConnectionId).set(conversationId, []);
        }
        messages.get(storageConnectionId).get(conversationId).push(message);

        // Atualizar conversa sempre em connection_1
        if (!conversations.has(storageConnectionId)) {
          conversations.set(storageConnectionId, new Map());
        }
        
        const existingConv = conversations.get(storageConnectionId).get(conversationId);
        if (existingConv) {
          existingConv.lastMessage = {
            preview: message.body || 'Mídia',
            createdAt: message.createdAt
          };
          // Só incrementar unread para mensagens recebidas
          if (!isFromMe) {
            existingConv.unread = (existingConv.unread || 0) + 1;
          }
        } else {
          // Criar nova conversa
          const contactName = msg.pushName || conversationId.split('@')[0];
          conversations.get(storageConnectionId).set(conversationId, {
            id: conversationId,
            contact: {
              id: conversationId,
              name: contactName,
              jid: conversationId,
              phoneE164: conversationId.split('@')[0]
            },
            lastMessage: {
              preview: message.body || 'Mídia',
              createdAt: message.createdAt
            },
            unread: isFromMe ? 0 : 1,
            timestamp: message.createdAt
          });
        }

        // Emitir mensagem via Socket.IO
        io.emit('message.new', message);
        console.log(`📡 Mensagem emitida via Socket.IO:`, message.id);
      }
    });
    
    return connection;
    
  } catch (error) {
    console.error('Erro ao criar conexão WhatsApp:', error);
    throw error;
  }
}

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp Baileys Server funcionando!',
    timestamp: new Date().toISOString(),
    activeConnections: activeConnections.size
  });
});

// Rota para listar conexões
app.get('/api/baileys-simple/connections', (req, res) => {
  const connections = Array.from(activeConnections.values()).map(conn => ({
    id: conn.id,
    name: `Conexão ${conn.id}`,
    connectionState: conn.isConnected ? 'connected' : 'connecting',
    isConnected: conn.isConnected,
    phoneNumber: conn.phoneNumber,
    whatsappInfo: conn.whatsappInfo,
    createdAt: conn.createdAt.toISOString(),
    updatedAt: conn.updatedAt.toISOString(),
    lastConnectedAt: conn.isConnected ? conn.updatedAt.toISOString() : null
  }));
  
  res.json({
    success: true,
    data: connections
  });
});

// Rota para criar conexão
app.post('/api/baileys-simple/connections', async (req, res) => {
  try {
    const { connectionId, name } = req.body;
    // Usar connectionId fixo para testes
    const id = connectionId || 'connection_1';
    
    console.log(`🔗 Criando/verificando conexão: ${id}`);
    
    // Verificar se já existe
    if (activeConnections.has(id)) {
      console.log(`✅ Conexão ${id} já existe`);
      return res.json({
        success: true,
        data: {
          id: id,
          name: name || `Conexão ${id}`,
          connectionState: activeConnections.get(id).isConnected ? 'connected' : 'connecting',
          isConnected: activeConnections.get(id).isConnected,
          phoneNumber: activeConnections.get(id).phoneNumber,
          whatsappInfo: activeConnections.get(id).whatsappInfo,
          createdAt: activeConnections.get(id).createdAt.toISOString(),
          updatedAt: activeConnections.get(id).updatedAt.toISOString()
        }
      });
    }
    
    // Criar nova conexão
    console.log(`🆕 Criando nova conexão: ${id}`);
    await createWhatsAppConnection(id);
    
    res.json({
      success: true,
      data: {
        id: id,
        name: name || `Conexão ${id}`,
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
    res.status(500).json({
      success: false,
      error: 'Erro ao criar conexão WhatsApp'
    });
  }
});

// Rota para obter QR Code
app.get('/api/baileys-simple/connections/:connectionId/qr', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    if (connection.isConnected) {
      return res.json({
        success: true,
        data: {
          qrCode: null,
          message: 'Conexão já estabelecida',
          connectionId: connectionId,
          isConnected: true
        }
      });
    }
    
    if (!connection.qrCode) {
      return res.json({
        success: true,
        data: {
          qrCode: null,
          message: 'Aguardando QR Code...',
          connectionId: connectionId,
          isConnected: false
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        qrCode: connection.qrCode,
        connectionId: connectionId,
        isConnected: false,
        message: 'QR Code gerado! Escaneie com o WhatsApp.'
      }
    });
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para obter informações da conexão
app.get('/api/baileys-simple/connections/:connectionId', (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: connection.id,
        name: `Conexão ${connection.id}`,
        connectionState: connection.isConnected ? 'connected' : 'connecting',
        isConnected: connection.isConnected,
        phoneNumber: connection.phoneNumber,
        whatsappInfo: connection.whatsappInfo,
        createdAt: connection.createdAt.toISOString(),
        updatedAt: connection.updatedAt.toISOString(),
        lastConnectedAt: connection.isConnected ? connection.updatedAt.toISOString() : null
      }
    });
  } catch (error) {
    console.error('Erro ao obter informações da conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para obter conversas
app.get('/api/baileys-simple/connections/:connectionId/chats', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    if (!connection.isConnected || !connection.socket) {
      // Retornar conversas mock para teste quando não conectado
      const mockChats = [
        {
          id: '2147483647@s.whatsapp.net',
          contact: {
            id: '2147483647@s.whatsapp.net',
            name: 'Mr.Guibbs | Sociedade Avançada',
            phoneE164: '2147483647',
            jid: '2147483647@s.whatsapp.net',
            customFields: {
              GPT_THREAD: 'thread_FrJkCutclxvhZdsXDyuGOHdz',
              QUIPPSORT_ENTRADA: 'Valor de entrada personalizado',
              COMPANY: 'Sociedade Avançada',
              POSITION: 'Gerente'
            }
          },
          lastMessage: {
            preview: 'E onde fica o consultório?',
            timestamp: Date.now() - 1000 * 60 * 30
          },
          unread: 2,
          timestamp: Date.now() - 1000 * 60 * 30
        },
        {
          id: '2147483647@s.whatsapp.net',
          contact: {
            id: '2147483647@s.whatsapp.net',
            name: 'Maria Santos | Empresa ABC',
            phoneE164: '2147483647',
            jid: '2147483647@s.whatsapp.net',
            customFields: {
              GPT_THREAD: 'thread_Maria123',
              QUIPPSORT_ENTRADA: 'Lead qualificado',
              COMPANY: 'Empresa ABC',
              POSITION: 'Diretora'
            }
          },
          lastMessage: {
            preview: 'Obrigado pelo atendimento!',
            timestamp: Date.now() - 1000 * 60 * 15
          },
          unread: 0,
          timestamp: Date.now() - 1000 * 60 * 15
        },
        {
          id: '2147483647@s.whatsapp.net',
          contact: {
            id: '2147483647@s.whatsapp.net',
            name: 'Carlos Oliveira | Tech Solutions',
            phoneE164: '2147483647',
            jid: '2147483647@s.whatsapp.net',
            customFields: {
              GPT_THREAD: 'thread_Carlos456',
              QUIPPSORT_ENTRADA: 'Interesse em produto',
              COMPANY: 'Tech Solutions',
              POSITION: 'CTO'
            }
          },
          lastMessage: {
            preview: 'Preciso de mais informações sobre o produto',
            timestamp: Date.now() - 1000 * 60 * 5
          },
          unread: 1,
          timestamp: Date.now() - 1000 * 60 * 5
        }
      ];
      
      return res.json({
        success: true,
        data: mockChats
      });
    }
    
    try {
      // Obter conversas do Baileys usando a API correta
      const chats = await connection.socket.getChats();
      console.log(`📋 Encontradas ${chats.length} conversas para ${connectionId}`);
      
      // Converter para formato esperado pelo frontend
      const formattedChats = chats.map(chat => {
        const lastMessage = chat.messages?.all()?.[0];
        const messageText = lastMessage?.message?.conversation || 
                           lastMessage?.message?.extendedTextMessage?.text || 
                           lastMessage?.message?.imageMessage?.caption ||
                           lastMessage?.message?.videoMessage?.caption ||
                           'Mensagem de mídia';
        
        return {
          id: chat.id,
          contact: {
            id: chat.id,
            name: chat.name || chat.id.split('@')[0],
            phoneE164: chat.id.split('@')[0],
            jid: chat.id
          },
          lastMessage: {
            preview: messageText,
            timestamp: lastMessage?.messageTimestamp ? lastMessage.messageTimestamp * 1000 : Date.now()
          },
          unread: chat.unreadCount || 0,
          timestamp: lastMessage?.messageTimestamp ? lastMessage.messageTimestamp * 1000 : Date.now()
        };
      });
      
      console.log(`✅ Formatadas ${formattedChats.length} conversas`);
      
      res.json({
        success: true,
        data: formattedChats
      });
    } catch (chatError) {
      console.error('Erro ao obter conversas do Baileys:', chatError);
      
      // Retornar conversas mock para teste
      const mockChats = [
        {
          id: '2147483647@s.whatsapp.net',
          contact: {
            id: '2147483647@s.whatsapp.net',
            name: 'João Silva',
            phoneE164: '2147483647',
            jid: '2147483647@s.whatsapp.net'
          },
          lastMessage: {
            preview: 'Olá! Como posso ajudar?',
            timestamp: Date.now() - 1000 * 60 * 30
          },
          unread: 2,
          timestamp: Date.now() - 1000 * 60 * 30
        },
        {
          id: '2147483647@s.whatsapp.net',
          contact: {
            id: '2147483647@s.whatsapp.net',
            name: 'Maria Santos',
            phoneE164: '2147483647',
            jid: '2147483647@s.whatsapp.net'
          },
          lastMessage: {
            preview: 'Obrigado pelo atendimento!',
            timestamp: Date.now() - 1000 * 60 * 15
          },
          unread: 0,
          timestamp: Date.now() - 1000 * 60 * 15
        }
      ];
      
      res.json({
        success: true,
        data: mockChats
      });
    }
  } catch (error) {
    console.error('Erro ao obter conversas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para obter mensagens de uma conversa
app.get('/api/baileys-simple/connections/:connectionId/chats/:chatId/messages', async (req, res) => {
  try {
    const { connectionId, chatId } = req.params;
    const { limit = 50 } = req.query;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    if (!connection.isConnected || !connection.socket) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Obter mensagens do chat
    const messages = await connection.socket.getMessages(chatId, {
      limit: parseInt(limit)
    });
    
    // Converter para formato esperado pelo frontend
    const formattedMessages = messages.map(msg => ({
      id: msg.key.id,
      body: msg.message?.conversation || 
            msg.message?.extendedTextMessage?.text || 
            'Mídia',
      type: msg.message?.conversation ? 'text' : 'media',
      direction: msg.key.fromMe ? 'out' : 'in',
      timestamp: msg.messageTimestamp * 1000, // Converter para milissegundos
      status: msg.status || 'sent',
      from: msg.key.remoteJid,
      to: msg.key.participant || msg.key.remoteJid
    }));
    
    res.json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    console.error('Erro ao obter mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para enviar mensagem
app.post('/api/baileys-simple/connections/:connectionId/chats/:chatId/messages', async (req, res) => {
  try {
    const { connectionId, chatId } = req.params;
    const { content } = req.body;
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Conexão não encontrada'
      });
    }
    
    if (!connection.isConnected || !connection.socket) {
      return res.status(400).json({
        success: false,
        error: 'Conexão não está ativa'
      });
    }
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo da mensagem é obrigatório'
      });
    }
    
    // Enviar mensagem via Baileys
    const message = await connection.socket.sendMessage(chatId, {
      text: content
    });
    
    res.json({
      success: true,
      data: {
        id: message.key.id,
        body: content,
        type: 'text',
        direction: 'out',
        timestamp: Date.now(),
        status: 'sent',
        from: connection.socket.user?.id,
        to: chatId
      }
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para deletar conexão
app.delete('/api/baileys-simple/connections/:connectionId', (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = activeConnections.get(connectionId);
    
    if (connection) {
      // Fechar socket se existir
      if (connection.socket) {
        connection.socket.end();
      }
      
      // Remover conexão
      activeConnections.delete(connectionId);
      
      // Limpar dados de autenticação
      const authDir = path.join(__dirname, 'auth_info', connectionId);
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
    }
    
    res.json({
      success: true,
      message: 'Conexão desconectada com sucesso, você agora pode criar uma nova conexão ✅'
    });
  } catch (error) {
    console.error('Erro ao deletar conexão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Novos endpoints seguindo o padrão correto

// Listar conversas (novo padrão)
app.get('/api/conversations', (req, res) => {
  const { connectionId, cursor, limit = 25 } = req.query;
  
  if (!connectionId) {
    return res.status(400).json({
      success: false,
      error: 'connectionId é obrigatório'
    });
  }
  
  const connection = activeConnections.get(connectionId);
  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Conexão não encontrada'
    });
  }
  
  // Usar o connectionId fornecido
  const storageConnectionId = connectionId;
  const connectionConversations = conversations.get(storageConnectionId);
  if (!connectionConversations) {
    return res.json({
      success: true,
      items: [],
      nextCursor: null
    });
  }
  
  // Converter Map para array e ordenar por timestamp
  const items = Array.from(connectionConversations.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, parseInt(limit));
  
  res.json({
    success: true,
    items,
    nextCursor: null
  });
});

// Obter mensagens de uma conversa (novo padrão)
app.get('/api/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;
  const { connectionId, cursor, limit = 40 } = req.query;
  
  console.log(`📋 Buscando mensagens para conversa ${conversationId} na conexão ${connectionId}`);
  
  if (!connectionId) {
    return res.status(400).json({
      success: false,
      error: 'connectionId é obrigatório'
    });
  }
  
  const connection = activeConnections.get(connectionId);
  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Conexão não encontrada'
    });
  }
  
  // Usar o connectionId fornecido
  const storageConnectionId = connectionId;
  const connectionMessages = messages.get(storageConnectionId);
  if (!connectionMessages || !connectionMessages.has(conversationId)) {
    console.log(`❌ Nenhuma mensagem encontrada para conversa ${conversationId}`);
    
    // Se não há mensagens armazenadas, criar algumas mensagens de teste
    if (!connectionMessages) {
      messages.set(storageConnectionId, new Map());
    }
    
    // Criar mensagens de teste para demonstração
    const testMessages = [
      {
        id: `test_${Date.now()}_1`,
        waMsgId: `wa_${Date.now()}_1`,
        conversationId,
        direction: 'in',
        type: 'text',
        body: 'Olá! Como posso ajudar você hoje?',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
        status: 'delivered'
      },
      {
        id: `test_${Date.now()}_2`,
        waMsgId: `wa_${Date.now()}_2`,
        conversationId,
        direction: 'out',
        type: 'text',
        body: 'Oi! Tudo bem, obrigado por entrar em contato!',
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 min atrás
        status: 'sent'
      },
      {
        id: `test_${Date.now()}_3`,
        waMsgId: `wa_${Date.now()}_3`,
        conversationId,
        direction: 'in',
        type: 'text',
        body: 'Preciso de mais informações sobre o produto',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min atrás
        status: 'delivered'
      },
      {
        id: `test_${Date.now()}_4`,
        waMsgId: `wa_${Date.now()}_4`,
        conversationId,
        direction: 'out',
        type: 'text',
        body: 'Claro! Qual produto você tem interesse?',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min atrás
        status: 'sent'
      },
      {
        id: `test_${Date.now()}_5`,
        waMsgId: `wa_${Date.now()}_5`,
        conversationId,
        direction: 'in',
        type: 'text',
        body: 'Obrigado pelo atendimento!',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min atrás
        status: 'delivered'
      }
    ];
    
    messages.get(storageConnectionId).set(conversationId, testMessages);
    console.log(`📝 Criadas ${testMessages.length} mensagens de teste para conversa ${conversationId}`);
    
    // Ordenar mensagens de teste por data (mais recentes primeiro)
    const sortedTestMessages = testMessages
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Implementar paginação com cursor para mensagens de teste
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = sortedTestMessages.findIndex(msg => msg.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const items = sortedTestMessages
      .slice(startIndex, startIndex + parseInt(limit));

    const hasMore = (startIndex + parseInt(limit)) < sortedTestMessages.length;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    console.log(`📤 Retornando ${items.length} mensagens de teste (cursor: ${cursor}, hasMore: ${hasMore})`);

    return res.json({
      success: true,
      items,
      nextCursor
    });
  }
  
  const conversationMessages = connectionMessages.get(conversationId);
  console.log(`📨 Encontradas ${conversationMessages.length} mensagens para conversa ${conversationId}`);
  
  // Ordenar mensagens por data (mais recentes primeiro)
  const sortedMessages = conversationMessages
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Implementar paginação com cursor
  let startIndex = 0;
  if (cursor) {
    // Encontrar o índice da mensagem com o cursor
    const cursorIndex = sortedMessages.findIndex(msg => msg.id === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1;
    }
  }

  const items = sortedMessages
    .slice(startIndex, startIndex + parseInt(limit));

  // Determinar se há mais mensagens
  const hasMore = (startIndex + parseInt(limit)) < sortedMessages.length;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

  console.log(`📤 Retornando ${items.length} mensagens (cursor: ${cursor}, hasMore: ${hasMore})`);

  res.json({
    success: true,
    items,
    nextCursor
  });
});

// Enviar mensagem (padrão WhatsApp Cloud API)
app.post('/api/messages/send', async (req, res) => {
  try {
    const { connectionId, conversationId, to, type, payload } = req.body;
    
    if (!connectionId || !conversationId || !to || !type || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: connectionId, conversationId, to, type, payload'
      });
    }
    
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.isConnected || !connection.socket) {
      return res.status(409).json({
        success: false,
        error: 'Conexão não conectada'
      });
    }
    
    // Preparar conteúdo para Baileys
    let content;
    if (type === 'text') {
      content = { text: payload.body };
    } else if (type === 'image') {
      content = { image: { url: payload.url }, caption: payload.caption };
    } else if (type === 'audio') {
      content = { audio: { url: payload.url }, mimetype: payload.mimetype || 'audio/ogg' };
    } else if (type === 'document') {
      content = { document: { url: payload.url }, fileName: payload.filename, mimetype: payload.mimetype };
    } else if (type === 'video') {
      content = { video: { url: payload.url }, caption: payload.caption };
    } else {
      return res.status(400).json({
        success: false,
        error: 'Tipo de mensagem não suportado'
      });
    }
    
    // Enviar via Baileys
    const result = await connection.socket.sendMessage(to, content);
    
    // Criar mensagem para armazenamento
    const messageId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = {
      id: messageId,
      waMsgId: result.key.id,
      conversationId,
      direction: 'out',
      type,
      body: payload.body || '',
      mediaUrl: payload.url,
      mediaMimetype: payload.mimetype,
      caption: payload.caption,
      createdAt: new Date().toISOString(),
      status: 'queued'
    };
    
    // Armazenar mensagem no connectionId da conexão
    const storageConnectionId = connectionId;
    if (!messages.has(storageConnectionId)) {
      messages.set(storageConnectionId, new Map());
    }
    if (!messages.get(storageConnectionId).has(conversationId)) {
      messages.get(storageConnectionId).set(conversationId, []);
    }
    messages.get(storageConnectionId).get(conversationId).push(message);
    
    // Emitir mensagem via Socket.IO
    io.emit('message.new', message);
    
    // Resposta no formato WhatsApp Cloud API
    res.json({
      messaging_product: "whatsapp",
      contacts: [{
        input: to,
        wa_id: to.split('@')[0]
      }],
      messages: [{
        id: messageId,
        message_status: "accepted"
      }]
    });
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem'
    });
  }
});

// Marcar mensagens como lidas
app.post('/api/messages/read', async (req, res) => {
  try {
    const { conversationId, messageIds } = req.body;
    const { connectionId } = req.query;
    
    if (!connectionId || !conversationId || !messageIds) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: connectionId, conversationId, messageIds'
      });
    }
    
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.isConnected || !connection.socket) {
      return res.status(409).json({
        success: false,
        error: 'Conexão não conectada'
      });
    }
    
    // Marcar como lidas no Baileys
    await connection.socket.readMessages([{ id: messageIds[0], remoteJid: conversationId }]);
    
    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas'
    });
    
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar mensagens como lidas'
    });
  }
});

// Indicador de digitação
app.post('/api/messages/typing', async (req, res) => {
  try {
    const { conversationId, state } = req.body;
    const { connectionId } = req.query;
    
    if (!connectionId || !conversationId || !state) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: connectionId, conversationId, state'
      });
    }
    
    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.isConnected || !connection.socket) {
      return res.status(409).json({
        success: false,
        error: 'Conexão não conectada'
      });
    }
    
    // Enviar presença de digitação
    await connection.socket.sendPresenceUpdate(state, conversationId);
    
    res.json({
      success: true,
      message: 'Indicador de digitação enviado'
    });
    
  } catch (error) {
    console.error('Erro ao enviar indicador de digitação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar indicador de digitação'
    });
  }
});

// Webhook para receber mensagens (padrão WhatsApp Cloud API)
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Verificar token de verificação
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
  try {
    const body = req.body;
    console.log('📨 Webhook recebido:', JSON.stringify(body, null, 2));
    
    // Verificar se é uma mensagem do WhatsApp
    if (body.object === 'whatsapp_business_account') {
      body.entry.forEach(entry => {
        entry.changes.forEach(change => {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            const metadata = change.value.metadata;
            
            if (messages) {
              messages.forEach(message => {
                // Processar mensagem recebida
                processIncomingMessage(message, metadata);
              });
            }
          }
        });
      });
    }
    
    // Responder com 200 OK para confirmar recebimento
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Função para processar mensagem recebida
function processIncomingMessage(message, metadata) {
  console.log('📨 Processando mensagem recebida:', message);
  
  // Encontrar conexão ativa (assumindo primeira conexão por enquanto)
  const connectionId = Array.from(activeConnections.keys())[0];
  if (!connectionId) {
    console.log('❌ Nenhuma conexão ativa encontrada');
    return;
  }
  
  const conversationId = `${message.from}@s.whatsapp.net`;
  const messageId = `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Criar objeto de mensagem
  const messageObj = {
    id: messageId,
    waMsgId: message.id,
    conversationId,
    direction: 'in',
    type: message.type || 'text',
    body: message.text?.body || message.image?.caption || message.video?.caption || message.document?.caption || '',
    mediaUrl: message.image?.id || message.video?.id || message.audio?.id || message.document?.id,
    mediaMimetype: message.image?.mime_type || message.video?.mime_type || message.audio?.mime_type || message.document?.mime_type,
    caption: message.image?.caption || message.video?.caption || message.document?.caption,
    createdAt: new Date(parseInt(message.timestamp) * 1000).toISOString(),
    status: 'delivered'
  };

  // Armazenar mensagem
  if (!messages.has(connectionId)) {
    messages.set(connectionId, new Map());
  }
  if (!messages.get(connectionId).has(conversationId)) {
    messages.get(connectionId).set(conversationId, []);
  }
  messages.get(connectionId).get(conversationId).push(messageObj);

  // Atualizar conversa
  if (!conversations.has(connectionId)) {
    conversations.set(connectionId, new Map());
  }
  
  const existingConv = conversations.get(connectionId).get(conversationId);
  if (existingConv) {
    existingConv.lastMessage = {
      preview: messageObj.body || 'Mídia',
      createdAt: messageObj.createdAt
    };
    existingConv.unread = (existingConv.unread || 0) + 1;
  } else {
    // Criar nova conversa
    conversations.get(connectionId).set(conversationId, {
      id: conversationId,
      contact: {
        id: conversationId,
        name: message.from,
        jid: conversationId,
        phoneE164: message.from
      },
      lastMessage: {
        preview: messageObj.body || 'Mídia',
        createdAt: messageObj.createdAt
      },
      unread: 1,
      timestamp: messageObj.createdAt
    });
  }

  // Emitir mensagem via Socket.IO
  io.emit('message.new', messageObj);
  console.log('✅ Mensagem processada e emitida via Socket.IO');
}

// Socket.IO para tempo real
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado via Socket.IO');
  
  socket.on('join', (data) => {
    const { tenantId, connectionId, conversationId } = data;
    console.log(`👤 Cliente entrou na sala: ${connectionId}/${conversationId}`);
    socket.join(`${connectionId}-${conversationId}`);
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

// Limpeza ao encerrar
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  activeConnections.forEach((connection) => {
    if (connection.socket) {
      connection.socket.end();
    }
  });
  process.exit(0);
});
