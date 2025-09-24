# 🔐 Configuração OAuth para Integrações - VBSolution CRM

## 📋 Visão Geral

Este documento fornece instruções detalhadas para configurar as credenciais OAuth necessárias para as integrações com Google, Facebook e Instagram no VBSolution CRM.

## 🔑 Google OAuth Configuration

### **1. Criar Projeto no Google Cloud Console**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar um projeto" → "Novo projeto"
3. Nome do projeto: `VBSolution CRM`
4. Clique em "Criar"

### **2. Habilitar APIs Necessárias**

1. No menu lateral, vá para "APIs e Serviços" → "Biblioteca"
2. Habilite as seguintes APIs:
   - **Google Calendar API**
   - **Gmail API**
   - **Google Drive API**
   - **Google Sheets API**
   - **Google Meet API**

### **3. Configurar Tela de Consentimento**

1. Vá para "APIs e Serviços" → "Tela de consentimento"
2. Selecione "Externo" (para usuários fora da organização)
3. Preencha as informações obrigatórias:
   - **Nome do aplicativo**: VBSolution CRM
   - **Email de suporte**: seu-email@empresa.com
   - **Domínio do desenvolvedor**: seu-dominio.com
4. Adicione escopos:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/drive.file`
5. Adicione usuários de teste (opcional para desenvolvimento)

### **4. Criar Credenciais OAuth**

1. Vá para "APIs e Serviços" → "Credenciais"
2. Clique em "Criar credenciais" → "ID do cliente OAuth 2.0"
3. Selecione "Aplicação da Web"
4. Configure:
   - **Nome**: VBSolution CRM Integration
   - **URIs de redirecionamento autorizados**:
     ```
     http://localhost:5173/auth/google/callback
     https://seu-dominio.com/auth/google/callback
     ```

### **5. Obter Credenciais**

1. Após criar, você receberá:
   - **Client ID**: `seu-google-client-id`
   - **Client Secret**: `seu-google-client-secret`
2. Copie essas credenciais para o arquivo `.env`

---

## 📘 Meta (Facebook/Instagram) OAuth Configuration

### **1. Criar App no Meta for Developers**

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Clique em "Meus Apps" → "Criar App"
3. Selecione "Consumidor" ou "Empresa"
4. Preencha:
   - **Nome do aplicativo**: VBSolution CRM
   - **Email de contato**: seu-email@empresa.com
5. Clique em "Criar App"

### **2. Adicionar Produtos**

1. No painel do app, adicione os produtos:
   - **Facebook Login**
   - **Instagram Basic Display** (se necessário)
   - **Instagram Graph API** (se necessário)
   - **Pages**

### **3. Configurar Facebook Login**

1. Vá para "Facebook Login" → "Configurações"
2. Adicione URIs de redirecionamento OAuth válidos:
   ```
   http://localhost:5173/auth/meta/callback
   https://seu-dominio.com/auth/meta/callback
   ```
3. Salve as alterações

### **4. Configurar Permissões**

1. Vá para "App Review" → "Permissões e recursos"
2. Solicite as seguintes permissões:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_manage_engagement`
   - `pages_messaging`
   - `pages_show_list`
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`
   - `instagram_manage_messages`

### **5. Configurar Domínios do App**

1. Vá para "Configurações" → "Básico"
2. Adicione domínios do app:
   ```
   localhost
   seu-dominio.com
   ```

### **6. Obter Credenciais**

1. Vá para "Configurações" → "Básico"
2. Copie:
   - **ID do aplicativo**: `seu-meta-client-id`
   - **Chave secreta do aplicativo**: `seu-meta-client-secret`
3. Adicione essas credenciais ao arquivo `.env`

### **7. Configurar Instagram (se necessário)**

1. Vá para "Produtos" → "Instagram Basic Display"
2. Configure:
   - **URIs de redirecionamento OAuth válidos**:
     ```
     http://localhost:5173/auth/instagram/callback
     https://seu-dominio.com/auth/instagram/callback
     ```
3. Adicione usuários de teste

---

## ⚙️ Configuração do Backend

### **1. Arquivo .env**

Crie ou atualize o arquivo `.env` no diretório `backend/`:

```env
# Configurações básicas
NODE_ENV=development
PORT=3000
WEB_ORIGIN=http://localhost:5173

# Criptografia
ENCRYPTION_SECRET_KEY=your-super-secret-encryption-key-change-in-production-256-bits

# Google OAuth
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Meta OAuth
META_CLIENT_ID=seu-meta-client-id
META_CLIENT_SECRET=seu-meta-client-secret
META_REDIRECT_URI=http://localhost:5173/auth/meta/callback

# Webhooks
WEBHOOK_BASE_URL=https://seu-dominio.com
WEBHOOK_SECRET=your-webhook-secret-key
```

### **2. Gerar Chave de Criptografia**

Para gerar uma chave de criptografia segura:

```bash
# No terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ou use um gerador online seguro.

### **3. Verificar Configuração**

Execute o comando para verificar se as variáveis estão configuradas:

```bash
cd backend
npm run dev
```

Verifique os logs para confirmar que as credenciais foram carregadas corretamente.

---

## 🌐 Configuração do Frontend

### **1. Variáveis de Ambiente**

Crie o arquivo `.env.local` no diretório `frontend/`:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=seu-google-client-id
VITE_META_CLIENT_ID=seu-meta-client-id
```

### **2. Configurar Rotas de Callback**

As rotas de callback já estão implementadas nos modais de integração:
- `/auth/google/callback`
- `/auth/meta/callback`

---

## 🧪 Testando as Integrações

### **1. Teste do Google**

1. Inicie o backend: `cd backend && npm run dev`
2. Inicie o frontend: `cd frontend && npm run dev`
3. Acesse a página de Conexões
4. Clique em "Conectar" no card do Google
5. Complete o fluxo OAuth
6. Verifique se a integração aparece como conectada

### **2. Teste do Facebook/Instagram**

1. Siga os mesmos passos do teste do Google
2. Use o card do Facebook ou Instagram
3. Complete o fluxo OAuth
4. Verifique se as páginas/perfis são listados corretamente

### **3. Verificar Logs**

Monitore os logs do backend para verificar:
- Tokens sendo salvos com sucesso
- Permissões sendo concedidas
- Operações de API funcionando

---

## 🚨 Solução de Problemas

### **Erros Comuns**

#### **"redirect_uri_mismatch"**
- Verifique se as URIs de redirecionamento estão configuradas corretamente
- Certifique-se de que não há espaços extras ou caracteres especiais
- Use HTTP para desenvolvimento local, HTTPS para produção

#### **"invalid_client"**
- Verifique se o Client ID e Client Secret estão corretos
- Confirme se as credenciais foram copiadas completamente
- Verifique se o app está ativo no console do desenvolvedor

#### **"access_denied"**
- O usuário negou as permissões
- Verifique se as permissões solicitadas estão aprovadas
- Para desenvolvimento, adicione usuários de teste

#### **"scope_not_granted"**
- Verifique se todos os escopos necessários estão configurados
- Confirme se o usuário tem permissões adequadas
- Para Facebook, verifique se as páginas pertencem ao usuário

### **Debug de Tokens**

Use as seguintes ferramentas para debugar tokens:

#### **Google**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://www.googleapis.com/oauth2/v1/userinfo"
```

#### **Meta**
```bash
curl -X GET \
  "https://graph.facebook.com/me?access_token=YOUR_ACCESS_TOKEN"
```

---

## 📚 Recursos Adicionais

### **Documentação Oficial**

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login/)
- [Instagram Basic Display](https://developers.facebook.com/docs/instagram-basic-display-api/)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)

### **Ferramentas de Teste**

- [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Postman Collections](https://documenter.getpostman.com/view/1234567/Google-Calendar-API)

### **Suporte**

- **Google**: [Google Cloud Support](https://cloud.google.com/support)
- **Meta**: [Meta for Developers Support](https://developers.facebook.com/support/)
- **VBSolution**: security@vbsolution.com

---

**Última atualização**: 23 de Janeiro de 2025
**Versão**: 1.0
**Responsável**: Equipe de Desenvolvimento VBSolution
