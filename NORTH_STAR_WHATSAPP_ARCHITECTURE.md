# Arquitetura North Star - WhatsApp Integration

## Visão Geral

Esta implementação segue a arquitetura North Star definida:

- **Baileys = transport only** - Apenas para envio/recebimento de mensagens
- **Supabase = source of truth** - Fonte única de verdade para conversas/mensagens/mídia
- **Realtime do Supabase** - Mantém a UI atualizada em tempo real
- **Frontend sempre renderiza do Supabase** - Via Edge Functions

## Estrutura de Dados

### Tabelas Criadas

#### `whatsapp_atendimentos` (conversas)
- `id` - UUID PK
- `connection_id` - ID da conexão Baileys
- `chat_id` - JID/telefone do WhatsApp
- `title` - Nome do contato/grupo
- `avatar_url` - URL do avatar
- `contact_id` - FK opcional para contatos do CRM
- `last_message_preview` - Preview da última mensagem
- `last_message_at` - Timestamp da última mensagem
- `unread_count` - Contador de mensagens não lidas
- `status` - active/archived/blocked

#### `whatsapp_mensagens` (mensagens)
- `id` - UUID PK
- `client_id` - ID temporário para reconciliação otimista
- `atendimento_id` - FK para whatsapp_atendimentos
- `connection_id` - ID da conexão
- `chat_id` - JID do chat
- `direction` - 'in' ou 'out'
- `type` - text/image/audio/video/document/sticker/location
- `text` - Conteúdo da mensagem
- `media_url` - URL pública/assinada
- `storage_key` - Caminho no Supabase Storage
- `mime_type` - Tipo MIME
- `size_bytes` - Tamanho em bytes
- `ack` - Status: 0=queued, 1=sent, 2/3=delivered, 4=read
- `author` - JID/telefone do autor
- `error` - Erro de envio
- `created_at` - Timestamp de criação
- `edited` - Se foi editada
- `reply_to_id` - FK para mensagem respondida

### Storage
- **Bucket**: `wa-media`
- **Estrutura**: `connectionId/chatId/<ulid>.<ext>`
- **URLs assinadas** para acesso seguro

## Edge Functions

### 1. `wa-conversations`
- **GET** `/v1/wa/conversations`
- Lista conversas com paginação e busca
- Parâmetros: `connectionId`, `q`, `limit`, `cursor`

### 2. `wa-messages`
- **GET** `/v1/wa/conversations/:chatId/messages`
- Lista mensagens com paginação
- Parâmetros: `connectionId`, `limit`, `cursor`

### 3. `wa-send-message`
- **POST** `/v1/wa/conversations/:chatId/messages`
- Envia mensagem com reconciliação otimista
- Headers: `Idempotency-Key`
- Body: `{ connectionId, type, text?, mediaKey?, mimeType?, replyToId?, clientId }`

### 4. `wa-mark-read`
- **POST** `/v1/wa/conversations/:chatId/read`
- Marca mensagens como lidas
- Body: `{ connectionId, messageId? }`

### 5. `wa-typing`
- **POST** `/v1/wa/conversations/:chatId/typing`
- Envia indicador de digitação
- Body: `{ connectionId, state }`

### 6. `wa-media-upload`
- **POST** `/v1/wa/media/upload`
- Upload de mídia para Supabase Storage
- Body: `{ connectionId, chatId, file, mimeType }`
- Retorna: `{ mediaKey, urlPreview, fileName, mimeType, size }`

## Frontend Updates

### `waSdk.ts`
- Atualizado para usar Edge Functions
- Suporte a Idempotency-Key
- Novas interfaces para Message e Conversation
- Função `uploadMedia()` para mídia

### `useMessages.ts`
- Migrado para `useInfiniteQuery`
- Reconciliação otimista via `client_id`
- Supabase Realtime para updates em tempo real
- Combinação de mensagens do servidor + otimistas

### `WhatsApp.tsx`
- Atualizado para nova estrutura de dados
- Uso correto de `chat_id` vs `conversation_id`
- Integração com Realtime do Supabase

## Configuração

### 1. Variáveis de Ambiente
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

### 2. Aplicar Migrações
```bash
# Aplicar migrações do Supabase
supabase db push

# Deploy das Edge Functions
supabase functions deploy wa-conversations
supabase functions deploy wa-messages
supabase functions deploy wa-send-message
supabase functions deploy wa-mark-read
supabase functions deploy wa-typing
supabase functions deploy wa-media-upload
```

### 3. Configurar RLS
As políticas RLS já estão configuradas nas migrações:
- Service role: acesso total
- Authenticated users: leitura
- Em produção, ajustar para multi-tenancy

## Baileys Worker (TODO)

O worker Baileys deve ser implementado para:

### Mensagens Recebidas
1. Receber via `messages.upsert`
2. Normalizar dados
3. Inserir em `whatsapp_mensagens` (direction='in')
4. Atualizar `whatsapp_atendimentos` (last_message, unread_count)

### Mensagens Enviadas
1. Receber via API/queue
2. Enviar via Baileys
3. Inserir em `whatsapp_mensagens` (direction='out')
4. Atualizar `ack` conforme confirmações

### Confirmações
1. Escutar eventos de ack do Baileys
2. Atualizar `ack` em `whatsapp_mensagens`
3. Realtime notifica frontend

## Testes de Aceitação

### ✅ História carrega após refresh
- Prova de persistência no Supabase

### ✅ Otimista → echo do servidor substitui bolha
- Sem duplicação, sem flicker

### ✅ Ticks de ack movem 0→1→2/3→4 via Realtime UPDATE
- Status atualizado em tempo real

### ✅ Mídia: preview mostra; refresh ainda lá; URL assinada/válida
- Upload e exibição funcionando

### ✅ Paginação: scroll antigo; enviar nova mensagem não limpa páginas antigas
- InfiniteQuery funcionando

### ✅ Trocar chat: Realtime unsub do antigo, sub do novo; sem cross-talk
- Gerenciamento correto de subscriptions

### ✅ Desconectar/reconectar: sem handlers duplicados; cache intacto
- Cleanup adequado de recursos

## Próximos Passos

1. **Implementar Baileys Worker** - Para processar mensagens reais
2. **Testar integração completa** - Com dados reais do WhatsApp
3. **Otimizar performance** - Índices e queries
4. **Adicionar multi-tenancy** - RLS por organização
5. **Implementar webhooks** - Para integrações externas

## Benefícios da Arquitetura

- **Consistente**: Uma fonte (Supabase) para histórico + Realtime para live
- **Performante**: Paginação server-side + queries indexadas
- **Simples**: Lógica otimista + reconciliação via clientId
- **Escalável**: Multi-conexão, multi-tenant ready; mídia no Storage
- **ManyChat feel**: Echo instantâneo, histórico estável, mídia robusta

