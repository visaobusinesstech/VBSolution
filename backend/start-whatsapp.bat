@echo off
REM Script de Inicialização do WhatsApp para Windows
REM Este script funciona em qualquer sistema Windows

REM Obter o diretório do script
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Verificar se estamos no diretório correto
if not exist "persistent-baileys-server.js" (
    echo ❌ Arquivo persistent-baileys-server.js não encontrado!
    echo ❌ Execute este script no diretório backend/
    pause
    exit /b 1
)

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não está instalado!
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo ⚠️ Instalando dependências...
    npm install
)

REM Verificar se o arquivo de configuração existe
if not exist "env.supabase" (
    echo ❌ Arquivo env.supabase não encontrado!
    pause
    exit /b 1
)

REM Parar processos existentes na porta 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Criar diretórios necessários
if not exist "auth_info" mkdir auth_info
if not exist "backups" mkdir backups
if not exist "logs" mkdir logs

echo 🚀 Iniciando WhatsApp Baileys Server...
echo 📁 Diretório: %SCRIPT_DIR%
echo 🌐 URL: http://localhost:3000

REM Iniciar o servidor
node persistent-baileys-server.js

pause
