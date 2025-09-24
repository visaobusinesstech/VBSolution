"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
  maxDuration?: number; // em segundos, padrão 120 (2 minutos)
  className?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  maxDuration = 120,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef<boolean>(false);

  // Formatar tempo no formato MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Iniciar gravação
  const startRecording = async () => {
    console.log('🎤 [START-RECORDING] Iniciando gravação...', { 
      isRecording, 
      hasAudioBlob: !!audioBlob, 
      hasMediaRecorder: !!mediaRecorder 
    });
    
    // Verificar se já está gravando
    if (isRecording || audioBlob) {
      console.log('⚠️ [START-RECORDING] Já está gravando ou tem áudio, ignorando');
      return;
    }
    
    try {
      console.log('🎤 [START-RECORDING] Solicitando acesso ao microfone...');
      
      // Configuração mais simples e compatível
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true
      });
      
      console.log('🎤 [START-RECORDING] Stream obtido com sucesso');
      
      // Detectar codec suportado - mais compatível
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/wav';
        }
      }
      
      console.log('🎤 [START-RECORDING] Codec selecionado:', mimeType);
      
      const recorder = new MediaRecorder(stream);
      
      console.log('🎤 [START-RECORDING] MediaRecorder criado, atualizando estados...');
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setDuration(0);
      setIsRecording(true);
      setIsPaused(false);
      
      console.log('🎤 [START-RECORDING] Estados atualizados');

      // Usar uma variável local para capturar os chunks
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        console.log('🎤 Dados de áudio recebidos:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        console.log('🎤 [ONSTOP] Evento onstop disparado');
        console.log('🎤 [ONSTOP] Chunks capturados:', chunks.length);
        console.log('🎤 [ONSTOP] Tamanho total dos chunks:', chunks.reduce((total, chunk) => total + chunk.size, 0), 'bytes');
        
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          console.log('🎤 [ONSTOP] Blob criado:', { 
            size: blob.size, 
            type: blob.type,
            chunksCount: chunks.length
          });
          
          // Verificar se o blob tem conteúdo
          if (blob.size > 0) {
            setAudioBlob(blob);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            
            console.log('✅ [ONSTOP] Áudio gravado com sucesso, tamanho:', blob.size, 'bytes');
          } else {
            console.error('❌ [ONSTOP] Blob criado mas está vazio');
          }
        } else {
          console.warn('⚠️ [ONSTOP] Nenhum chunk de áudio foi capturado');
        }
        
        // Parar todas as tracks do stream
        console.log('🎤 [ONSTOP] Parando tracks do stream...');
        stream.getTracks().forEach(track => {
          console.log('🎤 [ONSTOP] Parando track:', track.kind, track.readyState);
          track.stop();
        });
        
        console.log('✅ [ONSTOP] Processo de parada concluído');
      };

      recorder.start(100); // Coletar dados a cada 100ms
      
      // Iniciar timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

    } catch (error: any) {
      console.error('❌ [START-RECORDING] Erro ao iniciar gravação:', error);
      
      // Tratamento específico de erros
      let errorMessage = 'Erro ao acessar microfone.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Permissão de microfone negada. Permita o acesso ao microfone.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhum microfone encontrado.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microfone em uso por outra aplicação.';
      } else {
        errorMessage = `Erro: ${error.message}`;
      }
      
      console.error('❌ [START-RECORDING] Erro:', errorMessage);
      
      // Usar console.error em vez de alert para não bloquear a UI
      console.error('❌ [START-RECORDING] Detalhes do erro:', error);
      
      // Resetar estados em caso de erro
      setIsRecording(false);
      setMediaRecorder(null);
      setAudioChunks([]);
      setDuration(0);
      hasStartedRef.current = false;
    }
  };

  // Parar gravação
  const stopRecording = () => {
    console.log('🛑 [STOP-RECORDING] Iniciando parada da gravação...');
    console.log('🛑 [STOP-RECORDING] Estado atual:', { 
      hasMediaRecorder: !!mediaRecorder, 
      isRecording, 
      recorderState: mediaRecorder?.state 
    });
    
    if (mediaRecorder && isRecording) {
      try {
        // Verificar se o recorder está realmente gravando
        if (mediaRecorder.state === 'recording') {
          console.log('🛑 [STOP-RECORDING] Parando MediaRecorder...');
          mediaRecorder.stop();
        } else {
          console.log('⚠️ [STOP-RECORDING] MediaRecorder não está gravando, estado:', mediaRecorder.state);
        }
        
        setIsRecording(false);
        setIsPaused(false);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        console.log('✅ [STOP-RECORDING] Gravação parada com sucesso');
      } catch (error) {
        console.error('❌ [STOP-RECORDING] Erro ao parar gravação:', error);
        // Forçar parada mesmo com erro
        setIsRecording(false);
        setIsPaused(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } else {
      console.log('⚠️ [STOP-RECORDING] Não há gravação ativa para parar');
    }
  };

  // Pausar/Retomar gravação
  const togglePause = () => {
    if (!mediaRecorder || !isRecording) return;

    if (isPaused) {
      mediaRecorder.resume();
      setIsPaused(false);
      
      // Retomar timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);
    } else {
      mediaRecorder.pause();
      setIsPaused(true);
      
      // Pausar timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  // Reproduzir áudio gravado
  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Enviar áudio
  const sendAudio = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  // Cancelar gravação
  const cancelRecording = () => {
    console.log('🎤 [CANCEL] Cancelando gravação...');
    
    if (isRecording) {
      stopRecording();
    }
    
    // Limpar recursos
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Resetar estados
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    setMediaRecorder(null);
    hasStartedRef.current = false;
    
    console.log('🎤 [CANCEL] Estados resetados');
    
    onCancel();
  };

  // Iniciar gravação automaticamente quando o componente é montado
  useEffect(() => {
    console.log('🎤 [AUTO-START] useEffect disparado', {
      isRecording,
      hasAudioBlob: !!audioBlob,
      hasMediaRecorder: !!mediaRecorder,
      hasStarted: hasStartedRef.current
    });

    // Iniciar gravação automaticamente
    if (!hasStartedRef.current && !isRecording && !audioBlob && !mediaRecorder) {
      console.log('🎤 [AUTO-START] Iniciando gravação automaticamente');
      hasStartedRef.current = true;
      startRecording();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Iniciar gravação automaticamente quando o componente é montado
  useEffect(() => {
    console.log('🎤 [AUTO-START] useEffect disparado', { 
      isRecording, 
      hasAudioBlob: !!audioBlob, 
      hasMediaRecorder: !!mediaRecorder,
      hasStarted: hasStartedRef.current
    });
    
    // Pequeno delay para garantir que o componente está totalmente montado
    const timer = setTimeout(() => {
      if (!hasStartedRef.current && !isRecording && !audioBlob && !mediaRecorder) {
        console.log('🎤 [AUTO-START] Iniciando gravação automaticamente após delay');
        hasStartedRef.current = true;
        startRecording();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Se está gravando, mostrar interface de gravação
  if (isRecording) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          {/* Botão de deletar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="text-gray-500 hover:text-red-500 p-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Timer e controles */}
          <div className="flex items-center gap-3">
            {/* Indicador de gravação */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {formatTime(duration)} / {formatTime(maxDuration)}
              </span>
            </div>

            {/* Botão de pausar/retomar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePause}
              className="text-gray-600 hover:text-gray-800 p-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>

            {/* Botão de parar */}
            <Button
              onClick={() => {
                console.log('🖱️ [BUTTON-CLICK] Botão de parar clicado');
                stopRecording();
              }}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(duration / maxDuration) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Se tem áudio gravado, mostrar preview e controles
  if (audioBlob) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          {/* Botão de deletar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="text-gray-500 hover:text-red-500 p-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Preview do áudio */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {formatTime(duration)}
              </span>
            </div>

            {/* Botão de reproduzir */}
            <Button
              variant="ghost"
              size="sm"
              onClick={playAudio}
              className="text-gray-600 hover:text-gray-800 p-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            {/* Botão de enviar */}
            <Button
              onClick={sendAudio}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full"
            >
              Enviar
            </Button>
          </div>
        </div>

        {/* Elemento de áudio oculto para reprodução */}
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
  }

  // Se não está gravando e não tem áudio, mostrar botão para iniciar
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="mb-3">
            <Mic className="h-8 w-8 text-red-500 mx-auto" />
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Clique para iniciar a gravação
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={startRecording}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full"
            >
              <Mic className="h-4 w-4 mr-2" />
              Gravar
            </Button>
            <Button
              variant="ghost"
              onClick={cancelRecording}
              className="text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
