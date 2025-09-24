// test-profile-functions.js
// Script para testar as funções getBusinessProfile e groupFetchAllParticipating

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileFunctions() {
  console.log('🧪 [TEST-PROFILE] Testando funções de perfil WhatsApp...');
  console.log('');

  try {
    // 1. Verificar se o backend está rodando
    console.log('🔍 [TEST-PROFILE] Verificando se o backend está rodando...');
    
    const response = await fetch('http://localhost:3001/api/baileys-simple/health');
    const healthData = await response.json();
    
    if (!healthData.success) {
      console.log('❌ [TEST-PROFILE] Backend não está rodando');
      console.log('💡 [TEST-PROFILE] Execute: ./start-whatsapp-with-logs.sh');
      return;
    }
    
    console.log('✅ [TEST-PROFILE] Backend está rodando');
    
    // 2. Buscar conexões ativas
    console.log('\n🔍 [TEST-PROFILE] Buscando conexões ativas...');
    
    const connectionsResponse = await fetch('http://localhost:3001/api/baileys-simple/connections');
    const connectionsData = await connectionsResponse.json();
    
    if (!connectionsData.success || !connectionsData.connections || connectionsData.connections.length === 0) {
      console.log('❌ [TEST-PROFILE] Nenhuma conexão ativa encontrada');
      console.log('💡 [TEST-PROFILE] Crie uma conexão WhatsApp primeiro');
      return;
    }
    
    const connection = connectionsData.connections[0];
    console.log(`✅ [TEST-PROFILE] Conexão encontrada: ${connection.id} (${connection.name})`);
    
    // 3. Testar groupFetchAllParticipating
    console.log('\n🔍 [TEST-PROFILE] Testando groupFetchAllParticipating...');
    
    try {
      const groupsResponse = await fetch(`http://localhost:3001/api/whatsapp-profile/${connection.id}/groups`);
      const groupsData = await groupsResponse.json();
      
      if (groupsData.success) {
        console.log(`✅ [TEST-PROFILE] Encontrados ${groupsData.groups?.length || 0} grupos`);
        
        if (groupsData.groups && groupsData.groups.length > 0) {
          console.log('📊 [TEST-PROFILE] Exemplos de grupos:');
          groupsData.groups.slice(0, 3).forEach((group, index) => {
            console.log(`   ${index + 1}. ${group.subject || 'Sem nome'} (${group.id})`);
            console.log(`      Participantes: ${group.participants?.length || 0}`);
            console.log(`      Descrição: ${group.desc || 'N/A'}`);
          });
        }
      } else {
        console.log('⚠️ [TEST-PROFILE] Erro ao buscar grupos:', groupsData.error);
      }
    } catch (error) {
      console.log('❌ [TEST-PROFILE] Erro ao testar grupos:', error.message);
    }
    
    // 4. Testar getBusinessProfile com alguns contatos
    console.log('\n🔍 [TEST-PROFILE] Testando getBusinessProfile...');
    
    // Buscar alguns contatos para testar
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('whatsapp_jid, whatsapp_name, phone')
      .not('whatsapp_jid', 'is', null)
      .limit(3);
    
    if (contactsError) {
      console.log('❌ [TEST-PROFILE] Erro ao buscar contatos:', contactsError.message);
    } else if (contacts && contacts.length > 0) {
      console.log(`📊 [TEST-PROFILE] Testando com ${contacts.length} contatos...`);
      
      for (const contact of contacts) {
        try {
          console.log(`\n🔍 [TEST-PROFILE] Testando ${contact.whatsapp_name || contact.phone}...`);
          
          const businessResponse = await fetch(`http://localhost:3001/api/whatsapp-profile/${connection.id}/business-profile/${contact.whatsapp_jid}`);
          const businessData = await businessResponse.json();
          
          if (businessData.success && businessData.businessProfile) {
            console.log(`✅ [TEST-PROFILE] Perfil de negócio encontrado para ${contact.whatsapp_name}:`);
            console.log(`   Nome: ${businessData.businessProfile.business_name || 'N/A'}`);
            console.log(`   Descrição: ${businessData.businessProfile.description || 'N/A'}`);
            console.log(`   Categoria: ${businessData.businessProfile.category || 'N/A'}`);
            console.log(`   Email: ${businessData.businessProfile.email || 'N/A'}`);
            console.log(`   Website: ${businessData.businessProfile.website || 'N/A'}`);
            console.log(`   Verificado: ${businessData.businessProfile.verified ? 'Sim' : 'Não'}`);
          } else {
            console.log(`ℹ️ [TEST-PROFILE] Nenhum perfil de negócio para ${contact.whatsapp_name}`);
          }
        } catch (error) {
          console.log(`❌ [TEST-PROFILE] Erro ao testar ${contact.whatsapp_name}:`, error.message);
        }
      }
    } else {
      console.log('ℹ️ [TEST-PROFILE] Nenhum contato encontrado para testar');
    }
    
    // 5. Testar sincronização completa
    console.log('\n🔍 [TEST-PROFILE] Testando sincronização completa...');
    
    try {
      const syncResponse = await fetch(`http://localhost:3001/api/whatsapp-profile/${connection.id}/sync-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: '00000000-0000-0000-0000-000000000000' // Usar um ID de teste
        })
      });
      
      const syncData = await syncResponse.json();
      
      if (syncData.success) {
        console.log('✅ [TEST-PROFILE] Sincronização iniciada com sucesso');
        console.log(`📊 [TEST-PROFILE] Status: ${syncData.status}`);
        console.log(`📊 [TEST-PROFILE] Contatos processados: ${syncData.contactsProcessed || 0}`);
        console.log(`📊 [TEST-PROFILE] Grupos processados: ${syncData.groupsProcessed || 0}`);
      } else {
        console.log('⚠️ [TEST-PROFILE] Erro na sincronização:', syncData.error);
      }
    } catch (error) {
      console.log('❌ [TEST-PROFILE] Erro ao testar sincronização:', error.message);
    }
    
    // 6. Verificar status da sincronização
    console.log('\n🔍 [TEST-PROFILE] Verificando status da sincronização...');
    
    try {
      const statusResponse = await fetch(`http://localhost:3001/api/whatsapp-profile/${connection.id}/sync-status`);
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        console.log('📊 [TEST-PROFILE] Status da sincronização:');
        console.log(`   Em execução: ${statusData.isRunning ? 'Sim' : 'Não'}`);
        console.log(`   Contatos processados: ${statusData.contactsProcessed || 0}`);
        console.log(`   Grupos processados: ${statusData.groupsProcessed || 0}`);
        console.log(`   Erros: ${statusData.errors || 0}`);
        console.log(`   Última execução: ${statusData.lastRun || 'Nunca'}`);
      } else {
        console.log('⚠️ [TEST-PROFILE] Erro ao verificar status:', statusData.error);
      }
    } catch (error) {
      console.log('❌ [TEST-PROFILE] Erro ao verificar status:', error.message);
    }
    
    console.log('\n🎯 [TEST-PROFILE] Teste concluído!');
    console.log('📋 [TEST-PROFILE] Próximos passos:');
    console.log('   1. Verificar logs do backend para ver as informações sendo capturadas');
    console.log('   2. Enviar mensagens para testar o processamento em tempo real');
    console.log('   3. Verificar se as tabelas estão sendo preenchidas corretamente');
    
  } catch (error) {
    console.error('❌ [TEST-PROFILE] Erro geral:', error);
  }
}

// Executar teste
testProfileFunctions();
