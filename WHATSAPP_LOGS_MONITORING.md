# 📊 Monitoramento de Logs do Sistema WhatsApp

Este guia explica como monitorar os logs detalhados do sistema de captura de informações de perfis WhatsApp.

## 🚀 Como Iniciar com Logs Detalhados

### Opção 1: Script Automatizado (Recomendado)
```bash
# Executar o script com logs coloridos
./start-whatsapp-with-logs.sh
```

### Opção 2: Manual
```bash
# Navegar para o backend
cd backend

# Instalar dependências (se necessário)
npm install

# Iniciar com logs detalhados
NODE_ENV=development DEBUG=whatsapp:* node simple-baileys-server.js
```

## 📋 Logs Importantes a Observar

### 🔍 [CONTACT-EXTRACTOR] - Extração de Informações
```
🔍 [CONTACT-EXTRACTOR] ===== INICIANDO EXTRAÇÃO COMPLETA =====
🔍 [CONTACT-EXTRACTOR] Chat ID: 5511999999999@s.whatsapp.net
🔍 [CONTACT-EXTRACTOR] Socket disponível: true
🔍 [CONTACT-EXTRACTOR] Store disponível: true
```

### 🏢 [BUSINESS-INFO] - Informações de Negócio
```
🔍 [BUSINESS-INFO] Verificando se é negócio...
🔄 [BUSINESS-INFO] Buscando perfil de negócio com retry...
✅ [BUSINESS-INFO] Perfil de negócio encontrado!
📊 [BUSINESS-INFO] Dados do negócio: {
  business_name: "Empresa Teste",
  description: "Descrição da empresa...",
  category: "TECHNOLOGY",
  verified: true
}
```

### 👥 [GROUP-INFO] - Informações de Grupos
```
🔍 [GROUP-INFO] Extraindo informações do grupo...
🔄 [GROUP-INFO] Buscando metadados do grupo...
✅ [GROUP-INFO] Metadados do grupo encontrados!
📊 [GROUP-INFO] Dados do grupo: {
  subject: "Grupo de Teste",
  participants: 5,
  owner: "5511999999999@s.whatsapp.net"
}
```

### 💾 [DATABASE] - Salvamento no Banco
```
💾 [DATABASE] ===== SALVANDO MENSAGEM NO BANCO DE DADOS =====
💾 [DATABASE] Dados principais: {
  chat_id: "5511999999999@s.whatsapp.net",
  wpp_name: "João Silva",
  whatsapp_is_group: false,
  whatsapp_business_name: "Empresa Teste"
}
✅ [DATABASE] Mensagem salva com sucesso no Supabase
```

### 📨 [MENSAGENS] - Processamento de Mensagens
```
📨 ===== MENSAGENS RECEBIDAS =====
📨 Conexão: gui-teste
📨 Total de mensagens: 1
📨 ===== MENSAGEM 1/1 =====
📨 ID: 3EB0C767D25B4D8B2A5F
📨 De: 5511999999999@s.whatsapp.net
📨 Tipo: TEXTO
📝 [TEXTO] Conteúdo: Olá! Como posso ajudar?
```

## 🧪 Testando o Sistema

### 1. Verificar Status do Backend
```bash
curl http://localhost:3001/api/baileys-simple/health
```

### 2. Executar Teste de Logs
```bash
node test-logs-whatsapp.js
```

### 3. Sincronizar Perfis Manualmente
```bash
# Sincronização completa
curl -X POST http://localhost:3001/api/whatsapp-profile/SUA_CONEXAO/sync-all \
  -H "Content-Type: application/json" \
  -d '{"userId": "SEU_USER_ID"}'

# Sincronizar contato específico
curl -X POST http://localhost:3001/api/whatsapp-profile/SUA_CONEXAO/sync-contact \
  -H "Content-Type: application/json" \
  -d '{"userId": "SEU_USER_ID", "chatId": "5511999999999@s.whatsapp.net"}'
```

### 4. Verificar Status da Sincronização
```bash
curl http://localhost:3001/api/whatsapp-profile/SUA_CONEXAO/sync-status
```

### 5. Listar Grupos
```bash
curl http://localhost:3001/api/whatsapp-profile/SUA_CONEXAO/groups
```

## 🔍 O que Observar nos Logs

### ✅ Sinais de Funcionamento Correto
- `[CONTACT-EXTRACTOR]` aparece para cada mensagem
- `[BUSINESS-INFO]` mostra informações de negócio quando disponível
- `[GROUP-INFO]` mostra informações de grupos quando aplicável
- `[DATABASE]` confirma salvamento no banco
- `✅` indica sucesso nas operações

### ⚠️ Sinais de Problemas
- `❌` indica erros que precisam ser investigados
- `⚠️` indica avisos que podem afetar funcionalidade
- Timeouts ou falhas de conexão
- Erros de banco de dados

### 📊 Dados Capturados
- **Nome real** do contato (não apenas pushName)
- **Foto de perfil** (URL da imagem)
- **Informações de negócio** (nome, descrição, categoria, etc.)
- **Informações de grupo** (nome, participantes, administradores)
- **Status de presença** (online/offline, última vez visto)
- **Dados brutos** completos do WhatsApp

## 🛠️ Troubleshooting

### Backend Não Inicia
```bash
# Verificar se a porta está livre
lsof -i :3001

# Matar processo se necessário
kill -9 $(lsof -t -i:3001)
```

### Logs Não Aparecem
```bash
# Verificar se o arquivo existe
ls -la backend/simple-baileys-server.js

# Verificar permissões
chmod +x start-whatsapp-with-logs.sh
```

### Erro de Conexão com Supabase
```bash
# Verificar variáveis de ambiente
cat backend/env.supabase

# Testar conexão
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('SUA_URL', 'SUA_CHAVE');
supabase.from('contacts').select('count').then(console.log);
"
```

## 📈 Monitoramento em Produção

### Logs Estruturados
Os logs seguem um padrão estruturado que facilita o monitoramento:

```
[CATEGORIA] [AÇÃO] [DETALHES]
```

### Categorias Principais
- `CONTACT-EXTRACTOR` - Extração de informações
- `BUSINESS-INFO` - Informações de negócio
- `GROUP-INFO` - Informações de grupos
- `DATABASE` - Operações de banco
- `PROFILE-SYNC` - Sincronização de perfis
- `MENSAGENS` - Processamento de mensagens

### Métricas Importantes
- Número de contatos processados
- Taxa de sucesso na extração de informações
- Tempo de resposta das APIs do WhatsApp
- Erros de conexão ou timeout

## 🎯 Próximos Passos

1. **Monitorar logs** durante o uso normal
2. **Identificar padrões** de erro ou sucesso
3. **Ajustar timeouts** se necessário
4. **Implementar alertas** para erros críticos
5. **Otimizar performance** baseado nos logs

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs detalhados
2. Executar scripts de teste
3. Verificar conectividade com Supabase
4. Consultar documentação da API do WhatsApp Business
