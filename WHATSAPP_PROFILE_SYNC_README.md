# Sistema de Sincronização de Perfis WhatsApp

Este sistema implementa a captura e sincronização completa de informações de perfis do WhatsApp, incluindo grupos e informações de negócio.

## 🚀 Funcionalidades Implementadas

### 1. Captura de Informações de Grupos
- **`groupFetchAllParticipating()`**: Busca todos os grupos que o usuário participa
- Metadados completos do grupo (nome, descrição, proprietário, administradores)
- Lista de participantes e configurações do grupo
- Data de criação e configurações específicas

### 2. Captura de Informações de Negócio
- **`getBusinessProfile()`**: Busca perfil de negócio do WhatsApp
- Nome, descrição e categoria do negócio
- Email, website e endereço do negócio
- Status de verificação do negócio

### 3. Captura de Informações de Perfil
- Foto de perfil com retry automático
- Status de presença (online/offline)
- Status de bloqueio e silenciamento
- Última vez visto e status personalizado
- Dados brutos completos do WhatsApp

## 📊 Estrutura das Tabelas

### Tabela `contacts` - Novas Colunas

#### Informações de Grupos
- `whatsapp_is_group` - Se é um grupo
- `whatsapp_group_subject` - Nome do grupo
- `whatsapp_group_description` - Descrição do grupo
- `whatsapp_group_owner` - Proprietário do grupo
- `whatsapp_group_admins` - Lista de administradores (JSON)
- `whatsapp_group_participants` - Lista de participantes (JSON)
- `whatsapp_group_created` - Data de criação
- `whatsapp_group_settings` - Configurações do grupo (JSON)

#### Informações de Negócio
- `whatsapp_business_name` - Nome do negócio
- `whatsapp_business_description` - Descrição do negócio
- `whatsapp_business_category` - Categoria do negócio
- `whatsapp_business_email` - Email do negócio
- `whatsapp_business_website` - Website do negócio
- `whatsapp_business_address` - Endereço do negócio
- `whatsapp_verified` - Se é verificado

#### Informações de Status
- `whatsapp_online` - Se está online
- `whatsapp_blocked` - Se está bloqueado
- `whatsapp_muted` - Se está silenciado
- `whatsapp_pinned` - Se está fixado
- `whatsapp_archived` - Se está arquivado
- `whatsapp_status` - Status personalizado
- `whatsapp_last_seen` - Última vez visto

#### Dados Brutos
- `whatsapp_raw_data` - Dados brutos completos (JSON)
- `whatsapp_presence` - Informações de presença (JSON)

### Tabela `whatsapp_mensagens` - Novas Colunas

Todas as colunas acima também foram adicionadas à tabela `whatsapp_mensagens` para armazenar informações de perfil junto com as mensagens.

## 🔧 Como Usar

### 1. Aplicar Migração

```bash
# Executar migração das colunas
node apply-whatsapp-profile-migration.js
```

### 2. Testar Sistema

```bash
# Executar teste de sincronização
node test-whatsapp-profile-sync.js
```

### 3. Endpoints da API

#### Sincronização Completa
```bash
POST /api/whatsapp-profile/:connectionId/sync-all
{
  "userId": "uuid-do-usuario"
}
```

#### Sincronizar Contato Específico
```bash
POST /api/whatsapp-profile/:connectionId/sync-contact
{
  "userId": "uuid-do-usuario",
  "chatId": "5511999999999@s.whatsapp.net"
}
```

#### Status da Sincronização
```bash
GET /api/whatsapp-profile/:connectionId/sync-status
```

#### Listar Grupos
```bash
GET /api/whatsapp-profile/:connectionId/groups
```

## 🔄 Sincronização Automática

O sistema inclui sincronização automática que:

1. **Inicialização**: Quando uma conexão WhatsApp é estabelecida
2. **Processamento de Mensagens**: Captura informações de perfil a cada mensagem
3. **Sincronização em Background**: Executa periodicamente para manter dados atualizados

## 📱 Integração com Frontend

### Página de Conversas
As informações de perfil são automaticamente exibidas na página de conversas:
- Nome real do contato/grupo
- Foto de perfil
- Status de negócio (se aplicável)
- Informações de grupo (se aplicável)

### Página de Contatos
A página de contatos mostra:
- Informações completas do perfil WhatsApp
- Status de verificação
- Informações de negócio
- Participação em grupos

## 🛠️ Arquivos Principais

- `backend/contact-info-extractor.js` - Extrator de informações de contatos
- `backend/whatsapp-profile-sync.service.js` - Serviço de sincronização
- `backend/simple-baileys-server.js` - Servidor principal (modificado)
- `add_whatsapp_profile_columns.sql` - Migração das colunas
- `apply-whatsapp-profile-migration.js` - Script de aplicação da migração
- `test-whatsapp-profile-sync.js` - Script de teste

## 🔍 Monitoramento

O sistema inclui logs detalhados para monitoramento:
- `[PROFILE-SYNC]` - Sincronização de perfis
- `[GROUP-SYNC]` - Sincronização de grupos
- `[CONTACT-SYNC]` - Sincronização de contatos
- `[BUSINESS-INFO]` - Informações de negócio
- `[GROUP-INFO]` - Informações de grupos

## ⚡ Performance

- **Retry Logic**: Tentativas automáticas para APIs do WhatsApp
- **Rate Limiting**: Pausas entre requisições para evitar bloqueios
- **Cache**: Cache de informações para evitar requisições desnecessárias
- **Background Processing**: Processamento assíncrono para não bloquear o sistema

## 🔒 Segurança

- **RLS (Row Level Security)**: Isolamento de dados por usuário
- **Validação**: Validação de dados antes de salvar
- **Sanitização**: Limpeza de dados sensíveis
- **Logs Seguros**: Logs sem exposição de dados sensíveis

## 📈 Próximos Passos

1. **Sincronização Agendada**: Implementar sincronização automática periódica
2. **Interface de Configuração**: Adicionar configurações de sincronização
3. **Relatórios**: Relatórios de sincronização e estatísticas
4. **Notificações**: Notificações de mudanças de perfil
5. **Backup**: Sistema de backup das informações de perfil

## 🐛 Troubleshooting

### Erro de Conexão
```bash
# Verificar se o backend está rodando
curl http://localhost:3001/api/baileys-simple/health
```

### Erro de Migração
```bash
# Verificar estrutura das tabelas
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrbsocawokmihvxfcpso.supabase.co', 'sua-chave');
supabase.from('information_schema.columns').select('*').eq('table_name', 'contacts').then(console.log);
"
```

### Logs de Debug
```bash
# Ativar logs detalhados
DEBUG=whatsapp:* node backend/simple-baileys-server.js
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do sistema
2. Executar scripts de teste
3. Verificar estrutura das tabelas
4. Consultar documentação da API do WhatsApp Business
