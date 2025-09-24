#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class BaileysWatchdog {
  constructor() {
    this.process = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartDelay = 5000; // 5 segundos
    this.healthCheckInterval = 10000; // 10 segundos
    this.healthCheckTimeout = 5000; // 5 segundos timeout
    this.isShuttingDown = false;
    
    // Log file
    this.logFile = path.join(__dirname, 'baileys-watchdog.log');
    
    this.log('🐕 Baileys Watchdog iniciado - Garantindo que o serviço nunca morra!');
    
    // Graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    
    // Start monitoring
    this.startMonitoring();
  }
  
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Append to log file
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }
  
  async startBaileysServer() {
    return new Promise((resolve, reject) => {
      this.log('🚀 Iniciando servidor Baileys...');
      
      this.process = spawn('node', ['simple-baileys-server.js'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Log server output
      this.process.stdout.on('data', (data) => {
        this.log(`[BAILEYS] ${data.toString().trim()}`);
      });
      
      this.process.stderr.on('data', (data) => {
        this.log(`[BAILEYS ERROR] ${data.toString().trim()}`);
      });
      
      this.process.on('error', (error) => {
        this.log(`❌ Erro ao iniciar servidor: ${error.message}`);
        reject(error);
      });
      
      this.process.on('exit', (code, signal) => {
        if (!this.isShuttingDown) {
          this.log(`⚠️ Servidor Baileys parou inesperadamente (código: ${code}, signal: ${signal})`);
          this.handleServerExit();
        }
      });
      
      // Wait a bit for server to start
      setTimeout(() => {
        this.log('✅ Servidor Baileys iniciado com sucesso');
        resolve();
      }, 3000);
    });
  }
  
  async healthCheck() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.log('⏰ Health check timeout');
        resolve(false);
      }, this.healthCheckTimeout);
      
      exec('curl -s http://localhost:3000/api/baileys-simple/health', (error, stdout, stderr) => {
        clearTimeout(timeout);
        
        if (error) {
          this.log(`❌ Health check falhou: ${error.message}`);
          resolve(false);
        } else {
          try {
            const response = JSON.parse(stdout);
            if (response.success) {
              this.log('✅ Health check passou');
              resolve(true);
            } else {
              this.log('❌ Health check retornou erro');
              resolve(false);
            }
          } catch (e) {
            this.log('❌ Health check retornou resposta inválida');
            resolve(false);
          }
        }
      });
    });
  }
  
  async handleServerExit() {
    if (this.isShuttingDown) return;
    
    this.restartCount++;
    this.log(`🔄 Tentativa de restart #${this.restartCount}`);
    
    if (this.restartCount > this.maxRestarts) {
      this.log(`💀 Máximo de restarts atingido (${this.maxRestarts}). Parando watchdog.`);
      process.exit(1);
    }
    
    // Kill any remaining processes
    exec('pkill -f "simple-baileys-server.js"', () => {
      this.log(`⏳ Aguardando ${this.restartDelay/1000}s antes do restart...`);
      
      setTimeout(async () => {
        try {
          await this.startBaileysServer();
          this.log('🔄 Servidor reiniciado com sucesso');
        } catch (error) {
          this.log(`❌ Falha ao reiniciar servidor: ${error.message}`);
          this.handleServerExit();
        }
      }, this.restartDelay);
    });
  }
  
  async startMonitoring() {
    try {
      await this.startBaileysServer();
      
      // Start health check loop
      setInterval(async () => {
        if (this.isShuttingDown) return;
        
        const isHealthy = await this.healthCheck();
        if (!isHealthy) {
          this.log('💔 Servidor não está respondendo, reiniciando...');
          this.handleServerExit();
        }
      }, this.healthCheckInterval);
      
      this.log('👁️ Monitoramento ativo - Servidor será reiniciado automaticamente se falhar');
      
    } catch (error) {
      this.log(`❌ Erro ao iniciar monitoramento: ${error.message}`);
      this.handleServerExit();
    }
  }
  
  shutdown() {
    this.log('🛑 Parando watchdog...');
    this.isShuttingDown = true;
    
    if (this.process) {
      this.process.kill('SIGTERM');
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        process.exit(0);
      }, 5000);
    } else {
      process.exit(0);
    }
  }
}

// Start watchdog
new BaileysWatchdog();
