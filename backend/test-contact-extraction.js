#!/usr/bin/env node

/**
 * Script para testar a extração completa de informações de contatos
 * Demonstra todas as possibilidades do Baileys e WhatsApp
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testContactExtraction() {
  console.log('🔍 Testando Extração Completa de Informações de Contatos\n');
  
  try {
    // 1. Verificar se o servidor está rodando
    console.log('1️⃣ Verificando servidor...');
    const healthResponse = await axios.get(`${API_BASE}/baileys-simple/health`);
    console.log('✅ Servidor ativo:', healthResponse.data.message);
    
    // 2. Listar conexões ativas
    console.log('\n2️⃣ Listando conexões ativas...');
    const connectionsResponse = await axios.get(`${API_BASE}/baileys-simple/connections`);
    const connections = connectionsResponse.data.data || [];
    
    if (connections.length === 0) {
      console.log('❌ Nenhuma conexão ativa encontrada');
      return;
    }
    
    const connection = connections[0];
    console.log('✅ Conexão encontrada:', {
      id: connection.id,
      name: connection.name,
      status: connection.connectionState,
      phone: connection.phoneNumber
    });
    
    // 3. Testar extração de informações para diferentes tipos de contatos
    console.log('\n3️⃣ Testando extração de informações...');
    
    // Exemplos de chatIds para testar
    const testChatIds = [
      '120363419668499111@g.us', // Grupo que vimos nos logs
      '554796643900@s.whatsapp.net', // Contato individual
      '559285880257@s.whatsapp.net' // Seu próprio número
    ];
    
    for (const chatId of testChatIds) {
      console.log(`\n🔍 Testando extração para: ${chatId}`);
      
      try {
        const extractResponse = await axios.post(`${API_BASE}/contact/extract-info`, {
          chatId: chatId,
          connectionId: connection.id
        });
        
        if (extractResponse.data.success) {
          const contactInfo = extractResponse.data.data;
          
          console.log('✅ Informações extraídas:');
          console.log('   📱 Nome:', contactInfo.name || 'N/A');
          console.log('   📞 Telefone:', contactInfo.phone || 'N/A');
          console.log('   👥 É grupo:', contactInfo.isGroup ? 'Sim' : 'Não');
          console.log('   🏢 É negócio:', contactInfo.isBusiness ? 'Sim' : 'Não');
          console.log('   ✅ Verificado:', contactInfo.isVerified ? 'Sim' : 'Não');
          console.log('   🖼️ Foto de perfil:', contactInfo.profilePicture ? 'Sim' : 'Não');
          console.log('   📝 Status:', contactInfo.status || 'N/A');
          console.log('   🟢 Online:', contactInfo.isOnline ? 'Sim' : 'Não');
          console.log('   🚫 Bloqueado:', contactInfo.isBlocked ? 'Sim' : 'Não');
          console.log('   🔇 Silenciado:', contactInfo.isMuted ? 'Sim' : 'Não');
          
          if (contactInfo.isGroup) {
            console.log('   👥 Participantes:', contactInfo.participants?.length || 0);
            console.log('   👑 Administradores:', contactInfo.groupAdmins?.length || 0);
            console.log('   📋 Assunto do grupo:', contactInfo.groupSubject || 'N/A');
          }
          
          if (contactInfo.isBusiness) {
            console.log('   🏢 Nome do negócio:', contactInfo.businessName || 'N/A');
            console.log('   📝 Descrição:', contactInfo.businessDescription || 'N/A');
            console.log('   🏷️ Categoria:', contactInfo.businessCategory || 'N/A');
            console.log('   📧 Email:', contactInfo.businessEmail || 'N/A');
            console.log('   🌐 Website:', contactInfo.businessWebsite || 'N/A');
          }
          
          console.log('   📊 Dados brutos disponíveis:', Object.keys(contactInfo.rawData).length, 'campos');
          
        } else {
          console.log('❌ Erro na extração:', extractResponse.data.message);
        }
        
      } catch (error) {
        console.log('❌ Erro ao extrair informações:', error.response?.data?.message || error.message);
      }
    }
    
    // 4. Demonstrar funcionalidades específicas
    console.log('\n4️⃣ Funcionalidades específicas disponíveis:');
    console.log('   🔍 Busca de perfil de negócio');
    console.log('   📱 Informações de contato do store');
    console.log('   👥 Metadados de grupo');
    console.log('   🖼️ Fotos de perfil');
    console.log('   📝 Status e presença');
    console.log('   ⚙️ Configurações de chat');
    console.log('   🚫 Status de bloqueio');
    console.log('   🔇 Status de silenciamento');
    console.log('   👑 Informações de administração de grupo');
    console.log('   📊 Dados brutos completos');
    
    console.log('\n✅ Teste de extração completo finalizado!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testContactExtraction();
