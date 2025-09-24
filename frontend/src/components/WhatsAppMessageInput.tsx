import React, { useState, useRef, useEffect } from 'react';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Image, 
  Video, 
  Mic, 
  Paperclip,
  Smile
} from 'lucide-react';

interface WhatsAppMessageInputProps {
  chatId: string;
  disabled?: boolean;
}

const WhatsAppMessageInput: React.FC<WhatsAppMessageInputProps> = ({
  chatId,
  disabled = false
}) => {
  const { sendMessage, connected } = useWhatsAppConversations();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() || disabled || !connected) return;

    try {
      await sendMessage(chatId, message.trim());
      setMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
    } else if (isTyping && !e.target.value.trim()) {
      setIsTyping(false);
    }
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleFileUpload = (type: 'image' | 'video' | 'audio') => {
    // TODO: Implementar upload de arquivos
    console.log(`Upload de ${type} não implementado ainda`);
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2">
        {/* Attachment buttons */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFileUpload('image')}
            disabled={disabled || !connected}
            className="p-2"
          >
            <Image className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFileUpload('video')}
            disabled={disabled || !connected}
            className="p-2"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFileUpload('audio')}
            disabled={disabled || !connected}
            className="p-2"
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || !connected}
            className="p-2"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={connected ? "Digite sua mensagem..." : "Conectando..."}
            disabled={disabled || !connected}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-0 focus-visible:ring-0 focus:border-gray-300 focus-visible:border-gray-300 focus-visible:outline-none focus:outline-none focus:shadow-none focus-visible:shadow-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={1}
            maxLength={1000}
          />
          
          {/* Character count */}
          {message.length > 800 && (
            <div className="absolute bottom-1 right-1 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Emoji button */}
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || !connected}
          className="p-2"
        >
          <Smile className="w-4 h-4" />
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || !connected}
          className="px-4 py-2"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Status indicators */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {!connected && (
            <span className="text-red-500">Desconectado</span>
          )}
          {isTyping && connected && (
            <span className="text-blue-500">Digitando...</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span>Enter para enviar</span>
          <span>Shift+Enter para quebrar linha</span>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessageInput;
