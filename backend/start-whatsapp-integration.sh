#!/bin/bash

# Script de Inicialização da Integração WhatsApp + Supabase
# VBSolution CRM

echo "🚀 Iniciando Integração WhatsApp + Supabase..."
echo "=============================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

# Verificar se o arquivo .env.supabase existe
if [ ! -f ".env.supabase" ]; then
    echo "⚠️  Arquivo .env.supabase não encontrado."
    echo "📝 Criando arquivo de exemplo..."
    cp .env.supabase.example .env.supabase
    echo "✅ Arquivo .env.supabase criado. Por favor, configure as variáveis de ambiente."
    echo "📋 Edite o arquivo .env.supabase com suas credenciais do Supabase:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Depois execute este script novamente."
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências."
        exit 1
    fi
    echo "✅ Dependências instaladas com sucesso."
fi

# Verificar se o TypeScript está compilado
if [ ! -d "dist" ]; then
    echo "🔨 Compilando TypeScript..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao compilar TypeScript."
        exit 1
    fi
    echo "✅ TypeScript compilado com sucesso."
fi

# Criar diretórios necessários
echo "📁 Criando diretórios necessários..."
mkdir -p auth_sessions
mkdir -p logs
mkdir -p uploads
echo "✅ Diretórios criados."

# Verificar se a porta está disponível
PORT=${PORT:-3001}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Porta $PORT já está em uso."
    echo "🔄 Tentando parar processo existente..."
    pkill -f "node.*server.js" || true
    sleep 2
fi

# Iniciar o servidor
echo "🚀 Iniciando servidor..."
echo "📊 Porta: $PORT"
echo "🌍 Ambiente: ${NODE_ENV:-development}"
echo ""

# Executar o servidor
if [ "$1" = "--dev" ]; then
    echo "🔧 Modo desenvolvimento ativado..."
    npm run dev
else
    echo "🏭 Modo produção ativado..."
    npm start
fi
