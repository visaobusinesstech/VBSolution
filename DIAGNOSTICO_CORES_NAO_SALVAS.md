# 🔍 Diagnóstico: Cores Não Estão Sendo Salvas

## ❌ Problema Reportado
**"AS CORES NÃO ESTÃO SENDO SALVAS"**

## 🔍 Possíveis Causas Identificadas

### 1. **Colunas Não Existem no Banco de Dados**
- As colunas `sidebar_color`, `topbar_color`, `button_color` podem não ter sido criadas
- Script de migração pode não ter sido executado

### 2. **Erro na Função de Salvamento**
- Função `saveCompanySettings` pode estar falhando silenciosamente
- Dados podem não estar sendo enviados corretamente

### 3. **Problema de Permissões**
- Usuário pode não ter permissão para atualizar a tabela
- RLS (Row Level Security) pode estar bloqueando a operação

### 4. **Erro de Validação**
- Dados podem não estar passando na validação do Supabase
- Campos obrigatórios podem estar faltando

## 🛠️ Soluções Implementadas

### 1. **Scripts de Verificação e Correção**

#### `check_theme_columns.sql`
```sql
-- Verificar se as colunas existem
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

#### `fix_theme_columns_migration.sql`
```sql
-- Script robusto para criar as colunas
DO $$
BEGIN
    -- Adicionar sidebar_color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'sidebar_color') THEN
        ALTER TABLE company_settings ADD COLUMN sidebar_color TEXT DEFAULT '#dee2e3';
    END IF;
    -- ... outras colunas
END $$;
```

### 2. **Logs de Debug Adicionados**

#### Na função `saveCompanySettings`:
```typescript
console.log('🔍 DEBUG: Iniciando saveCompanySettings com dados:', newSettings);
console.log('🔍 DEBUG: Dados preparados para salvar:', settingsToSave);
console.log('🔍 DEBUG: Resultado da operação:', result);
```

### 3. **Script de Teste Completo**

#### `test_theme_save_debug.js`
- Verifica se as colunas existem no banco
- Testa salvamento direto no Supabase
- Verifica dados salvos
- Identifica erros nos logs

## 📋 Passos para Resolver

### **Passo 1: Verificar Banco de Dados**
1. Execute `check_theme_columns.sql` no Supabase
2. Verifique se as colunas `sidebar_color`, `topbar_color`, `button_color` existem
3. Se não existirem, execute `fix_theme_columns_migration.sql`

### **Passo 2: Testar Salvamento**
1. Execute `test_theme_save_debug.js` no console do navegador
2. Verifique os logs de debug no console
3. Identifique onde está falhando

### **Passo 3: Verificar Logs**
1. Abra o console do navegador (F12)
2. Vá para Configurações > Empresa > Identidade Visual
3. Altere uma cor e clique em "Salvar"
4. Verifique os logs que começam com "🔍 DEBUG:"

### **Passo 4: Verificar Dados Salvos**
1. Execute no console: `window.debugThemeSave.checkSavedData()`
2. Verifique se os dados aparecem na tabela `company_settings`

## 🧪 Testes Disponíveis

### **Teste 1: Verificar Colunas**
```javascript
window.debugThemeSave.checkDatabaseColumns()
```

### **Teste 2: Testar Salvamento Direto**
```javascript
window.debugThemeSave.testDirectSave()
```

### **Teste 3: Verificar Dados Salvos**
```javascript
window.debugThemeSave.checkSavedData()
```

### **Teste 4: Debug Completo**
```javascript
window.debugThemeSave.runThemeSaveDebug()
```

## 🔧 Correções Aplicadas

### 1. **Logs de Debug Detalhados**
- Adicionados logs em cada etapa da função `saveCompanySettings`
- Identificação clara de onde está falhando

### 2. **Scripts de Migração Robustos**
- Verificação se colunas existem antes de criar
- Valores padrão definidos corretamente

### 3. **Testes Abrangentes**
- Verificação de conectividade com banco
- Teste de salvamento direto
- Verificação de dados persistidos

## 📊 Status Atual

- ✅ Logs de debug implementados
- ✅ Scripts de verificação criados
- ✅ Scripts de migração robustos
- ✅ Testes de diagnóstico disponíveis
- ❓ Aguardando execução dos scripts de migração
- ❓ Aguardando resultados dos testes de debug

## 🎯 Próximos Passos

1. **Execute os scripts SQL** no Supabase para garantir que as colunas existem
2. **Execute o script de debug** no console para identificar o problema específico
3. **Verifique os logs** durante o salvamento para ver onde está falhando
4. **Reporte os resultados** dos testes para identificar a causa exata

## 📞 Como Reportar o Problema

Se as cores ainda não estiverem sendo salvas após executar os scripts:

1. Execute `window.debugThemeSave.runThemeSaveDebug()` no console
2. Copie todos os logs que aparecem
3. Execute `check_theme_columns.sql` no Supabase e copie o resultado
4. Envie essas informações para análise detalhada

O sistema agora tem ferramentas completas de diagnóstico para identificar exatamente onde está o problema!
