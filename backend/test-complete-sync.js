#!/usr/bin/env node

/**
 * Script para testar a sincronização completa de contatos
 * Demonstra todas as funcionalidades implementadas
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testCompleteSync() {
  console.log('🔄 Testando Sincronização Completa de Contatos\n');
  
  try {
    // 1. Verificar servidor
    console.log('1️⃣ Verificando servidor...');
    const healthResponse = await axios.get(`${API_BASE}/baileys-simple/health`);
    console.log('✅ Servidor ativo');
    
    // 2. Listar conexões
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
    
    // 3. Testar busca de todos os grupos participantes
    console.log('\n3️⃣ Testando busca de todos os grupos participantes...');
    try {
      const groupsResponse = await axios.get(`${API_BASE}/groups/all-participating?connectionId=${connection.id}`);
      const groups = groupsResponse.data.data || {};
      
      console.log('✅ Grupos participantes encontrados:', Object.keys(groups).length);
      
      // Mostrar alguns grupos como exemplo
      const groupIds = Object.keys(groups).slice(0, 3);
      for (const groupId of groupIds) {
        const groupData = groups[groupId];
        console.log(`   📱 ${groupId}:`);
        console.log(`      Nome: ${groupData.subject || 'Sem nome'}`);
        console.log(`      Participantes: ${groupData.participants?.length || 0}`);
        console.log(`      Criado: ${groupData.creation ? new Date(groupData.creation * 1000).toISOString() : 'N/A'}`);
      }
      
    } catch (error) {
      console.log('❌ Erro ao buscar grupos:', error.response?.data?.message || error.message);
    }
    
    // 4. Testar sincronização completa
    console.log('\n4️⃣ Testando sincronização completa de contatos...');
    try {
      const syncResponse = await axios.post(`${API_BASE}/contact/sync-all`, {
        connectionId: connection.id,
        ownerId: connection.owner_id
      });
      
      if (syncResponse.data.success) {
        const data = syncResponse.data.data;
        console.log('✅ Sincronização completa realizada:');
        console.log(`   📊 Total de contatos processados: ${data.totalContacts}`);
        console.log(`   💾 Contatos salvos na tabela contacts: ${data.contactsSaved}`);
        console.log(`   📝 Mensagens salvas na tabela whatsapp_mensagens: ${data.messagesSaved}`);
        console.log(`   ❌ Erros encontrados: ${data.errors}`);
        
        if (data.errorDetails && data.errorDetails.length > 0) {
          console.log('   📋 Detalhes dos erros:');
          data.errorDetails.slice(0, 5).forEach((error, index) => {
            console.log(`      ${index + 1}. ${error}`);
          });
          if (data.errorDetails.length > 5) {
            console.log(`      ... e mais ${data.errorDetails.length - 5} erros`);
          }
        }
      } else {
        console.log('❌ Erro na sincronização:', syncResponse.data.message);
      }
      
    } catch (error) {
      console.log('❌ Erro ao sincronizar contatos:', error.response?.data?.message || error.message);
    }
    
    // 5. Testar extração individual de alguns contatos
    console.log('\n5️⃣ Testando extração individual de contatos...');
    const testChatIds = [
      '120363419668499111@g.us', // Grupo
      '554796643900@s.whatsapp.net', // Contato individual
    ];
    
    for (const chatId of testChatIds) {
      try {
        const extractResponse = await axios.post(`${API_BASE}/contact/extract-info`, {
          chatId: chatId,
          connectionId: connection.id
        });
        
        if (extractResponse.data.success) {
          const contactInfo = extractResponse.data.data;
          console.log(`✅ ${chatId}:`);
          console.log(`   Nome: ${contactInfo.name || 'N/A'}`);
          console.log(`   É grupo: ${contactInfo.isGroup ? 'Sim' : 'Não'}`);
          console.log(`   É negócio: ${contactInfo.isBusiness ? 'Sim' : 'Não'}`);
          console.log(`   Foto de perfil: ${contactInfo.profilePicture ? 'Sim' : 'Não'}`);
          if (contactInfo.isGroup) {
            console.log(`   Participantes: ${contactInfo.participants?.length || 0}`);
            console.log(`   Assunto: ${contactInfo.groupSubject || 'N/A'}`);
          }
        }
      } catch (error) {
        console.log(`❌ Erro ao extrair ${chatId}:`, error.response?.data?.message || error.message);
      }
    }
    
    // 6. Resumo das funcionalidades implementadas
    console.log('\n6️⃣ Funcionalidades implementadas:');
    console.log('   🔍 groupFetchAllParticipating() - Busca todos os grupos participantes');
    console.log('   📱 Extração completa de informações de contatos');
    console.log('   💾 Salvamento na tabela contacts com dados completos');
    console.log('   📝 Salvamento na tabela whatsapp_mensagens com metadados');
    console.log('   🔄 Sincronização em massa de todos os contatos');
    console.log('   🏢 Informações de perfil de negócio');
    console.log('   👥 Metadados completos de grupos');
    console.log('   🖼️ Fotos de perfil');
    console.log('   📊 Dados brutos completos');
    
    console.log('\n✅ Teste de sincronização completa finalizado!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testCompleteSync();
