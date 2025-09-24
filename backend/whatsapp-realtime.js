const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Armazenar conexões ativas por usuário
const activeConnections = new Map();

// Configurar Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Usuário se conecta
  socket.on('join', (data) => {
    const { userId } = data;
    
    if (userId) {
      socket.userId = userId;
      activeConnections.set(userId, socket);
      socket.join(`user_${userId}`);
      console.log(`👤 Usuário ${userId} conectado`);
      
      // Enviar status de conexão
      socket.emit('connected', {
        success: true,
        message: 'Conectado ao sistema de tempo real',
        userId
      });
    }
  });

  // Usuário entra em uma conversa
  socket.on('join_conversation', (data) => {
    const { chatId, userId } = data;
    
    if (chatId && userId) {
      socket.join(`conversation_${chatId}`);
      console.log(`💬 Usuário ${userId} entrou na conversa ${chatId}`);
      
      socket.emit('conversation_joined', {
        success: true,
        chatId,
        message: 'Entrou na conversa'
      });
    }
  });

  // Usuário sai de uma conversa
  socket.on('leave_conversation', (data) => {
    const { chatId } = data;
    
    if (chatId) {
      socket.leave(`conversation_${chatId}`);
      console.log(`💬 Usuário saiu da conversa ${chatId}`);
    }
  });

  // Enviar mensagem
  socket.on('send_message', async (data) => {
    try {
      const { chatId, userId, conteudo, tipo = 'TEXTO' } = data;
      
      if (!chatId || !userId || !conteudo) {
        socket.emit('message_error', {
          success: false,
          error: 'Dados obrigatórios não fornecidos'
        });
        return;
      }

      // Buscar atendimento_id para este chat
      const { data: atendimento, error: atendimentoError } = await supabase
        .from('whatsapp_atendimentos')
        .select('id')
        .eq('numero_cliente', chatId)
        .eq('owner_id', userId)
        .single();

      if (atendimentoError || !atendimento) {
        socket.emit('message_error', {
          success: false,
          error: 'Atendimento não encontrado'
        });
        return;
      }

      // Inserir mensagem
      const { data: message, error: messageError } = await supabase
        .from('whatsapp_mensagens')
        .insert({
          owner_id: userId,
          atendimento_id: atendimento.id,
          chat_id: chatId,
          conteudo,
          tipo,
          remetente: 'ATENDENTE',
          timestamp: new Date().toISOString(),
          lida: true
        })
        .select()
        .single();

      if (messageError) {
        console.error('Erro ao enviar mensagem:', messageError);
        socket.emit('message_error', {
          success: false,
          error: 'Erro ao enviar mensagem'
        });
        return;
      }

      // Atualizar última mensagem no atendimento
      await supabase
        .from('whatsapp_atendimentos')
        .update({ ultima_mensagem: new Date().toISOString() })
        .eq('id', atendimento.id);

      // Enviar mensagem para todos na conversa
      io.to(`conversation_${chatId}`).emit('new_message', {
        success: true,
        data: message
      });

      // Notificar atualização da lista de conversas
      io.to(`user_${userId}`).emit('conversation_updated', {
        chatId,
        lastMessage: {
          conteudo,
          tipo,
          remetente: 'ATENDENTE',
          timestamp: message.timestamp
        }
      });

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      socket.emit('message_error', {
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Marcar mensagens como lidas
  socket.on('mark_as_read', async (data) => {
    try {
      const { chatId, userId } = data;
      
      if (!chatId || !userId) {
        socket.emit('read_error', {
          success: false,
          error: 'Dados obrigatórios não fornecidos'
        });
        return;
      }

      const { error } = await supabase
        .from('whatsapp_mensagens')
        .update({ lida: true })
        .eq('chat_id', chatId)
        .eq('owner_id', userId)
        .eq('remetente', 'CLIENTE');

      if (error) {
        console.error('Erro ao marcar como lida:', error);
        socket.emit('read_error', {
          success: false,
          error: 'Erro ao marcar mensagens como lidas'
        });
        return;
      }

      // Notificar que as mensagens foram marcadas como lidas
      io.to(`conversation_${chatId}`).emit('messages_read', {
        success: true,
        chatId,
        userId
      });

    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      socket.emit('read_error', {
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
    
    if (socket.userId) {
      activeConnections.delete(socket.userId);
      console.log(`👤 Usuário ${socket.userId} desconectado`);
    }
  });
});

// Função para enviar nova mensagem do cliente (chamada pelo Baileys)
async function sendClientMessage(chatId, ownerId, messageData) {
  try {
    // Buscar atendimento_id para este chat
    const { data: atendimento, error: atendimentoError } = await supabase
      .from('whatsapp_atendimentos')
      .select('id')
      .eq('numero_cliente', chatId)
      .eq('owner_id', ownerId)
      .single();

    if (atendimentoError || !atendimento) {
      console.error('Atendimento não encontrado para chat:', chatId);
      return;
    }

    // Inserir mensagem
    const { data: message, error: messageError } = await supabase
      .from('whatsapp_mensagens')
      .insert({
        owner_id: ownerId,
        atendimento_id: atendimento.id,
        chat_id: chatId,
        conteudo: messageData.conteudo,
        tipo: messageData.tipo,
        remetente: 'CLIENTE',
        timestamp: messageData.timestamp || new Date().toISOString(),
        lida: false,
        media_url: messageData.media_url,
        media_mime: messageData.media_mime
      })
      .select()
      .single();

    if (messageError) {
      console.error('Erro ao salvar mensagem do cliente:', messageError);
      return;
    }

    // Atualizar última mensagem no atendimento
    await supabase
      .from('whatsapp_atendimentos')
      .update({ ultima_mensagem: new Date().toISOString() })
      .eq('id', atendimento.id);

    // Enviar para todos na conversa
    io.to(`conversation_${chatId}`).emit('new_message', {
      success: true,
      data: message
    });

    // Notificar atualização da lista de conversas
    io.to(`user_${ownerId}`).emit('conversation_updated', {
      chatId,
      lastMessage: {
        conteudo: messageData.conteudo,
        tipo: messageData.tipo,
        remetente: 'CLIENTE',
        timestamp: message.timestamp
      }
    });

    console.log(`📨 Nova mensagem do cliente enviada para conversa ${chatId}`);

  } catch (error) {
    console.error('Erro ao processar mensagem do cliente:', error);
  }
}

// Health check
app.get('/api/whatsapp-realtime/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'whatsapp-realtime',
    activeConnections: activeConnections.size
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 WhatsApp Realtime Service rodando na porta ${PORT}`);
  console.log(`📱 Socket.IO disponível para conexões em tempo real`);
  console.log(`🔌 Conexões ativas: ${activeConnections.size}`);
});

// Exportar função para uso externo
module.exports = {
  sendClientMessage,
  io
};
