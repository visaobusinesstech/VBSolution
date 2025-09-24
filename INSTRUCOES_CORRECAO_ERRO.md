# 🔧 Correção do Erro "Falha ao criar área"

## 🚨 Problema Identificado

O erro "Falha ao criar área" está ocorrendo porque as tabelas necessárias não existem no banco de dados Supabase. O sistema está tentando usar tabelas que não foram criadas ainda.

## 📋 Tabelas Necessárias

O sistema precisa das seguintes tabelas no Supabase:

- `company_settings` - Configurações da empresa
- `company_areas` - Áreas/departamentos da empresa  
- `company_roles` - Cargos com permissões RBAC
- `company_users` - Usuários da empresa
- `user_profiles` - Perfis de usuários

## 🛠️ Solução Passo a Passo

### Passo 1: Criar as Tabelas no Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Entre no projeto: `nrbsocawokmihvxfcpso`

2. **Execute o Script SQL:**
   - Vá para **SQL Editor** no menu lateral
   - Clique em **New Query**
   - Copie e cole o conteúdo do arquivo `create_company_tables.sql`
   - Clique em **Run** para executar o script

### Passo 2: Verificar se as Tabelas Foram Criadas

1. **No Supabase Dashboard:**
   - Vá para **Table Editor** no menu lateral
   - Verifique se as seguintes tabelas aparecem na lista:
     - `company_settings`
     - `company_areas` 
     - `company_roles`
     - `company_users`
     - `user_profiles`

### Passo 3: Testar a Conexão

1. **No console do navegador:**
   - Abra as ferramentas de desenvolvedor (F12)
   - Vá para a aba **Console**
   - Execute o script de teste:
   ```javascript
   // Copie e cole o conteúdo do arquivo test_and_setup_database.js
   // Depois execute:
   window.testDatabase()
   ```

### Passo 4: Testar o Sistema

1. **Recarregue a página de configurações:**
   - Vá para `/settings`
   - Clique na aba **Estrutura**
   - Tente criar uma nova área

## 🔍 Verificação de Erros

### Se ainda houver erros:

1. **Verifique o Console do Navegador:**
   - Abra F12 → Console
   - Procure por mensagens de erro em vermelho
   - Copie as mensagens de erro para análise

2. **Verifique as Credenciais:**
   - Confirme se as variáveis de ambiente estão corretas:
     - `VITE_SUPABASE_URL=https://nrbsocawokmihvxfcpso.supabase.co`
     - `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Verifique as Permissões:**
   - No Supabase Dashboard → Authentication → Policies
   - Confirme se as políticas RLS estão configuradas

## 📁 Arquivos Criados

Para facilitar a correção, foram criados os seguintes arquivos:

- `create_company_tables.sql` - Script para criar as tabelas
- `test_and_setup_database.js` - Script para testar conexão
- `INSTRUCOES_CORRECAO_ERRO.md` - Este arquivo de instruções

## ✅ Resultado Esperado

Após seguir os passos acima:

1. ✅ As tabelas serão criadas no Supabase
2. ✅ O sistema conseguirá salvar áreas, cargos e usuários
3. ✅ O sistema de permissões RBAC funcionará corretamente
4. ✅ Não haverá mais erro "Falha ao criar área"

## 🆘 Suporte

Se ainda houver problemas após seguir as instruções:

1. Verifique se todas as tabelas foram criadas corretamente
2. Confirme se as políticas RLS estão ativas
3. Teste a conexão com o script fornecido
4. Verifique os logs do console do navegador

---

**Importante:** Certifique-se de executar o script SQL no Supabase Dashboard antes de testar o sistema!
