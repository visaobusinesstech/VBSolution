const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const app = express();
app.use(express.json());

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

// Endpoint para buscar conversas
app.get('/api/whatsapp/conversations', async (req, res) => {
  try {
    const { owner_id } = req.query;
    
    if (!owner_id) {
      return res.status(400).json({
        success: false,
        error: 'owner_id é obrigatório'
      });
    }

    // Buscar conversas únicas baseadas no chat_id
    const { data: conversations, error } = await supabase
      .from('whatsapp_mensagens')
      .select(`
        chat_id,
        owner_id,
        atendimento_id,
        conteudo,
        tipo,
        remetente,
        timestamp,
        lida,
        media_url,
        media_mime,
        whatsapp_atendimentos!inner(
          id,
          numero_cliente,
          nome_cliente,
          status,
          data_inicio,
          ultima_mensagem
        )
      `)
      .eq('owner_id', owner_id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Erro ao buscar conversas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar conversas'
      });
    }

    // Agrupar mensagens por chat_id
    const conversationsMap = new Map();
    
    conversations.forEach(msg => {
      const chatId = msg.chat_id;
      
      if (!conversationsMap.has(chatId)) {
        conversationsMap.set(chatId, {
          chat_id: chatId,
          owner_id: msg.owner_id,
          atendimento_id: msg.atendimento_id,
          numero_cliente: msg.whatsapp_atendimentos.numero_cliente,
          nome_cliente: msg.whatsapp_atendimentos.nome_cliente,
          status: msg.whatsapp_atendimentos.status,
          data_inicio: msg.whatsapp_atendimentos.data_inicio,
          ultima_mensagem: msg.whatsapp_atendimentos.ultima_mensagem,
          messages: [],
          unread_count: 0,
          last_message: null
        });
      }
      
      const conversation = conversationsMap.get(chatId);
      conversation.messages.push({
        id: msg.id,
        conteudo: msg.conteudo,
        tipo: msg.tipo,
        remetente: msg.remetente,
        timestamp: msg.timestamp,
        lida: msg.lida,
        media_url: msg.media_url,
        media_mime: msg.media_mime
      });
      
      if (!msg.lida && msg.remetente === 'CLIENTE') {
        conversation.unread_count++;
      }
      
      if (!conversation.last_message || new Date(msg.timestamp) > new Date(conversation.last_message.timestamp)) {
        conversation.last_message = {
          conteudo: msg.conteudo,
          tipo: msg.tipo,
          remetente: msg.remetente,
          timestamp: msg.timestamp,
          lida: msg.lida
        };
      }
    });

    // Converter para array e ordenar por última mensagem
    const conversationsList = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.last_message.timestamp) - new Date(a.last_message.timestamp));

    res.json({
      success: true,
      data: conversationsList,
      total: conversationsList.length
    });

  } catch (error) {
    console.error('Erro no endpoint de conversas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Endpoint para buscar mensagens de uma conversa específica
app.get('/api/whatsapp/conversations/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { owner_id, page = 1, limit = 50 } = req.query;
    
    if (!owner_id) {
      return res.status(400).json({
        success: false,
        error: 'owner_id é obrigatório'
      });
    }

    const offset = (page - 1) * limit;

    const { data: messages, error } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .eq('chat_id', chatId)
      .eq('owner_id', owner_id)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar mensagens'
      });
    }

    res.json({
      success: true,
      data: messages.reverse(), // Ordenar cronologicamente
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: messages.length
      }
    });

  } catch (error) {
    console.error('Erro no endpoint de mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Endpoint para marcar mensagens como lidas
app.put('/api/whatsapp/conversations/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { owner_id } = req.body;
    
    if (!owner_id) {
      return res.status(400).json({
        success: false,
        error: 'owner_id é obrigatório'
      });
    }

    const { error } = await supabase
      .from('whatsapp_mensagens')
      .update({ lida: true })
      .eq('chat_id', chatId)
      .eq('owner_id', owner_id)
      .eq('remetente', 'CLIENTE');

    if (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao marcar mensagens como lidas'
      });
    }

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas'
    });

  } catch (error) {
    console.error('Erro no endpoint de marcar como lida:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Endpoint para enviar mensagem
app.post('/api/whatsapp/conversations/:chatId/send', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { owner_id, conteudo, tipo = 'TEXTO' } = req.body;
    
    if (!owner_id || !conteudo) {
      return res.status(400).json({
        success: false,
        error: 'owner_id e conteudo são obrigatórios'
      });
    }

    // Buscar atendimento_id para este chat
    const { data: atendimento, error: atendimentoError } = await supabase
      .from('whatsapp_atendimentos')
      .select('id')
      .eq('numero_cliente', chatId)
      .eq('owner_id', owner_id)
      .single();

    if (atendimentoError || !atendimento) {
      return res.status(404).json({
        success: false,
        error: 'Atendimento não encontrado'
      });
    }

    // Inserir mensagem
    const { data: message, error: messageError } = await supabase
      .from('whatsapp_mensagens')
      .insert({
        owner_id,
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
      return res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem'
      });
    }

    // Atualizar última mensagem no atendimento
    await supabase
      .from('whatsapp_atendimentos')
      .update({ ultima_mensagem: new Date().toISOString() })
      .eq('id', atendimento.id);

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Erro no endpoint de enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Health check
app.get('/api/whatsapp/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'whatsapp-conversations-api'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Conversations API rodando na porta ${PORT}`);
  console.log(`📱 Endpoints disponíveis:`);
  console.log(`   GET  /api/whatsapp/conversations`);
  console.log(`   GET  /api/whatsapp/conversations/:chatId/messages`);
  console.log(`   PUT  /api/whatsapp/conversations/:chatId/read`);
  console.log(`   POST /api/whatsapp/conversations/:chatId/send`);
  console.log(`   GET  /api/whatsapp/health`);
});
