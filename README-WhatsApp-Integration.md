# VBSolutionCRM - Integração WhatsApp

## 📋 Resumo do Projeto

Este projeto implementa uma integração completa do WhatsApp com o sistema CRM VBSolution, utilizando a biblioteca Baileys para automação do WhatsApp Web.

## 🚀 Funcionalidades Implementadas

### ✅ Conexões WhatsApp
- **WhatsApp Baileys**: Conexão via QR Code com persistência de credenciais
- **WhatsApp Cloud API**: Integração com API oficial do Meta
- **Webhooks**: Sistema de webhooks para receber mensagens

### ✅ Interface de Usuário
- **Página de Configurações**: Gerenciamento de conexões WhatsApp
- **Página WhatsApp**: Visualização de conversas e mensagens
- **Modal QR Code**: Geração e exibição de QR codes para conexão
- **Teste de Webhook**: Botão para testar webhooks com feedback visual

### ✅ Funcionalidades de Chat
- **Lista de Conversas**: Exibição de chats com status de leitura
- **Janela de Chat**: Interface para visualizar e enviar mensagens
- **Status de Mensagens**: Indicadores visuais de entrega e leitura
- **Filtros**: Filtros por tipo (Todas, Não lidas, Grupos)

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** com Express
- **Baileys** para WhatsApp Web API
- **Prisma** para ORM
- **Socket.IO** para comunicação em tempo real
- **QRCode** para geração de QR codes

### Frontend
- **React** com TypeScript
- **Vite** para build
- **shadcn/ui** para componentes
- **Lucide React** para ícones
- **Zustand** para gerenciamento de estado

## 📁 Estrutura do Projeto

```
VBSolutionCRM-master/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── baileys-simple.service.ts    # Serviço principal do Baileys
│   │   │   └── baileys.service.ts           # Serviço original
│   │   ├── controllers/
│   │   │   ├── baileys-simple.controller.ts # Controller simplificado
│   │   │   └── baileys.controller.ts        # Controller original
│   │   ├── routes/
│   │   │   └── baileys-simple.routes.ts     # Rotas da API
│   │   └── app.ts                           # Configuração do Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Settings.tsx                 # Página de configurações
│   │   │   └── WhatsAppPage.tsx             # Página principal do WhatsApp
│   │   ├── components/
│   │   │   ├── WhatsAppChatList.tsx         # Lista de conversas
│   │   │   ├── WhatsAppChatWindow.tsx       # Janela de chat
│   │   │   └── QRModal.tsx                  # Modal do QR code
│   │   ├── contexts/
│   │   │   └── ConnectionsContext.tsx       # Contexto de conexões
│   │   └── hooks/
│   │       └── useConnections.ts            # Hook para conexões
│   └── package.json
└── README-WhatsApp-Integration.md
```

## 🚀 Como Executar

### 1. Instalar Dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` no diretório `backend/` com:

```env
PORT=3000
DATABASE_URL="file:./dev.db"
NODE_ENV=development
```

### 3. Executar o Projeto

```bash
# Terminal 1 - Backend
cd backend
npx tsx src/server.ts

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 📱 Como Usar

### 1. Configurar Conexão WhatsApp

1. Acesse **Configurações** → **Conexões**
2. Clique em **Conectar WhatsApp** (Baileys)
3. Escaneie o QR Code com seu WhatsApp
4. Aguarde a confirmação "Conectado com Sucesso!"

### 2. Visualizar Conversas

1. Acesse a página **WhatsApp**
2. Visualize a lista de conversas
3. Clique em uma conversa para abrir
4. Envie e receba mensagens

### 3. Testar Webhook

1. Em **Configurações** → **Conexões**
2. Clique em **Testar Webhook**
3. Verifique se recebeu a confirmação verde

## 🔧 API Endpoints

### Conexões
- `POST /api/baileys-simple/connections` - Criar conexão
- `GET /api/baileys-simple/connections` - Listar conexões
- `GET /api/baileys-simple/connections/:id` - Obter conexão
- `GET /api/baileys-simple/connections/:id/qr` - Obter QR code
- `DELETE /api/baileys-simple/connections/:id` - Deletar conexão

### Chats e Mensagens
- `GET /api/baileys-simple/connections/:id/chats` - Listar chats
- `GET /api/baileys-simple/connections/:id/chats/:chatId/messages` - Obter mensagens
- `POST /api/baileys-simple/connections/:id/chats/:chatId/messages` - Enviar mensagem

## 🐛 Solução de Problemas

### QR Code não aparece
- Verifique se o backend está rodando na porta 3000
- Confirme se não há erros no console do backend
- Teste a API diretamente: `curl http://localhost:3000/api/baileys-simple/connections`

### Conexão não estabelece
- Verifique se o QR code foi escaneado corretamente
- Aguarde alguns segundos para a confirmação
- Verifique os logs do backend para erros

### Frontend não carrega
- Confirme se o frontend está rodando na porta 5173
- Verifique se não há erros no console do navegador
- Teste: `curl http://localhost:5173`

## 📝 Notas Importantes

1. **Sessões de Autenticação**: As credenciais do WhatsApp são salvas em `backend/auth_sessions/`
2. **Timeout**: O sistema tem timeout de 60 segundos para conexões
3. **Persistência**: As conexões são mantidas entre reinicializações
4. **Logs**: Verifique os logs do backend para debugging

## 🔄 Próximos Passos

- [ ] Implementar sincronização de histórico de mensagens
- [ ] Adicionar suporte a mídias (imagens, documentos)
- [ ] Implementar notificações em tempo real
- [ ] Adicionar suporte a grupos
- [ ] Implementar backup de conversas

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Logs do backend no terminal
2. Console do navegador (F12)
3. Status das conexões na página de configurações

---

**Desenvolvido com ❤️ para VBSolutionCRM**

