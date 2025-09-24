# 🔧 Solução: Erro "Falha ao aplicar tema"

## ❌ Problema
**Erro: "Falha ao aplicar tema"** - As cores não estão sendo salvas no banco de dados.

## 🎯 Solução Rápida

### **Passo 1: Execute o Script SQL no Supabase**

1. Abra o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script `simple_theme_columns_fix.sql`:

```sql
-- Adicionar colunas de tema (ignora se já existirem)
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#dee2e3',
ADD COLUMN IF NOT EXISTS topbar_color TEXT DEFAULT '#3F30F1',
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#4A5477';
```

### **Passo 2: Execute o Debug no Console**

1. Abra o **Console do Navegador** (F12)
2. Execute o script `debug_theme_error_specific.js`
3. Verifique os resultados dos testes

### **Passo 3: Teste o Salvamento**

1. Vá para **Configurações > Empresa > Identidade Visual**
2. Altere uma cor
3. Clique em **"Salvar"**
4. Verifique se aparece **"Tema aplicado com sucesso!"**

## 🔍 Diagnóstico Detalhado

### **Scripts Disponíveis**

#### 1. **`simple_theme_columns_fix.sql`**
- Script SQL simples para criar as colunas
- Testa inserção de dados
- Verifica se tudo está funcionando

#### 2. **`debug_theme_error_specific.js`**
- Testa conexão com Supabase
- Verifica se as colunas existem
- Testa permissões RLS
- Simula salvamento da interface

### **Possíveis Causas e Soluções**

#### **Causa 1: Colunas não existem**
```sql
-- Solução: Execute no Supabase
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#dee2e3',
ADD COLUMN IF NOT EXISTS topbar_color TEXT DEFAULT '#3F30F1',
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#4A5477';
```

#### **Causa 2: Problema de permissões RLS**
- Verifique se o usuário tem permissão para inserir/atualizar
- Execute o debug para identificar erros de RLS

#### **Causa 3: Erro na função de salvamento**
- Verifique os logs no console (devem aparecer logs com "🔍 DEBUG:")
- Identifique onde está falhando

## 🧪 Testes de Verificação

### **Teste 1: Verificar Colunas**
```javascript
// Execute no console
window.debugThemeError.checkThemeColumns()
```

### **Teste 2: Testar Salvamento**
```javascript
// Execute no console
window.debugThemeError.testInterfaceSave()
```

### **Teste 3: Debug Completo**
```javascript
// Execute no console
window.debugThemeError.runSpecificDebug()
```

## 📊 Logs de Debug

### **Logs Esperados no Console**
Quando você tentar salvar o tema, deve aparecer no console:

```
🔍 DEBUG: Iniciando saveCompanySettings com dados: {sidebar_color: "#ff6b6b", ...}
🔍 DEBUG: Dados preparados para salvar: {company_id: "...", ...}
🔍 DEBUG: Configuração existente: {id: "..."}
🔍 DEBUG: Atualizando configuração existente...
🔍 DEBUG: Resultado da operação: {data: {...}, error: null}
✅ DEBUG: Configurações salvas com sucesso: {...}
```

### **Se Aparecer Erro**
```
❌ DEBUG: Erro na operação: {message: "...", code: "...", details: "..."}
```

## ✅ Verificação Final

### **Checklist de Verificação**

- [ ] Script SQL executado no Supabase
- [ ] Colunas `sidebar_color`, `topbar_color`, `button_color` existem
- [ ] Debug executado no console sem erros
- [ ] Salvamento de tema funciona na interface
- [ ] Cores são aplicadas imediatamente
- [ ] Cores persistem após recarregar a página

### **Se Ainda Não Funcionar**

1. **Execute o debug completo** e copie todos os logs
2. **Verifique se as colunas existem** no Supabase
3. **Teste salvamento direto** no Supabase
4. **Verifique permissões RLS** da tabela

## 🎯 Resultado Esperado

Após executar os scripts:

- ✅ **Colunas criadas** no banco de dados
- ✅ **Salvamento funcionando** sem erros
- ✅ **Cores aplicadas** imediatamente
- ✅ **Persistência** das configurações
- ✅ **Interface funcionando** perfeitamente

## 📞 Próximos Passos

1. **Execute o script SQL** no Supabase
2. **Execute o debug** no console
3. **Teste o salvamento** na interface
4. **Reporte os resultados** se ainda houver problemas

O sistema agora tem ferramentas completas para identificar e resolver o problema!
