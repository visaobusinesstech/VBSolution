# 🤖 Pipeline Robusto de IA - Setup e Testes

## ✅ **Arquitetura Implementada**

### 📁 **Estrutura de Arquivos Criados**

```
backend/src/
├── ai/
│   ├── loadAgentConfig.ts    # Carrega configuração da IA do Supabase
│   ├── buildPrompt.ts        # Constrói prompts do sistema
│   └── infer.ts             # Chamadas para OpenAI (text/vision/audio)
├── media/
│   └── ingest.ts            # Normaliza mídia (media:hash → URL real)
├── wa/
│   ├── onIncomingMessage.ts # Pipeline principal de processamento
│   ├── saveMessage.ts       # Salva mensagens no banco
│   ├── sendMessage.ts       # Envia mensagens via WhatsApp
│   └── waMedia.ts          # Download de mídia do WhatsApp
└── supabaseClient.ts        # Cliente Supabase
```

### 🔄 **Fluxo Completo Implementado**

1. **Mensagem Recebida** → `onIncomingMessage.ts`
2. **Normalizar Mídia** → `ingest.ts` (media:hash → URL real)
3. **Carregar Config IA** → `loadAgentConfig.ts` (Supabase)
4. **Construir Prompt** → `buildPrompt.ts` (contexto + base conhecimento)
5. **Processar Conteúdo** → `infer.ts` (text/vision/audio)
6. **Gerar Resposta** → OpenAI com contexto completo
7. **Salvar Mensagem** → `saveMessage.ts` (banco de dados)
8. **Enviar via WhatsApp** → `sendMessage.ts` (Baileys)
9. **Atualizar Frontend** → Socket.IO (existente)

## 🚀 **Como Testar**

### **Passo 1: Inicializar Bucket de Mídia**
```bash
curl -X POST http://localhost:3001/api/init-media-bucket
```

### **Passo 2: Ativar IA para Todos os Contatos**
```bash
curl -X POST http://localhost:3001/api/activate-ai-for-all-contacts \
  -H "Content-Type: application/json" \
  -d '{"userId": "905b926a-785a-4f6d-9c3a-9455729500b3"}'
```

### **Passo 3: Testar Sistema Antigo**
```bash
curl -X POST http://localhost:3001/api/test-ai-response \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "905b926a-785a-4f6d-9c3a-9455729500b3",
    "message": "Quais serviços vocês oferecem?",
    "messageType": "TEXTO"
  }'
```

### **Passo 4: Testar Novo Pipeline**
```bash
curl -X POST http://localhost:3001/api/test-new-ai-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "905b926a-785a-4f6d-9c3a-9455729500b3",
    "message": "Quais serviços vocês oferecem?",
    "messageType": "TEXTO"
  }'
```

### **Passo 5: Testar com Mídia**
```bash
# Teste com imagem
curl -X POST http://localhost:3001/api/test-new-ai-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "905b926a-785a-4f6d-9c3a-9455729500b3",
    "message": "O que você vê nesta imagem?",
    "messageType": "IMAGEM",
    "mediaUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  }'

# Teste com áudio
curl -X POST http://localhost:3001/api/test-new-ai-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "905b926a-785a-4f6d-9c3a-9455729500b3",
    "message": "Transcreva este áudio",
    "messageType": "AUDIO",
    "mediaUrl": "media:abc123def456"
  }'
```

## 📊 **Logs Esperados**

### **Novo Pipeline Funcionando:**
```
🤖 ===== ATIVANDO NOVO PIPELINE DE IA =====
🤖 ===== PROCESSANDO MENSAGEM RECEBIDA =====
📎 Normalizando mídia...
🤖 Carregando configuração da IA...
✅ Configuração da IA carregada: { name: "Assistente Virtual VB", model: "gpt-4o-mini", hasApiKey: true, qaCount: 3 }
🤖 Construindo contexto da conversa...
🤖 Construindo prompt do sistema...
🤖 ===== CHAMADA PARA OPENAI =====
🤖 ===== PROMPT DO SISTEMA =====
🤖 === BASE DE CONHECIMENTO ===
🤖 ===== MENSAGEM DO USUÁRIO =====
🤖 Resposta gerada: "Oferecemos desenvolvimento de software, consultoria..."
💾 Salvando mensagem da IA...
📤 Enviando resposta via WhatsApp...
✅ Resposta da IA enviada com sucesso!
```

### **Fallback para Sistema Antigo:**
```
❌ Erro no novo pipeline, usando fallback: [erro]
🤖 Resposta gerada pela IA (fallback): "Olá! Como posso ajudá-lo hoje?"
🤖 ✅ Resposta IA enviada com sucesso (fallback)!
```

## 🎯 **Critérios de Aceitação**

- ✅ **Texto**: IA responde usando base de conhecimento do Supabase
- ✅ **Imagem**: Download, visualização na UI, conteúdo analisado pela IA
- ✅ **Áudio**: Download, reprodução na UI, transcrição usada pela IA
- ✅ **Respostas IA**: Enviadas via WhatsApp e salvas com status 'AI'
- ✅ **UI Minimalista**: Imagens e áudios compactos (não grandes)
- ✅ **Base de Conhecimento**: Usada para orientar comportamento da IA
- ✅ **URLs de Mídia**: Funcionam (base64 e media:hash)

## 🔧 **Configuração Necessária**

### **Variáveis de Ambiente:**
```bash
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_supabase
OPENAI_API_KEY=sua_chave_openai
```

### **Bucket Supabase:**
- Nome: `whatsapp-media`
- Público: Sim
- Tipos permitidos: `image/*`, `audio/*`, `video/*`, `application/pdf`, etc.

### **Tabelas Supabase:**
- `ai_agent_configs`: Configuração da IA
- `whatsapp_sessions`: Overrides de sessão
- `whatsapp_mensagens`: Mensagens
- `contacts`: Contatos com `ai_enabled`

## 🚨 **Solução de Problemas**

### **Se o novo pipeline não funcionar:**
1. Verifique logs para erros específicos
2. O sistema automaticamente usa fallback para o sistema antigo
3. Teste endpoints individuais para identificar problema

### **Se mídia não carregar:**
1. Execute `/api/init-media-bucket` primeiro
2. Verifique permissões do bucket Supabase
3. Confirme variáveis de ambiente

### **Se IA não responder:**
1. Verifique configuração em `ai_agent_configs`
2. Confirme API key da OpenAI
3. Teste com `/api/test-new-ai-pipeline`

## 🎉 **Resultado Final**

O sistema agora tem um pipeline robusto que:
- **Processa todos os tipos de mídia** corretamente
- **Usa base de conhecimento** contextualizada
- **Envia respostas via WhatsApp** automaticamente
- **Tem fallback** para o sistema antigo
- **Logs detalhados** para debug
- **UI minimalista** para mídia

**Teste enviando uma mensagem real via WhatsApp e verifique os logs!** 🚀
