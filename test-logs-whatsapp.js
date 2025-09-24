// test-logs-whatsapp.js
// Script para testar os logs do sistema WhatsApp

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogs() {
  console.log('🧪 [TEST-LOGS] Iniciando teste de logs do sistema WhatsApp...');
  
  try {
    // 1. Verificar se o backend está rodando
    console.log('🔍 [TEST-LOGS] Verificando se o backend está rodando...');
    
    try {
      const response = await fetch('http://localhost:3000/api/baileys-simple/health');
      const health = await response.json();
      console.log('✅ [TEST-LOGS] Backend está rodando:', health);
    } catch (error) {
      console.log('❌ [TEST-LOGS] Backend não está rodando:', error.message);
      console.log('💡 [TEST-LOGS] Execute: cd backend && node simple-baileys-server.js');
      return;
    }
    
    // 2. Verificar conexões ativas
    console.log('🔍 [TEST-LOGS] Verificando conexões ativas...');
    
    try {
      const response = await fetch('http://localhost:3000/api/baileys-simple/connections');
      const connections = await response.json();
      console.log('📊 [TEST-LOGS] Conexões encontradas:', connections.data?.length || 0);
      
      if (connections.data && connections.data.length > 0) {
        connections.data.forEach((conn, index) => {
          console.log(`   ${index + 1}. ${conn.name} - ${conn.status}`);
        });
      } else {
        console.log('⚠️ [TEST-LOGS] Nenhuma conexão ativa encontrada');
        console.log('💡 [TEST-LOGS] Crie uma conexão WhatsApp primeiro');
        return;
      }
    } catch (error) {
      console.log('❌ [TEST-LOGS] Erro ao verificar conexões:', error.message);
      return;
    }
    
    // 3. Verificar mensagens recentes no banco
    console.log('🔍 [TEST-LOGS] Verificando mensagens recentes no banco...');
    
    const { data: recentMessages, error: messagesError } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (messagesError) {
      console.log('❌ [TEST-LOGS] Erro ao buscar mensagens:', messagesError);
    } else {
      console.log('📊 [TEST-LOGS] Mensagens recentes encontradas:', recentMessages.length);
      recentMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.wpp_name || 'Sem nome'} - ${msg.conteudo?.substring(0, 30)}...`);
        console.log(`      Tipo: ${msg.message_type || msg.tipo} | Grupo: ${msg.whatsapp_is_group ? 'Sim' : 'Não'}`);
        if (msg.whatsapp_business_name) {
          console.log(`      Negócio: ${msg.whatsapp_business_name}`);
        }
        if (msg.whatsapp_group_subject) {
          console.log(`      Grupo: ${msg.whatsapp_group_subject}`);
        }
      });
    }
    
    // 4. Verificar contatos com informações de perfil
    console.log('🔍 [TEST-LOGS] Verificando contatos com informações de perfil...');
    
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .not('whatsapp_jid', 'is', null)
      .limit(5);
    
    if (contactsError) {
      console.log('❌ [TEST-LOGS] Erro ao buscar contatos:', contactsError);
    } else {
      console.log('📊 [TEST-LOGS] Contatos com WhatsApp encontrados:', contacts.length);
      contacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.name} (${contact.whatsapp_name})`);
        console.log(`      Phone: ${contact.phone} | JID: ${contact.whatsapp_jid}`);
        console.log(`      Grupo: ${contact.whatsapp_is_group ? 'Sim' : 'Não'} | Negócio: ${contact.whatsapp_business_name || 'Não'}`);
        if (contact.whatsapp_business_name) {
          console.log(`      Negócio: ${contact.whatsapp_business_name} (${contact.whatsapp_business_category})`);
        }
        if (contact.whatsapp_group_subject) {
          console.log(`      Grupo: ${contact.whatsapp_group_subject}`);
        }
      });
    }
    
    // 5. Instruções para monitorar logs
    console.log('\n📋 [TEST-LOGS] ===== INSTRUÇÕES PARA MONITORAR LOGS =====');
    console.log('1. Para ver logs em tempo real, execute:');
    console.log('   cd backend && node simple-baileys-server.js');
    console.log('');
    console.log('2. Para testar sincronização de perfis:');
    console.log('   curl -X POST http://localhost:3001/api/whatsapp-profile/SUA_CONEXAO/sync-all \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"userId": "SEU_USER_ID"}\'');
    console.log('');
    console.log('3. Para verificar status da sincronização:');
    console.log('   curl http://localhost:3001/api/whatsapp-profile/SUA_CONEXAO/sync-status');
    console.log('');
    console.log('4. Para listar grupos:');
    console.log('   curl http://localhost:3001/api/whatsapp-profile/SUA_CONEXAO/groups');
    console.log('');
    console.log('5. Logs importantes a observar:');
    console.log('   - [CONTACT-EXTRACTOR] - Extração de informações de contato');
    console.log('   - [BUSINESS-INFO] - Informações de negócio');
    console.log('   - [GROUP-INFO] - Informações de grupos');
    console.log('   - [DATABASE] - Salvamento no banco de dados');
    console.log('   - [PROFILE-SYNC] - Sincronização de perfis');
    
    console.log('\n✅ [TEST-LOGS] Teste de logs concluído!');
    
  } catch (error) {
    console.error('❌ [TEST-LOGS] Erro no teste:', error);
  }
}

// Executar teste
testLogs();
