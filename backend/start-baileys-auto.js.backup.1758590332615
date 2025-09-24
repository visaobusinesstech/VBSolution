#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class AutoBaileysStarter {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isMac = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    this.serverProcess = null;
    this.pidFile = path.join(__dirname, 'baileys-auto.pid');
    this.logFile = path.join(__dirname, 'baileys-auto.log');
  }

  start() {
    console.log('🚀 Iniciando Baileys Server Auto...');
    console.log(`📱 Plataforma: ${this.platform} (${os.arch()})`);
    console.log(`💻 Sistema: ${os.type()} ${os.release()}`);
    
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
      
      if (this.isWindows) {
        // No Windows, usar tasklist
        return new Promise((resolve) => {
          exec(`tasklist /FI "PID eq ${pid}" /FO CSV | findstr ${pid}`, (error) => {
            resolve(!error);
          });
        });
      } else {
        // No Unix/Linux/macOS, usar kill
        try {
          return process.kill(pid, 0);
        } catch {
          return false;
        }
      }
    } catch (error) {
      return false;
    }
  }

  async startServer() {
    console.log('📱 Iniciando servidor Baileys...');
    
    // Comando baseado na plataforma
    const command = this.isWindows ? 'node.exe' : 'node';
    const args = ['simple-baileys-server.js'];
    
    // Opções de spawn baseadas na plataforma
    const spawnOptions = {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe']
    };

    if (this.isWindows) {
      spawnOptions.shell = true;
    } else {
      spawnOptions.detached = true;
    }
    
    // Iniciar o servidor
    this.serverProcess = spawn(command, args, spawnOptions);

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
      console.log('💡 Para parar: taskkill /PID $(type baileys-auto.pid) /F ou Ctrl+C');
    } else {
      console.log('💡 Para parar: kill $(cat baileys-auto.pid) ou Ctrl+C');
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
const starter = new AutoBaileysStarter();
starter.start();

// Manter o processo vivo e monitorar
setInterval(async () => {
  const isRunning = await starter.isServerRunning();
  if (!isRunning) {
    console.log('⚠️ Servidor parou, reiniciando...');
    starter.startServer();
  }
}, 30000); // Verificar a cada 30 segundos
