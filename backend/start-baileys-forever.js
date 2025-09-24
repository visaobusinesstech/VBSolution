#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class BaileysForever {
  constructor() {
    this.serverProcess = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.pidFile = path.join(__dirname, 'baileys-forever.pid');
    this.logFile = path.join(__dirname, 'baileys-forever.log');
  }

  start() {
    console.log('🚀 Iniciando Baileys Server Forever...');
    
    // Salvar PID do processo principal
    fs.writeFileSync(this.pidFile, process.pid.toString());
    
    // Iniciar o servidor
    this.startServer();
    
    // Configurar handlers de sinal
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGUSR2', () => this.restart());
  }

  startServer() {
    console.log('📱 Iniciando servidor Baileys...');
    
    this.serverProcess = spawn('node', ['simple-baileys-server.js'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Configurar logs
    const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    this.serverProcess.stdout.pipe(logStream);
    this.serverProcess.stderr.pipe(logStream);

    this.serverProcess.on('error', (error) => {
      console.error('❌ Erro no servidor:', error);
      this.handleServerExit(1);
    });

    this.serverProcess.on('exit', (code) => {
      console.log(`🔄 Servidor encerrado com código: ${code}`);
      this.handleServerExit(code);
    });

    console.log(`✅ Servidor Baileys iniciado (PID: ${this.serverProcess.pid})`);
    console.log('📱 API disponível em: http://localhost:3000/api');
    console.log('🔗 Teste: http://localhost:3000/api/test');
  }

  handleServerExit(code) {
    if (this.restartCount < this.maxRestarts) {
      this.restartCount++;
      console.log(`🔄 Reiniciando servidor... (${this.restartCount}/${this.maxRestarts})`);
      
      // Aguardar 5 segundos antes de reiniciar
      setTimeout(() => {
        this.startServer();
      }, 5000);
    } else {
      console.log('❌ Máximo de reinicializações atingido. Parando...');
      this.shutdown();
    }
  }

  restart() {
    console.log('🔄 Reiniciando servidor...');
    this.restartCount = 0;
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    setTimeout(() => {
      this.startServer();
    }, 2000);
  }

  shutdown() {
    console.log('🛑 Parando Baileys Server Forever...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    // Limpar arquivo PID
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
    
    process.exit(0);
  }
}

// Iniciar o forever
const forever = new BaileysForever();
forever.start();
