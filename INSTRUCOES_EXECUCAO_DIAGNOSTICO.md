# 🔧 Instruções para Executar o Diagnóstico

## 🎯 **AÇÕES IMEDIATAS**

### **1. Abra o Console do Navegador**
- Pressione **F12** no navegador
- Vá para a aba **Console**

### **2. Execute o Script de Teste Direto**
Copie e cole este código no console:

```javascript
// Script direto para testar o salvamento de tema
console.log('🔍 TESTE DIRETO: Salvamento de Tema');

async function testThemeSaveNow() {
  try {
    // 1. Verificar Supabase
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase não está disponível');
      return;
    }
    console.log('✅ Supabase disponível');
    
    // 2. Buscar usuário
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ Usuário não logado');
      return;
    }
    console.log('✅ Usuário logado:', user.user.id);
    
    // 3. Buscar company_id
    let companyId = null;
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.user.id)
      .single();
    
    companyId = userProfile?.company_id || '11111111-1111-1111-1111-111111111111';
    console.log('✅ Company ID:', companyId);
    
    // 4. Dados de teste
    const settingsToSave = {
      company_name: 'Empresa Teste Interface',
      sidebar_color: '#ff6b6b',
      topbar_color: '#4ecdc4',
      button_color: '#45b7d1',
      company_id: companyId,
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Dados preparados:', settingsToSave);
    
    // 5. Salvar no banco
    const { data, error } = await supabase
      .from('company_settings')
      .upsert(settingsToSave)
      .select();
    
    if (error) {
      console.error('❌ ERRO:', error);
      return;
    }
    
    console.log('✅ SUCESSO! Dados salvos:', data);
    
    // 6. Aplicar cores
    document.documentElement.style.setProperty('--sidebar-color', '#ff6b6b');
    document.documentElement.style.setProperty('--topbar-color', '#4ecdc4');
    document.documentElement.style.setProperty('--button-color', '#45b7d1');
    
    console.log('✅ Cores aplicadas no CSS');
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

// Executar teste
testThemeSaveNow();
```

### **3. Verifique os Resultados**
- Se aparecer **"✅ SUCESSO!"** = O problema está na interface
- Se aparecer **"❌ ERRO:"** = Copie o erro e me envie

### **4. Teste na Interface**
1. Vá para **Configurações > Empresa > Identidade Visual**
2. Altere uma cor
3. Clique em **"Salvar"**
4. Verifique se aparece **"Tema aplicado com sucesso!"**

## 🔍 **DIAGNÓSTICO ALTERNATIVO**

Se o script acima não funcionar, execute este:

```javascript
// Diagnóstico completo
console.log('🔍 DIAGNÓSTICO COMPLETO');

async function fullDiagnosis() {
  // Teste 1: Conexão
  const { data, error } = await supabase
    .from('company_settings')
    .select('id')
    .limit(1);
  
  if (error) {
    console.error('❌ Erro de conexão:', error);
    return;
  }
  console.log('✅ Conexão OK');
  
  // Teste 2: Colunas
  const { data: cols, error: colError } = await supabase
    .from('company_settings')
    .select('sidebar_color, topbar_color, button_color')
    .limit(1);
  
  if (colError) {
    console.error('❌ Colunas não existem:', colError);
    return;
  }
  console.log('✅ Colunas OK');
  
  // Teste 3: Salvamento
  const testData = {
    company_id: '11111111-1111-1111-1111-111111111111',
    company_name: 'Teste',
    sidebar_color: '#ff0000',
    topbar_color: '#00ff00',
    button_color: '#0000ff'
  };
  
  const { data: save, error: saveError } = await supabase
    .from('company_settings')
    .upsert(testData)
    .select();
  
  if (saveError) {
    console.error('❌ Erro ao salvar:', saveError);
    return;
  }
  console.log('✅ Salvamento OK');
  
  console.log('🎯 TODOS OS TESTES PASSARAM!');
}

fullDiagnosis();
```

## 📊 **RESULTADOS ESPERADOS**

### **✅ Se Funcionar:**
- Aparecerá "✅ SUCESSO!" no console
- As cores serão aplicadas imediatamente
- O problema está na interface, não no banco

### **❌ Se Não Funcionar:**
- Aparecerá "❌ ERRO:" com detalhes
- Copie o erro completo e me envie
- Identificaremos a causa exata

## 🎯 **PRÓXIMOS PASSOS**

1. **Execute o script** no console
2. **Copie os resultados** (sucesso ou erro)
3. **Me envie os resultados** para análise
4. **Teste na interface** se o script funcionou

## 🔧 **ARQUIVOS CRIADOS**

- `test_theme_save_now.js` - Teste direto
- `auto_diagnose_theme_issue.js` - Diagnóstico completo
- `execute_diagnosis.js` - Execução automática

**Execute o script no console e me envie os resultados!** 🚀
