// Teste simples para verificar se o salvamento está funcionando
const testSimpleSave = async () => {
  try {
    console.log('🧪 Testando salvamento simples...');
    
    // Simular dados mínimos
    const formData = {
      name: 'Teste Simples',
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

    console.log('📤 Dados para validação:');
    console.log('name:', formData.name);
    console.log('function:', formData.function);
    console.log('personality:', formData.personality);
    console.log('integration.apiKey:', formData.integration.apiKey);
    console.log('integration.selectedModel:', formData.integration.selectedModel);

    // Simular validação
    const hasSubstantialData = (formData.knowledge_base?.files?.length || 0) > 0 ||
                              (formData.knowledge_base?.websites?.length || 0) > 0 ||
                              (formData.knowledge_base?.qa?.length || 0) > 0 ||
                              formData.name ||
                              formData.function ||
                              formData.personality ||
                              formData.integration.apiKey ||
                              formData.integration.selectedModel;

    console.log('✅ hasSubstantialData:', hasSubstantialData);

    if (!hasSubstantialData) {
      console.log('❌ Dados insuficientes para salvar');
    } else {
      console.log('✅ Dados suficientes para salvar');
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

testSimpleSave();
