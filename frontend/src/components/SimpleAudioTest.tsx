"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Send } from 'lucide-react';

export const SimpleAudioTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[SIMPLE-AUDIO] ${message}`);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      addLog('🎤 Iniciando gravação...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      addLog('🎤 Stream obtido com sucesso');
      
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      
      addLog(`🎤 Codec: ${mimeType}`);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setDuration(0);
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        addLog(`🎤 Dados: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        addLog(`🎤 Parando, chunks: ${chunksRef.current.length}`);
        
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          addLog(`🎤 Blob: ${blob.size} bytes`);
          
          if (blob.size > 0) {
            setAudioBlob(blob);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            addLog(`✅ Áudio gravado: ${blob.size} bytes`);
          } else {
            addLog('❌ Blob vazio');
          }
        } else {
          addLog('⚠️ Nenhum chunk capturado');
        }
        
        stream.getTracks().forEach(track => {
          addLog(`🎤 Parando track: ${track.kind}`);
          track.stop();
        });
      };

      recorder.start(100);
      addLog('🎤 MediaRecorder iniciado');
      
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      addLog(`❌ Erro: ${error.message}`);
    }
  };

  const stopRecording = () => {
    addLog('🛑 Parando gravação...');
    
    if (mediaRecorderRef.current && isRecording) {
      addLog(`🛑 Estado: ${mediaRecorderRef.current.state}`);
      
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        addLog('🛑 MediaRecorder.stop() chamado');
      }
      
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        addLog('⏸️ Pausado');
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        addLog('▶️ Reproduzindo');
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const reset = () => {
    addLog('🔄 Resetando...');
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Teste Simples de Áudio</h1>
      
      {/* Controles */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {!isRecording && !audioBlob && (
              <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600 text-white">
                <Mic className="w-4 h-4 mr-2" />
                Iniciar Gravação
              </Button>
            )}
            
            {isRecording && (
              <Button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white">
                <Square className="w-4 h-4 mr-2" />
                Parar Gravação
              </Button>
            )}
            
            {audioBlob && (
              <>
                <Button onClick={playAudio} className="bg-blue-500 hover:bg-blue-600 text-white">
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? 'Pausar' : 'Reproduzir'}
                </Button>
                
                <Button onClick={reset} className="bg-gray-500 hover:bg-gray-600 text-white">
                  Resetar
                </Button>
              </>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            {isRecording && `Gravando: ${formatTime(duration)}`}
            {audioBlob && `Áudio: ${formatTime(duration)}`}
          </div>
        </div>
        
        {isRecording && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((duration / 60) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Informações do áudio */}
      {audioBlob && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Informações do Áudio</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Tamanho: {audioBlob.size} bytes</div>
            <div>Tipo: {audioBlob.type}</div>
            <div>Duração: {formatTime(duration)}</div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">Logs</h3>
          <Button 
            onClick={clearLogs} 
            variant="outline" 
            size="sm"
            className="text-white border-white hover:bg-white hover:text-gray-900"
          >
            Limpar
          </Button>
        </div>
        <div className="h-48 overflow-y-auto text-green-400 text-sm font-mono space-y-1">
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      {/* Elemento de áudio oculto */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="hidden"
        />
      )}
    </div>
  );
};
