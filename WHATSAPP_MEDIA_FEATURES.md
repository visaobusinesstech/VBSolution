# 🎬 Funcionalidades de Mídia do WhatsApp - VBSolution

Este documento descreve as funcionalidades de envio e recebimento de mídia implementadas no sistema WhatsApp da VBSolution.

## ✨ Funcionalidades Implementadas

### 🎤 Gravação de Áudio
- **Interface visual** com timer de 2 minutos máximo
- **Botões de controle**: Iniciar, Pausar, Parar, Deletar
- **Preview do áudio** gravado com reprodução
- **Conversão automática** para formato OGG/Opus compatível com WhatsApp
- **Timer visual** mostrando progresso da gravação

### 🎥 Envio de Vídeo
- **Botão de clipe** (paperclip) para seleção de vídeos
- **Suporte a legendas** (caption) opcionais
- **Conversão automática** para formato MP4 otimizado
- **Redimensionamento** automático para resolução máxima do WhatsApp (720x1280)

### 📸 Envio de Imagens
- **Seleção de imagens** via botão de clipe
- **Suporte a legendas** (caption) opcionais
- **Envio direto** sem conversão necessária

### 📄 Envio de Documentos
- **Suporte a múltiplos formatos**: PDF, DOC, DOCX, TXT, XLSX, XLS
- **Envio direto** sem conversão

## 🛠️ Configuração Técnica

### Pré-requisitos
- **FFmpeg** instalado no servidor backend
- **Node.js** 18+ 
- **Supabase** configurado

### Instalação do FFmpeg

#### macOS
```bash
# Via Homebrew
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### CentOS/RHEL
```bash
sudo yum install epel-release
sudo yum install ffmpeg
```

#### Script Automático
```bash
# Execute o script de instalação automática
cd backend
./install-ffmpeg.sh
```

### Verificação da Instalação
```bash
# Verificar se FFmpeg está instalado
ffmpeg -version

# Verificar codecs necessários
ffmpeg -codecs | grep -E "(libopus|libx264)"
```

## 🔧 Configuração do Backend

### Endpoints de Mídia

#### Endpoint Otimizado (Recomendado)
```
POST /api/baileys-simple/send-media-optimized
```

**Parâmetros:**
- `file`: Arquivo de mídia (multipart/form-data)
- `connectionId`: ID da conexão WhatsApp
- `jid`: JID do chat de destino
- `type`: Tipo de mídia (image, video, audio, document)
- `caption`: Legenda opcional

**Recursos:**
- ✅ Conversão automática FFmpeg
- ✅ Otimização para WhatsApp
- ✅ Limpeza de arquivos temporários
- ✅ Salvamento no Supabase

#### Endpoint Original
```
POST /api/baileys-simple/send-media
```

**Recursos:**
- ✅ Envio direto sem conversão
- ✅ Salvamento no Supabase

### Conversões Automáticas

#### Áudio
- **Formato de entrada**: Qualquer formato suportado pelo FFmpeg
- **Formato de saída**: OGG com codec Opus
- **Configurações**:
  - Canais: 1 (mono)
  - Sample rate: 48kHz
  - Bitrate: 64kbps
  - Flags: `avoid_negative_ts make_zero`

#### Vídeo
- **Formato de entrada**: Qualquer formato suportado pelo FFmpeg
- **Formato de saída**: MP4 com codec H.264
- **Configurações**:
  - Resolução máxima: 720x1280
  - Qualidade: CRF 23
  - Codec de áudio: AAC 128kbps
  - Flags: `movflags +faststart`

## 🎨 Interface do Usuário

### Componente AudioRecorder
```tsx
<AudioRecorder
  onRecordingComplete={(audioBlob) => {
    // Callback quando áudio é gravado
  }}
  onCancel={() => {
    // Callback quando gravação é cancelada
  }}
  maxDuration={120} // 2 minutos
  className="w-full"
/>
```

### Estados da Interface
1. **Inicial**: Botão "Iniciar Gravação"
2. **Gravando**: Timer, botões Pausar/Parar/Deletar
3. **Preview**: Áudio gravado com botões Reproduzir/Enviar/Deletar

### Botões de Mídia
- **🎤 Áudio**: Inicia gravação com interface visual
- **📷 Imagem**: Seleção de arquivo com preview
- **🎥 Vídeo**: Seleção de arquivo com opção de legenda
- **📎 Documento**: Seleção de arquivo direta

## 📊 Salvamento no Supabase

### Tabela: whatsapp_mensagens
```sql
CREATE TABLE whatsapp_mensagens (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  connection_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'IMAGEM', 'VIDEO', 'AUDIO', 'ARQUIVO'
  media_type TEXT, -- MIME type do arquivo
  media_url TEXT, -- URL ou hash da mídia
  media_mime TEXT, -- MIME type final
  conteudo TEXT, -- Legenda/caption
  remetente TEXT NOT NULL, -- 'ATENDENTE', 'CLIENTE'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- outros campos...
);
```

### Dados Salvos
- ✅ **Metadados da mensagem**: ID, tipo, remetente, timestamp
- ✅ **Informações de mídia**: MIME type, tamanho, duração
- ✅ **Conteúdo**: Legenda/caption se fornecida
- ✅ **Contexto**: Conexão, chat, proprietário

## 🚀 Como Usar

### 1. Envio de Áudio
1. Clique no botão de microfone 🎤
2. Interface de gravação aparece
3. Clique em "Iniciar Gravação"
4. Use os controles: Pausar, Parar, Deletar
5. Preview do áudio gravado
6. Clique em "Enviar"

### 2. Envio de Vídeo
1. Clique no botão de clipe 📎
2. Selecione "Vídeo"
3. Escolha o arquivo de vídeo
4. Adicione legenda (opcional)
5. Arquivo é convertido e enviado automaticamente

### 3. Envio de Imagem
1. Clique no botão de clipe 📎
2. Selecione "Foto"
3. Escolha a imagem
4. Imagem é enviada diretamente

## 🔍 Troubleshooting

### FFmpeg não encontrado
```bash
# Verificar instalação
which ffmpeg

# Reinstalar se necessário
./backend/install-ffmpeg.sh
```

### Erro de conversão
- Verificar permissões de escrita no diretório de uploads
- Verificar espaço em disco disponível
- Verificar se o arquivo de entrada é válido

### Áudio não reproduz
- Verificar se o codec Opus está disponível
- Verificar se o arquivo foi convertido corretamente
- Verificar logs do backend para erros de conversão

### Vídeo não reproduz
- Verificar se o codec H.264 está disponível
- Verificar se o arquivo foi convertido corretamente
- Verificar se a resolução está dentro dos limites

## 📝 Logs e Debug

### Backend
```javascript
// Logs de conversão FFmpeg
console.log('🔄 Executando conversão FFmpeg:', command);
console.log('✅ Áudio convertido com sucesso');
console.log('⚠️ FFmpeg não disponível, usando arquivo original');
```

### Frontend
```javascript
// Logs de gravação
console.log('🎤 Iniciando gravação de áudio');
console.log('⏹️ Parando gravação');
console.log('📤 Enviando áudio gravado');
```

## 🎯 Próximos Passos

- [ ] Suporte a stickers
- [ ] Suporte a localização
- [ ] Suporte a contatos
- [ ] Compressão inteligente de imagens
- [ ] Preview de vídeo antes do envio
- [ ] Edição básica de áudio (cortar, normalizar)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do backend
2. Verificar se FFmpeg está instalado
3. Verificar permissões de arquivo
4. Contatar equipe de desenvolvimento

---

**Desenvolvido para VBSolution CRM** 🚀
