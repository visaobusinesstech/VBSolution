#!/usr/bin/env node

/**
 * Monitor de Baileys - VBSolutionCRM
 * Monitora e reinicia automaticamente o servidor Baileys se necessário
 * Executa em background para garantir que o WhatsApp sempre esteja funcionando
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

class BaileysMonitor {
  constructor() {
    this.backendPath = path.join(__dirname, 'backend');
    this.baileysProcess = null;
    this.isMonitoring = false;
    this.checkInterval = 30000; // 30 segundos
    this.maxRestartAttempts = 5;
    this.restartAttempts = 0;
    this.lastRestartTime = 0;
    this.restartCooldown = 60000; // 1 minuto entre tentativas
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
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Iniciar servidor Baileys
   */
  async startBaileys() {
    if (this.baileysProcess) {
      console.log('⚠️ Baileys já está rodando, parando processo anterior...');
      this.baileysProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🚀 Iniciando servidor Baileys...');

    try {
      this.baileysProcess = spawn('node', ['simple-baileys-server.js'], {
        cwd: this.backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      this.baileysProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
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
        this.baileysProcess = null;
      });

      this.baileysProcess.on('exit', (code) => {
        console.log(`🔄 Baileys encerrado com código: ${code}`);
        this.baileysProcess = null;
        
        // Se não estamos monitorando, não reiniciar automaticamente
        if (!this.isMonitoring) {
          return;
        }

        // Reiniciar após um delay
        setTimeout(() => {
          if (this.isMonitoring) {
            console.log('🔄 Reiniciando Baileys automaticamente...');
            this.startBaileys();
          }
        }, 5000);
      });

      // Aguardar o Baileys iniciar
      console.log('⏳ Aguardando Baileys iniciar...');
      await new Promise(resolve => setTimeout(resolve, 8000));

      const isRunning = await this.isBaileysRunning();
      if (isRunning) {
        console.log('✅ Baileys iniciado com sucesso!');
        this.restartAttempts = 0; // Reset contador de tentativas
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
   * Parar servidor Baileys
   */
  async stopBaileys() {
    if (this.baileysProcess) {
      console.log('🛑 Parando servidor Baileys...');
      this.baileysProcess.kill('SIGTERM');
      this.baileysProcess = null;
      
      // Aguardar o processo parar
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Baileys parado');
    }
  }

  /**
   * Verificar e reiniciar se necessário
   */
  async checkAndRestart() {
    try {
      const isRunning = await this.isBaileysRunning();
      
      if (!isRunning) {
        const now = Date.now();
        const timeSinceLastRestart = now - this.lastRestartTime;
        
        // Verificar se não excedeu o limite de tentativas
        if (this.restartAttempts >= this.maxRestartAttempts) {
          console.error(`❌ Limite de tentativas de restart atingido (${this.maxRestartAttempts}). Parando monitoramento.`);
          this.stopMonitoring();
          return;
        }
        
        // Verificar cooldown entre restarts
        if (timeSinceLastRestart < this.restartCooldown) {
          console.log(`⏳ Aguardando cooldown antes do próximo restart (${Math.ceil((this.restartCooldown - timeSinceLastRestart) / 1000)}s)`);
          return;
        }
        
        console.log(`⚠️ Baileys não está respondendo. Tentativa de restart ${this.restartAttempts + 1}/${this.maxRestartAttempts}`);
        
        this.restartAttempts++;
        this.lastRestartTime = now;
        
        await this.startBaileys();
      } else {
        // Reset contador se estiver funcionando
        this.restartAttempts = 0;
      }
    } catch (error) {
      console.error('❌ Erro no monitoramento:', error.message);
    }
  }

  /**
   * Iniciar monitoramento
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Monitoramento já está ativo');
      return;
    }

    console.log('🔍 Iniciando monitoramento do Baileys...');
    this.isMonitoring = true;
    this.restartAttempts = 0;

    // Verificar imediatamente
    this.checkAndRestart();

    // Verificar a cada intervalo
    this.monitorInterval = setInterval(() => {
      this.checkAndRestart();
    }, this.checkInterval);

    console.log(`✅ Monitoramento ativo (verificação a cada ${this.checkInterval / 1000}s)`);
  }

  /**
   * Parar monitoramento
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️ Monitoramento não está ativo');
      return;
    }

    console.log('🛑 Parando monitoramento do Baileys...');
    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    console.log('✅ Monitoramento parado');
  }

  /**
   * Mostrar status
   */
  async showStatus() {
    console.log('\n📊 Status do Monitor Baileys:');
    console.log('==============================');
    
    const isRunning = await this.isBaileysRunning();
    console.log(`🔧 Baileys: ${isRunning ? '✅ Rodando' : '❌ Parado'}`);
    console.log(`🔍 Monitoramento: ${this.isMonitoring ? '✅ Ativo' : '❌ Inativo'}`);
    console.log(`🔄 Tentativas de restart: ${this.restartAttempts}/${this.maxRestartAttempts}`);
    
    if (isRunning) {
      console.log('   📱 API: http://localhost:3000');
      console.log('   🔗 Health: http://localhost:3000/api/baileys-simple/health');
    }
    
    console.log('==============================\n');
  }

  /**
   * Inicializar monitor
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando Monitor Baileys...\n');
      
      // Iniciar Baileys
      await this.startBaileys();
      
      // Iniciar monitoramento
      this.startMonitoring();
      
      // Mostrar status
      await this.showStatus();
      
      console.log('🎉 Monitor Baileys iniciado com sucesso!');
      console.log('💡 Para parar, pressione Ctrl+C');
      
      // Manter o processo vivo
      process.on('SIGINT', async () => {
        console.log('\n🛑 Parando monitor...');
        this.stopMonitoring();
        await this.stopBaileys();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n🛑 Parando monitor...');
        this.stopMonitoring();
        await this.stopBaileys();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Erro ao inicializar monitor:', error.message);
      process.exit(1);
    }
  }
}

// Função principal
async function main() {
  const monitor = new BaileysMonitor();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'start':
        await monitor.initialize();
        break;

      case 'status':
        await monitor.showStatus();
        break;

      case 'stop':
        monitor.stopMonitoring();
        await monitor.stopBaileys();
        break;

      case 'restart':
        await monitor.stopBaileys();
        await monitor.startBaileys();
        break;

      default:
        console.log('🔄 Monitor Baileys - VBSolutionCRM');
        console.log('');
        console.log('Uso:');
        console.log('  node baileys-monitor.js start    - Iniciar monitor');
        console.log('  node baileys-monitor.js status   - Verificar status');
        console.log('  node baileys-monitor.js stop     - Parar monitor');
        console.log('  node baileys-monitor.js restart  - Reiniciar Baileys');
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = BaileysMonitor;
