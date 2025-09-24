#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class UniversalBaileysStarter {
  constructor() {
    this.serverProcess = null;
    this.pidFile = path.join(__dirname, 'baileys-universal.pid');
    this.logFile = path.join(__dirname, 'baileys-universal.log');
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
  }

  start() {
    console.log('🚀 Iniciando Baileys Server Universal...');
    console.log(`📱 Plataforma: ${this.platform} (${os.arch()})`);
    
    // Verificar se já está rodando
    if (this.isServerRunning()) {
      console.log('✅ Servidor já está rodando');
      this.showStatus();
      return;
    }

    // Iniciar o servidor
    this.startServer();
    
    // Configurar handlers de sinal
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGUSR2', () => this.restart());
    
    // Mostrar status
    setTimeout(() => this.showStatus(), 3000);
  }

  isServerRunning() {
    if (!fs.existsSync(this.pidFile)) {
      return false;
    }

    try {
      const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
      // Verificar se o processo existe de forma universal
      if (this.isWindows) {
        // No Windows, usar tasklist
        const { execSync } = require('child_process');
        try {
          execSync(`tasklist /FI "PID eq ${pid}" /FO CSV | findstr ${pid}`, { stdio: 'ignore' });
          return true;
        } catch {
          return false;
        }
      } else {
        // No Unix/Linux/macOS, usar kill
        return process.kill(pid, 0);
      }
    } catch (error) {
      return false;
    }
  }

  startServer() {
    console.log('📱 Iniciando servidor Baileys...');
    
    // Comando baseado na plataforma
    const command = this.isWindows ? 'node.exe' : 'node';
    const args = ['simple-baileys-server.js'];
    
    // Iniciar o servidor
    this.serverProcess = spawn(command, args, {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: !this.isWindows, // No Windows, não usar detached
      shell: this.isWindows // No Windows, usar shell
    });

    // Salvar PID
    fs.writeFileSync(this.pidFile, this.serverProcess.pid.toString());

    // Configurar logs
    const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    this.serverProcess.stdout.pipe(logStream);
    this.serverProcess.stderr.pipe(logStream);

    this.serverProcess.on('error', (error) => {
      console.error('❌ Erro no servidor:', error);
    });

    this.serverProcess.on('exit', (code) => {
      console.log(`🔄 Servidor encerrado com código: ${code}`);
      this.cleanup();
    });

    console.log(`✅ Servidor Baileys iniciado (PID: ${this.serverProcess.pid})`);
  }

  showStatus() {
    console.log('\n🎉 Baileys Server está rodando!');
    console.log('📱 API disponível em: http://localhost:3000/api');
    console.log('🔗 Teste: http://localhost:3000/api/test');
    console.log('📝 Logs salvos em:', this.logFile);
    
    if (this.isWindows) {
      console.log('💡 Para parar: taskkill /PID $(type baileys-universal.pid) /F ou Ctrl+C');
    } else {
      console.log('💡 Para parar: kill $(cat baileys-universal.pid) ou Ctrl+C');
    }
    
    console.log('\n🔄 Monitorando servidor... (Ctrl+C para parar)');
  }

  restart() {
    console.log('🔄 Reiniciando servidor...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    setTimeout(() => {
      this.startServer();
    }, 2000);
  }

  shutdown() {
    console.log('\n🛑 Parando Baileys Server...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    this.cleanup();
    process.exit(0);
  }

  cleanup() {
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
    }
  }
}

// Iniciar o servidor
const starter = new UniversalBaileysStarter();
starter.start();

// Manter o processo vivo e monitorar
setInterval(() => {
  if (!starter.isServerRunning()) {
    console.log('⚠️ Servidor parou, reiniciando...');
    starter.startServer();
  }
}, 30000); // Verificar a cada 30 segundos