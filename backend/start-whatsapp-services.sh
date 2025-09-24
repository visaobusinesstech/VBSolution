#!/bin/bash

echo "🚀 Iniciando Serviços WhatsApp VB Solution CRM"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Porta $1 já está em uso${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Porta $1 disponível${NC}"
        return 0
    fi
}

# Função para matar processo em uma porta
kill_port() {
    echo -e "${YELLOW}🔄 Parando processo na porta $1...${NC}"
    lsof -ti:$1 | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Parar serviços existentes
echo -e "${BLUE}🔄 Parando serviços existentes...${NC}"
kill_port 3000  # Baileys server
kill_port 3001  # Conversations API
kill_port 3002  # Realtime service

# Verificar portas
echo -e "${BLUE}🔍 Verificando portas...${NC}"
check_port 3000
check_port 3001
check_port 3002

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependências...${NC}"
    npm install
fi

# Iniciar Baileys Server
echo -e "${BLUE}🚀 Iniciando Baileys Server (porta 3000)...${NC}"
node simple-baileys-server.js &
BAILEYS_PID=$!
echo "Baileys PID: $BAILEYS_PID"

# Aguardar um pouco
sleep 3

# Iniciar Conversations API
echo -e "${BLUE}🚀 Iniciando Conversations API (porta 3001)...${NC}"
node whatsapp-conversations-api.js &
CONVERSATIONS_PID=$!
echo "Conversations PID: $CONVERSATIONS_PID"

# Aguardar um pouco
sleep 3

# Iniciar Realtime Service
echo -e "${BLUE}🚀 Iniciando Realtime Service (porta 3002)...${NC}"
node whatsapp-realtime.js &
REALTIME_PID=$!
echo "Realtime PID: $REALTIME_PID"

# Aguardar serviços iniciarem
sleep 5

# Verificar se os serviços estão rodando
echo -e "${BLUE}🔍 Verificando status dos serviços...${NC}"

# Verificar Baileys
if curl -s http://localhost:3000/api/baileys-simple/health > /dev/null; then
    echo -e "${GREEN}✅ Baileys Server: ONLINE${NC}"
else
    echo -e "${RED}❌ Baileys Server: OFFLINE${NC}"
fi

# Verificar Conversations API
if curl -s http://localhost:3001/api/whatsapp/health > /dev/null; then
    echo -e "${GREEN}✅ Conversations API: ONLINE${NC}"
else
    echo -e "${RED}❌ Conversations API: OFFLINE${NC}"
fi

# Verificar Realtime Service
if curl -s http://localhost:3002/api/whatsapp-realtime/health > /dev/null; then
    echo -e "${GREEN}✅ Realtime Service: ONLINE${NC}"
else
    echo -e "${RED}❌ Realtime Service: OFFLINE${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Serviços WhatsApp iniciados com sucesso!${NC}"
echo ""
echo -e "${BLUE}📱 Endpoints disponíveis:${NC}"
echo "   • Baileys Server: http://localhost:3000"
echo "   • Conversations API: http://localhost:3001"
echo "   • Realtime Service: http://localhost:3002"
echo ""
echo -e "${BLUE}🔧 PIDs dos processos:${NC}"
echo "   • Baileys: $BAILEYS_PID"
echo "   • Conversations: $CONVERSATIONS_PID"
echo "   • Realtime: $REALTIME_PID"
echo ""
echo -e "${YELLOW}💡 Para parar os serviços, use: pkill -f 'node.*whatsapp'${NC}"
echo ""

# Salvar PIDs em arquivo para facilitar o gerenciamento
echo "$BAILEYS_PID" > .baileys.pid
echo "$CONVERSATIONS_PID" > .conversations.pid
echo "$REALTIME_PID" > .realtime.pid

echo -e "${GREEN}✅ PIDs salvos em .baileys.pid, .conversations.pid, .realtime.pid${NC}"
