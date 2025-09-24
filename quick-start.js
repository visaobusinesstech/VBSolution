#!/usr/bin/env node

/**
 * Quick Start - VBSolutionCRM com Baileys
 * Inicialização rápida que sempre inclui o Baileys
 * Funciona com qualquer comando de desenvolvimento
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

class QuickStart {
  constructor() {
    this.backendPath = path.join(__dirname, 'backend');
    this.frontendPath = path.join(__dirname, 'frontend');
    this.baileysProcess = null;
    this.isWindows = process.platform === 'win32';
  }

  /**
   * Verificar se o Baileys está rodando
   */
  async isBaileysRunning() {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000/api/baileys-simple/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.success === true);
          } catch {
            resolve(false);
          }
        });
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Iniciar Baileys em background
   */
  async startBaileys() {
    const isRunning = await this.isBaileysRunning();
    if (isRunning) {
      console.log('✅ Baileys já está rodando');
      return true;
    }

    console.log('🚀 Iniciando Baileys em background...');

    try {
      this.baileysProcess = spawn('node', ['simple-baileys-server.js'], {
        cwd: this.backendPath,
        stdio: 'pipe',
        detached: true,
        shell: this.isWindows
      });

      this.baileysProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('🔌 Cliente conectado via Socket.IO')) {
          console.log(`[BAILEYS] ${output}`);
        }
      });

      this.baileysProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
          console.error(`[BAILEYS ERROR] ${error}`);
        }
      });

      this.baileysProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar Baileys:', error);
      });

      // Aguardar o Baileys iniciar
      console.log('⏳ Aguardando Baileys iniciar...');
      await new Promise(resolve => setTimeout(resolve, 8000));

      const isRunning = await this.isBaileysRunning();
      if (isRunning) {
        console.log('✅ Baileys iniciado com sucesso!');
        console.log('📱 WhatsApp API: http://localhost:3000');
        return true;
      } else {
        console.error('❌ Falha ao iniciar Baileys');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar Baileys:', error.message);
      return false;
    }
  }

  /**
   * Iniciar frontend
   */
  async startFrontend() {
    console.log('🚀 Iniciando frontend...');

    try {
      const frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: this.frontendPath,
        stdio: 'inherit',
        shell: this.isWindows
      });

      frontendProcess.on('error', (error) => {
        console.error('❌ Erro ao iniciar frontend:', error);
      });

      frontendProcess.on('exit', (code) => {
        console.log(`Frontend encerrado com código: ${code}`);
      });

      return frontendProcess;
    } catch (error) {
      console.error('❌ Erro ao iniciar frontend:', error.message);
      return null;
    }
  }

  /**
   * Inicialização rápida
   */
  async quickStart() {
    try {
      console.log('🚀 Inicialização Rápida VBSolutionCRM com Baileys...\n');

      // Iniciar Baileys em background
      const baileysOk = await this.startBaileys();
      if (!baileysOk) {
        console.error('❌ Falha ao iniciar Baileys');
        process.exit(1);
      }

      // Iniciar frontend
      const frontendProcess = await this.startFrontend();
      if (!frontendProcess) {
        console.error('❌ Falha ao iniciar frontend');
        process.exit(1);
      }

      console.log('\n🎉 Sistema iniciado com sucesso!');
      console.log('🌐 Frontend: http://localhost:5173 (ou próxima porta disponível)');
      console.log('📱 WhatsApp API: http://localhost:3000');
      console.log('\n💡 Para parar o sistema, pressione Ctrl+C');

      // Manter o processo vivo
      process.on('SIGINT', () => {
        console.log('\n🛑 Parando sistema...');
        if (this.baileysProcess) {
          this.baileysProcess.kill('SIGTERM');
        }
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        console.log('\n🛑 Parando sistema...');
        if (this.baileysProcess) {
          this.baileysProcess.kill('SIGTERM');
        }
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Erro na inicialização rápida:', error.message);
      process.exit(1);
    }
  }
}

// Função principal
async function main() {
  const quickStart = new QuickStart();
  await quickStart.quickStart();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = QuickStart;
