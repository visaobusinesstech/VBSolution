// Teste para verificar se o salvamento está funcionando
const testSaveConfig = async () => {
  try {
    console.log('🧪 Testando salvamento de configuração...');
    
    const formData = {
      name: 'Teste',
      function: 'Teste função',
      personality: 'Teste personalidade',
      response_style: 'friendly',
      language: 'pt-BR',
      max_response_length: 500,
      tone: '',
      rules: '',
      company_context: '',
      sector: '',
      company_description: '',
      knowledge_base: {
        qa: []
      },
      integration: {
        apiKey: 'sk-test123456789',
        selectedModel: 'gpt-4o-mini',
        isConnected: true
      },
      advanced_settings: {
        temperature: 0.7,
        max_tokens: 500
      },
      is_company_wide: false
    };

    console.log('📤 Enviando dados:', formData);

    const response = await fetch('http://localhost:3001/api/ai-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer VB_DEV_TOKEN' // Token de desenvolvimento
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    console.log('📥 Resposta:', result);

    if (response.ok) {
      console.log('✅ Salvamento bem-sucedido!');
    } else {
      console.log('❌ Erro no salvamento:', result);
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

testSaveConfig();
