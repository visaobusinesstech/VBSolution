#!/bin/bash

# Script de Inicialização do WhatsApp com Persistência Robusta
# Este script garante que o sistema sempre funcione corretamente

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                WHATSAPP PERSISTENCE SYSTEM                   ║"
echo "║                    Sistema Robusto v2.0                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [ ! -f "persistent-baileys-server.js" ]; then
    error "Arquivo persistent-baileys-server.js não encontrado!"
    error "Execute este script no diretório backend/"
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado!"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    error "npm não está instalado!"
    exit 1
fi

log "Verificando dependências..."

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    warning "Dependências não encontradas. Instalando..."
    npm install
    if [ $? -eq 0 ]; then
        success "Dependências instaladas com sucesso!"
    else
        error "Falha ao instalar dependências!"
        exit 1
    fi
fi

# Verificar se o arquivo de configuração existe
if [ ! -f "env.supabase" ]; then
    error "Arquivo env.supabase não encontrado!"
    error "Crie o arquivo com as configurações do Supabase"
    exit 1
fi

log "Verificando conectividade com Supabase..."

# Testar conexão com Supabase
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
supabase.from('whatsapp_sessions').select('count').limit(1).then(() => {
    console.log('✅ Conexão com Supabase OK');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erro de conexão com Supabase:', err.message);
    process.exit(1);
});
"

if [ $? -ne 0 ]; then
    error "Falha na conexão com Supabase!"
    error "Verifique as configurações em env.supabase"
    exit 1
fi

# Criar backup antes de iniciar
log "Criando backup de segurança..."
node backup-whatsapp-config.js create
if [ $? -eq 0 ]; then
    success "Backup criado com sucesso!"
else
    warning "Falha ao criar backup, mas continuando..."
fi

# Verificar se há processos rodando na porta 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    warning "Porta 3000 já está em uso. Tentando parar processo existente..."
    pkill -f "persistent-baileys-server.js" || true
    sleep 2
    
    # Verificar novamente
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        error "Não foi possível liberar a porta 3000!"
        error "Pare manualmente o processo que está usando a porta 3000"
        exit 1
    fi
fi

# Criar diretórios necessários
log "Criando diretórios necessários..."
mkdir -p auth_info
mkdir -p backups
mkdir -p logs

# Definir variáveis de ambiente
export NODE_ENV=production
export PORT=3000

# Função para limpeza ao sair
cleanup() {
    log "Parando servidor..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    success "Servidor parado com sucesso!"
    exit 0
}

# Capturar sinais de interrupção
trap cleanup SIGINT SIGTERM

# Iniciar servidor
log "Iniciando WhatsApp Baileys Server com persistência robusta..."
node persistent-baileys-server.js &
SERVER_PID=$!

# Aguardar um pouco para verificar se o servidor iniciou
sleep 3

# Verificar se o servidor está rodando
if kill -0 $SERVER_PID 2>/dev/null; then
    success "Servidor iniciado com sucesso! (PID: $SERVER_PID)"
    
    # Testar endpoint de health
    sleep 2
    if curl -s http://localhost:3000/api/baileys-simple/health > /dev/null; then
        success "Servidor respondendo corretamente!"
        log "API disponível em: http://localhost:3000/api"
        log "Health check: http://localhost:3000/api/baileys-simple/health"
        log "Socket.IO ativo para tempo real"
        log "Sistema de persistência robusta ativado"
        log ""
        log "Pressione Ctrl+C para parar o servidor"
        
        # Aguardar o servidor
        wait $SERVER_PID
    else
        error "Servidor não está respondendo!"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
else
    error "Falha ao iniciar o servidor!"
    exit 1
fi
