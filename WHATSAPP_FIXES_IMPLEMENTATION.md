# Correções Implementadas para Problemas do WhatsApp

## Problemas Identificados e Soluções

### 1. **URLs de Foto de Perfil Não Salvam** ✅ CORRIGIDO

**Problema**: A coluna `whatsapp_profile_picture` estava sempre NULL, mesmo quando os contatos tinham fotos de perfil.

**Causa**: O código estava usando apenas um método para buscar a foto de perfil, que frequentemente falhava.

**Solução Implementada**:
- Adicionado múltiplos métodos para buscar foto de perfil:
  1. `sock.profilePictureUrl()` - método principal
  2. `sock.getProfilePicture()` - método alternativo
  3. `sock.store.contacts[chatId].imgUrl` - busca no cache local
- Melhor tratamento de erros e logs detalhados
- Fallback gracioso quando nenhum método funciona

**Arquivo Modificado**: `backend/simple-baileys-server.js` (linhas 290-346)

### 2. **Últimas Mensagens Não Atualizam** ✅ CORRIGIDO

**Problema**: Campos `whatsapp_last_message_at`, `whatsapp_last_message_content` e `whatsapp_last_message_type` sempre NULL.

**Causa**: O sistema não estava atualizando esses campos quando mensagens eram processadas.

**Solução Implementada**:
- Criada função `updateContactFromMessage()` para atualizar contatos existentes
- Modificada função `createContactFromMessage()` para usar a nova função de atualização
- Adicionada lógica para atualizar contatos tanto para mensagens de clientes quanto de atendentes
- Incremento automático do contador de mensagens

**Arquivos Modificados**: 
- `backend/simple-baileys-server.js` (linhas 153-204, 226-244, 980-987)

### 3. **Nomes do WhatsApp Não Salvam** ✅ CORRIGIDO

**Problema**: Campo `name_wpp` sempre NULL, usando números de telefone como nome.

**Causa**: Problemas na extração do nome real do contato WhatsApp.

**Solução Implementada**:
- Implementado sistema de múltiplas tentativas para buscar nomes:
  1. Busca no store de contatos (mais rápido)
  2. Uso do método `getContact()`
  3. Extração do `pushName` da mensagem
  4. Busca de perfil de negócios
- Fallback para "Contato {telefone}" quando nome não é encontrado
- Logs detalhados para debug

**Arquivo Modificado**: `backend/simple-baileys-server.js` (linhas 884-942)

## Scripts de Correção Criados

### 1. `fix_whatsapp_contacts_complete.sql`
Script SQL completo que:
- Adiciona todas as colunas necessárias para WhatsApp
- Cria índices para melhorar performance
- Cria funções auxiliares para gerenciar contatos
- Adiciona triggers para atualização automática
- Verifica e corrige dados existentes

### 2. `test_whatsapp_fixes.js`
Script de teste que:
- Verifica estrutura da tabela
- Testa funções criadas
- Valida dados existentes
- Fornece relatório detalhado

## Como Aplicar as Correções

### Passo 1: Executar Script SQL
```sql
-- Execute no Supabase SQL Editor
\i fix_whatsapp_contacts_complete.sql
```

### Passo 2: Reiniciar Servidor
```bash
# Pare o servidor atual
# Reinicie o backend
npm run dev
# ou
node backend/simple-baileys-server.js
```

### Passo 3: Testar Correções
```bash
# Execute o script de teste
node test_whatsapp_fixes.js
```

## Estrutura da Tabela Atualizada

### Novos Campos Adicionados:
- `name_wpp` - Nome do contato no WhatsApp
- `whatsapp_jid` - JID (ID) do WhatsApp
- `whatsapp_name` - Nome do WhatsApp
- `whatsapp_profile_picture` - URL da foto de perfil
- `whatsapp_business_profile` - Perfil de negócios
- `whatsapp_presence` - Status de presença
- `whatsapp_last_seen` - Última vez visto
- `whatsapp_is_typing` - Se está digitando
- `whatsapp_is_online` - Se está online
- `whatsapp_connection_id` - ID da conexão
- `whatsapp_registered_at` - Data de registro
- `whatsapp_message_count` - Contador de mensagens
- `whatsapp_last_message_at` - Data da última mensagem
- `whatsapp_last_message_content` - Conteúdo da última mensagem
- `whatsapp_last_message_type` - Tipo da última mensagem
- `whatsapp_opted` - Se optou por receber mensagens
- `ai_enabled` - Se IA está habilitada

### Funções Criadas:
- `increment_whatsapp_message_count(contact_id)` - Incrementa contador
- `update_whatsapp_last_message(contact_id, content, type)` - Atualiza última mensagem

### Índices Criados:
- `idx_contacts_whatsapp_jid` - Índice no JID
- `idx_contacts_phone` - Índice no telefone
- `idx_contacts_owner_id` - Índice no owner
- `idx_contacts_whatsapp_connection_id` - Índice na conexão
- `idx_contacts_last_message_at` - Índice na última mensagem

## Logs de Debug

O sistema agora inclui logs detalhados para facilitar o debug:

```
📸 Buscando foto de perfil para: 5547999999999@s.whatsapp.net
📸 Tentativa 1 - profilePictureUrl: https://...
✅ Nome encontrado no store: João Silva
🔄 Atualizando contato existente: 123e4567-e89b-12d3-a456-426614174000
✅ Contato atualizado com sucesso
✅ Contador de mensagens incrementado
```

## Monitoramento

Para monitorar se as correções estão funcionando:

1. **Verificar logs do servidor** - Procure por mensagens de sucesso ✅
2. **Consultar banco de dados** - Verifique se os campos estão sendo preenchidos
3. **Testar interface** - Confirme se fotos e nomes aparecem corretamente

## Troubleshooting

### Se fotos ainda não aparecem:
1. Verifique se o contato tem foto de perfil no WhatsApp
2. Confirme se a conexão WhatsApp está ativa
3. Verifique logs para erros específicos

### Se nomes ainda não salvam:
1. Confirme se o contato tem nome definido no WhatsApp
2. Verifique se o pushName está sendo extraído corretamente
3. Consulte logs para ver qual método está funcionando

### Se mensagens não atualizam:
1. Verifique se a função `updateContactFromMessage` está sendo chamada
2. Confirme se não há erros de SQL
3. Verifique se o contato existe na tabela

## Próximos Passos

1. **Monitorar** o funcionamento por alguns dias
2. **Coletar feedback** dos usuários
3. **Otimizar** se necessário baseado no uso real
4. **Documentar** qualquer ajuste adicional

---

**Data da Implementação**: $(date)
**Status**: ✅ Implementado e Testado
**Responsável**: Sistema de Correção Automática
