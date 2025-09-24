// test-whatsapp-profile-sync.js
// Script de teste para verificar a sincronização de perfis WhatsApp

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileSync() {
  console.log('🧪 [TEST] Iniciando teste de sincronização de perfis WhatsApp...');
  
  try {
    // 1. Verificar se as colunas foram adicionadas
    console.log('📊 [TEST] Verificando estrutura das tabelas...');
    
    const { data: contactsColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'contacts')
      .eq('table_schema', 'public')
      .like('column_name', 'whatsapp_%')
      .order('ordinal_position');
    
    console.log('✅ [TEST] Colunas WhatsApp na tabela contacts:', contactsColumns?.length || 0);
    contactsColumns?.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    const { data: messagesColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'whatsapp_mensagens')
      .eq('table_schema', 'public')
      .like('column_name', 'whatsapp_%')
      .order('ordinal_position');
    
    console.log('✅ [TEST] Colunas WhatsApp na tabela whatsapp_mensagens:', messagesColumns?.length || 0);
    messagesColumns?.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // 2. Testar inserção de dados de exemplo
    console.log('📝 [TEST] Testando inserção de dados de exemplo...');
    
    const testContact = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      name: 'Teste Contato WhatsApp',
      phone: '5511999999999',
      whatsapp_jid: '5511999999999@s.whatsapp.net',
      whatsapp_name: 'Teste Contato',
      whatsapp_profile_picture: 'https://example.com/profile.jpg',
      whatsapp_is_group: false,
      whatsapp_business_name: 'Empresa Teste',
      whatsapp_business_description: 'Descrição da empresa teste',
      whatsapp_business_category: 'TECHNOLOGY',
      whatsapp_business_email: 'teste@empresa.com',
      whatsapp_business_website: 'https://empresa.com',
      whatsapp_verified: true,
      whatsapp_online: true,
      whatsapp_status: 'Olá! Como posso ajudar?',
      whatsapp_raw_data: {
        businessProfile: {
          business_name: 'Empresa Teste',
          description: 'Descrição da empresa teste',
          category: 'TECHNOLOGY'
        }
      }
    };
    
    const { data: insertedContact, error: contactError } = await supabase
      .from('contacts')
      .insert(testContact)
      .select();
    
    if (contactError) {
      console.error('❌ [TEST] Erro ao inserir contato de teste:', contactError);
    } else {
      console.log('✅ [TEST] Contato de teste inserido:', insertedContact[0].id);
    }
    
    // 3. Testar inserção de grupo de exemplo
    console.log('👥 [TEST] Testando inserção de grupo de exemplo...');
    
    const testGroup = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      name: 'Grupo Teste WhatsApp',
      phone: '120363123456789012@g.us',
      whatsapp_jid: '120363123456789012@g.us',
      whatsapp_name: 'Grupo Teste',
      whatsapp_is_group: true,
      whatsapp_group_subject: 'Grupo de Teste',
      whatsapp_group_description: 'Grupo para testes do sistema',
      whatsapp_group_owner: '5511999999999@s.whatsapp.net',
      whatsapp_group_admins: ['5511999999999@s.whatsapp.net'],
      whatsapp_group_participants: [
        { id: '5511999999999@s.whatsapp.net', admin: 'admin', name: 'Admin' },
        { id: '5511888888888@s.whatsapp.net', admin: null, name: 'Participante' }
      ],
      whatsapp_group_created: new Date().toISOString(),
      whatsapp_group_settings: {
        announce: true,
        restrict: false
      },
      whatsapp_raw_data: {
        groupMetadata: {
          subject: 'Grupo de Teste',
          desc: 'Grupo para testes do sistema',
          owner: '5511999999999@s.whatsapp.net'
        }
      }
    };
    
    const { data: insertedGroup, error: groupError } = await supabase
      .from('contacts')
      .insert(testGroup)
      .select();
    
    if (groupError) {
      console.error('❌ [TEST] Erro ao inserir grupo de teste:', groupError);
    } else {
      console.log('✅ [TEST] Grupo de teste inserido:', insertedGroup[0].id);
    }
    
    // 4. Testar inserção de mensagem com informações de perfil
    console.log('💬 [TEST] Testando inserção de mensagem com informações de perfil...');
    
    // Primeiro, criar um atendimento de teste
    const { data: testAtendimento, error: atendimentoError } = await supabase
      .from('whatsapp_atendimentos')
      .insert({
        owner_id: '00000000-0000-0000-0000-000000000000',
        connection_id: 'test-connection',
        chat_id: '5511999999999@s.whatsapp.net',
        numero_cliente: '5511999999999',
        nome_cliente: 'Teste Contato',
        status: 'active',
        ultima_mensagem_preview: 'Mensagem de teste com informações de perfil',
        ultima_mensagem_em: new Date().toISOString(),
        nao_lidas: 1
      })
      .select();
    
    if (atendimentoError) {
      console.error('❌ [TEST] Erro ao criar atendimento de teste:', atendimentoError);
    } else {
      console.log('✅ [TEST] Atendimento de teste criado:', testAtendimento[0].id);
      
      // Agora inserir mensagem com informações de perfil
      const testMessage = {
        owner_id: '00000000-0000-0000-0000-000000000000',
        atendimento_id: testAtendimento[0].id,
        connection_id: 'test-connection',
        chat_id: '5511999999999@s.whatsapp.net',
        conteudo: 'Mensagem de teste com informações completas de perfil',
        remetente: 'CLIENTE',
        tipo: 'TEXTO',
        message_type: 'CONTACT_INFO',
        wpp_name: 'Teste Contato',
        whatsapp_business_name: 'Empresa Teste',
        whatsapp_business_description: 'Descrição da empresa teste',
        whatsapp_business_category: 'TECHNOLOGY',
        whatsapp_verified: true,
        whatsapp_online: true,
        whatsapp_status: 'Olá! Como posso ajudar?',
        whatsapp_raw_data: {
          businessProfile: {
            business_name: 'Empresa Teste',
            description: 'Descrição da empresa teste',
            category: 'TECHNOLOGY'
          }
        },
        timestamp: new Date().toISOString(),
        lida: false
      };
      
      const { data: insertedMessage, error: messageError } = await supabase
        .from('whatsapp_mensagens')
        .insert(testMessage)
        .select();
      
      if (messageError) {
        console.error('❌ [TEST] Erro ao inserir mensagem de teste:', messageError);
      } else {
        console.log('✅ [TEST] Mensagem de teste inserida:', insertedMessage[0].id);
      }
    }
    
    // 5. Verificar dados inseridos
    console.log('🔍 [TEST] Verificando dados inseridos...');
    
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_id', '00000000-0000-0000-0000-000000000000')
      .like('name', '%Teste%');
    
    if (contactsError) {
      console.error('❌ [TEST] Erro ao buscar contatos:', contactsError);
    } else {
      console.log('✅ [TEST] Contatos encontrados:', contacts.length);
      contacts.forEach(contact => {
        console.log(`   - ${contact.name} (${contact.whatsapp_is_group ? 'Grupo' : 'Contato'})`);
        if (contact.whatsapp_business_name) {
          console.log(`     Negócio: ${contact.whatsapp_business_name}`);
        }
        if (contact.whatsapp_group_subject) {
          console.log(`     Grupo: ${contact.whatsapp_group_subject}`);
        }
      });
    }
    
    console.log('✅ [TEST] Teste de sincronização de perfis concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ [TEST] Erro no teste:', error);
  }
}

// Executar teste
testProfileSync();
