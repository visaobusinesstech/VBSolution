import React, { useState, useRef } from 'react';
import { 
  Send, 
  Image, 
  Video, 
  Mic, 
  MapPin, 
  Paperclip,
  Smile,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConnections } from '@/contexts/ConnectionsContext';
import { toast } from 'sonner';

interface WhatsAppSimpleComposerProps {
  jid: string;
  onMessageSent?: (message: any) => void;
  className?: string;
}

export const WhatsAppSimpleComposer: React.FC<WhatsAppSimpleComposerProps> = ({
  jid,
  onMessageSent,
  className = ''
}) => {
  const { activeConnection } = useConnections();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const sendMessage = async (messageData: any) => {
    if (!activeConnection?.id) {
      toast.error('Nenhuma conexão ativa');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: jid,
          ...messageData
        })
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Erro ao enviar mensagem');
      }

      onMessageSent?.(result);
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!message.trim()) return;

    await sendMessage({
      type: 'text',
      text: message.trim()
    });

    setMessage('');
  };

  const handleSendMedia = async (type: 'image' | 'video' | 'audio' | 'document', file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('connectionId', activeConnection?.id || '');
      formData.append('jid', jid);
      formData.append('type', type);

      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/api/baileys-simple/send-media-optimized`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar mídia');
      }

      onMessageSent?.(result.data);
      
    } catch (error: any) {
      console.error('Erro ao enviar mídia:', error);
      toast.error(error.message || 'Erro ao enviar mídia');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      await sendMessage({
        type: 'location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    }, (error) => {
      toast.error('Erro ao obter localização');
    });
  };

  const handleFileSelect = (type: 'image' | 'video' | 'audio' | 'document') => {
    const inputRef = type === 'image' ? imageInputRef :
                    type === 'video' ? videoInputRef :
                    type === 'audio' ? audioInputRef :
                    documentInputRef;
    
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'document') => {
    const file = event.target.files?.[0];
    if (file) {
      handleSendMedia(type, file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        
        // Enviar áudio gravado
        await handleSendMedia('audio', audioFile);
        
        // Limpar
        setAudioChunks([]);
        setRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
    }
  };

  const handleAudioClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`bg-white border-t border-gray-200 p-4 ${className}`}>
      {/* Media Options */}
      {showMediaOptions && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Anexar mídia</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMediaOptions(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFileSelect('image')}
              className="flex flex-col items-center gap-1 h-16"
            >
              <Image className="w-4 h-4" />
              <span className="text-xs">Foto</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFileSelect('video')}
              className="flex flex-col items-center gap-1 h-16"
            >
              <Video className="w-4 h-4" />
              <span className="text-xs">Vídeo</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAudioClick}
              className={`flex flex-col items-center gap-1 h-16 ${recording ? 'bg-red-100 border-red-300' : ''}`}
            >
              <Mic className={`w-4 h-4 ${recording ? 'text-red-500' : ''}`} />
              <span className="text-xs">{recording ? 'Gravando...' : 'Áudio'}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFileSelect('document')}
              className="flex flex-col items-center gap-1 h-16"
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-xs">Documento</span>
            </Button>
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {recording && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-700">Gravando áudio... Clique no microfone para parar</span>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={recording ? "Gravando áudio..." : "Digite sua mensagem..."}
            className="min-h-[40px] max-h-32 resize-none"
            disabled={isLoading || recording}
          />
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMediaOptions(!showMediaOptions)}
            disabled={isLoading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSendLocation}
            disabled={isLoading}
          >
            <MapPin className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleSendText}
            disabled={!message.trim() || isLoading || recording}
            size="sm"
            className="bg-green-500 hover:bg-green-600"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : recording ? (
              <Mic className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileChange(e, 'video')}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => handleFileChange(e, 'audio')}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
        onChange={(e) => handleFileChange(e, 'document')}
        className="hidden"
      />
    </div>
  );
};
