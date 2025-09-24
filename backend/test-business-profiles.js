#!/usr/bin/env node

/**
 * Script para testar perfis de negócio específicos
 * Testa getBusinessProfile() e extração completa de informações
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testBusinessProfiles() {
  console.log('🏢 Testando Perfis de Negócio e Informações de Contatos\n');
  
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
    
    // 3. Testar perfis de negócio específicos
    console.log('\n3️⃣ Testando perfis de negócio específicos...');
    
    // Lista de contatos para testar (incluindo alguns números conhecidos)
    const testChatIds = [
      '554796643900@s.whatsapp.net', // Número conhecido
      '559285880257@s.whatsapp.net', // Seu próprio número
      '5511999999999@s.whatsapp.net', // Número de teste
      '120363419668499111@g.us', // Grupo
    ];
    
    try {
      const businessTestResponse = await axios.post(`${API_BASE}/contact/test-business-profiles`, {
        connectionId: connection.id,
        chatIds: testChatIds
      });
      
      if (businessTestResponse.data.success) {
        const results = businessTestResponse.data.data;
        
        console.log('✅ Resultados dos testes de perfil de negócio:');
        console.log(`   📊 Total testado: ${results.length} contatos\n`);
        
        results.forEach((result, index) => {
          console.log(`${index + 1}. ${result.chatId}:`);
          
          if (result.error) {
            console.log(`   ❌ Erro: ${result.error}`);
          } else {
            // Perfil direto
            if (result.directProfile) {
              console.log('   🏢 Perfil direto encontrado:');
              console.log(`      Nome: ${result.directProfile.business_name || 'N/A'}`);
              console.log(`      Descrição: ${result.directProfile.description || 'N/A'}`);
              console.log(`      Categoria: ${result.directProfile.category || 'N/A'}`);
              console.log(`      Email: ${result.directProfile.email || 'N/A'}`);
              console.log(`      Website: ${result.directProfile.website || 'N/A'}`);
              console.log(`      Verificado: ${result.directProfile.verified ? 'Sim' : 'Não'}`);
            } else {
              console.log('   ℹ️ Perfil direto não disponível');
            }
            
            // Informações extraídas
            if (result.extractedInfo) {
              console.log('   🔍 Informações extraídas:');
              console.log(`      É negócio: ${result.extractedInfo.isBusiness ? 'Sim' : 'Não'}`);
              console.log(`      Nome: ${result.extractedInfo.name || 'N/A'}`);
              console.log(`      Nome do negócio: ${result.extractedInfo.businessName || 'N/A'}`);
              console.log(`      Descrição: ${result.extractedInfo.businessDescription || 'N/A'}`);
              console.log(`      Categoria: ${result.extractedInfo.businessCategory || 'N/A'}`);
              console.log(`      Email: ${result.extractedInfo.businessEmail || 'N/A'}`);
              console.log(`      Website: ${result.extractedInfo.businessWebsite || 'N/A'}`);
              console.log(`      Verificado: ${result.extractedInfo.isVerified ? 'Sim' : 'Não'}`);
              console.log(`      Foto de perfil: ${result.extractedInfo.profilePicture ? 'Sim' : 'Não'}`);
            }
          }
          console.log(''); // Linha em branco
        });
        
      } else {
        console.log('❌ Erro no teste de perfis de negócio:', businessTestResponse.data.message);
      }
      
    } catch (error) {
      console.log('❌ Erro ao testar perfis de negócio:', error.response?.data?.message || error.message);
    }
    
    // 4. Testar extração individual com foco em perfis
    console.log('4️⃣ Testando extração individual com foco em perfis...');
    
    for (const chatId of testChatIds.slice(0, 2)) { // Testar apenas os primeiros 2
      try {
        console.log(`\n🔍 Testando extração individual para: ${chatId}`);
        
        const extractResponse = await axios.post(`${API_BASE}/contact/extract-info`, {
          chatId: chatId,
          connectionId: connection.id
        });
        
        if (extractResponse.data.success) {
          const contactInfo = extractResponse.data.data;
          
          console.log('✅ Informações extraídas:');
          console.log(`   📱 Nome: ${contactInfo.name || 'N/A'}`);
          console.log(`   📞 Telefone: ${contactInfo.phone || 'N/A'}`);
          console.log(`   👥 É grupo: ${contactInfo.isGroup ? 'Sim' : 'Não'}`);
          console.log(`   🏢 É negócio: ${contactInfo.isBusiness ? 'Sim' : 'Não'}`);
          console.log(`   ✅ Verificado: ${contactInfo.isVerified ? 'Sim' : 'Não'}`);
          console.log(`   🖼️ Foto de perfil: ${contactInfo.profilePicture ? 'Sim' : 'Não'}`);
          console.log(`   🟢 Online: ${contactInfo.isOnline ? 'Sim' : 'Não'}`);
          console.log(`   📝 Status: ${contactInfo.status || 'N/A'}`);
          console.log(`   🕒 Última vez visto: ${contactInfo.lastSeen || 'N/A'}`);
          
          if (contactInfo.isBusiness) {
            console.log('   🏢 Informações de negócio:');
            console.log(`      Nome: ${contactInfo.businessName || 'N/A'}`);
            console.log(`      Descrição: ${contactInfo.businessDescription || 'N/A'}`);
            console.log(`      Categoria: ${contactInfo.businessCategory || 'N/A'}`);
            console.log(`      Email: ${contactInfo.businessEmail || 'N/A'}`);
            console.log(`      Website: ${contactInfo.businessWebsite || 'N/A'}`);
            console.log(`      Endereço: ${contactInfo.businessAddress || 'N/A'}`);
          }
          
          if (contactInfo.isGroup) {
            console.log('   👥 Informações do grupo:');
            console.log(`      Assunto: ${contactInfo.groupSubject || 'N/A'}`);
            console.log(`      Descrição: ${contactInfo.groupDescription || 'N/A'}`);
            console.log(`      Participantes: ${contactInfo.participants?.length || 0}`);
            console.log(`      Administradores: ${contactInfo.groupAdmins?.length || 0}`);
          }
          
          console.log(`   📊 Dados brutos disponíveis: ${Object.keys(contactInfo.rawData).length} campos`);
          
        } else {
          console.log('❌ Erro na extração:', extractResponse.data.message);
        }
        
      } catch (error) {
        console.log('❌ Erro ao extrair informações:', error.response?.data?.message || error.message);
      }
    }
    
    // 5. Resumo das funcionalidades
    console.log('\n5️⃣ Funcionalidades implementadas para perfis:');
    console.log('   🏢 getBusinessProfile() com retry logic');
    console.log('   📱 Extração de foto de perfil com retry');
    console.log('   📝 Status e presença do contato');
    console.log('   🔍 Informações adicionais do store');
    console.log('   ✅ Status de verificação');
    console.log('   🖼️ URLs de fotos de perfil');
    console.log('   📊 Dados brutos completos');
    console.log('   💾 Salvamento em duas tabelas (contacts + whatsapp_mensagens)');
    
    console.log('\n✅ Teste de perfis de negócio finalizado!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testBusinessProfiles();
