#!/bin/bash

# Script de Inicialização Adaptável do WhatsApp
# Este script funciona em qualquer sistema e localização

# Obter o diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verificar se estamos no diretório correto
if [ ! -f "persistent-baileys-server.js" ]; then
    echo "❌ Arquivo persistent-baileys-server.js não encontrado!"
    echo "❌ Execute este script no diretório backend/"
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "⚠️ Instalando dependências..."
    npm install
fi

# Verificar se o arquivo de configuração existe
if [ ! -f "env.supabase" ]; then
    echo "❌ Arquivo env.supabase não encontrado!"
    exit 1
fi

# Parar processos existentes na porta 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️ Parando processo existente na porta 3000..."
    pkill -f "persistent-baileys-server.js" || true
    sleep 2
fi

# Criar diretórios necessários
mkdir -p auth_info backups logs

echo "🚀 Iniciando WhatsApp Baileys Server..."
echo "📁 Diretório: $SCRIPT_DIR"
echo "🌐 URL: http://localhost:3000"

# Iniciar o servidor
node persistent-baileys-server.js
