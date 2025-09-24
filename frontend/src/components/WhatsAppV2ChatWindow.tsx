"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { useWhatsAppV2Messages } from '@/hooks/useWhatsAppV2Messages';
import MediaViewer from './MediaViewer';

interface WhatsAppV2ChatWindowProps {
  conversation: {
    id: string;
    numero_cliente: string;
    nome_cliente: string | null;
    status: string;
  };
  ownerId: string;
  onSendMessage?: (message: any) => void;
}

export default function WhatsAppV2ChatWindow({
  conversation,
  ownerId,
  onSendMessage
}: WhatsAppV2ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    loading, 
    error, 
    sendMessage 
  } = useWhatsAppV2Messages(conversation.id, ownerId);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const newMessage = await sendMessage(messageText.trim(), 'TEXTO');
      setMessageText('');
      
      if (onSendMessage) {
        onSendMessage(newMessage);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = (tipo: string) => {
    switch (tipo) {
      case 'IMAGEM':
        return '📷';
      case 'AUDIO':
        return '🎵';
      case 'VIDEO':
        return '🎥';
      case 'DOCUMENTO':
        return '📄';
      case 'LOCALIZACAO':
        return '📍';
      case 'STICKER':
        return '😀';
      case 'CONTATO':
        return '👤';
      default:
        return '';
    }
  };

  const renderMessage = (message: any) => {
    const isFromClient = message.remetente === 'CLIENTE';
    const isAI = message.remetente === 'AI';
    const messageIcon = getMessageIcon(message.tipo);

    return (
      <div
        key={message.id}
        className={`flex ${isFromClient ? 'justify-start' : 'justify-end'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl ${
            isFromClient
              ? 'bg-gray-100 text-gray-900 border border-gray-200'
              : isAI
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-200'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200'
          }`}
        >
          {/* Avatar/Icon para IA */}
          {isAI && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">🤖</span>
              </div>
              <span className="text-xs font-medium opacity-90">Agente IA</span>
            </div>
          )}
          
          {/* Message content */}
          <div className="flex items-start gap-2">
            {messageIcon && (
              <span className="text-lg">{messageIcon}</span>
            )}
            <div className="flex-1">
              {message.tipo === 'TEXTO' ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.conteudo}</p>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-1">
                    {messageIcon} {message.tipo}
                  </p>
                  {message.media_url && (
                    <div className="mt-2">
                      <MediaViewer
                        type={message.tipo}
                        mediaUrl={message.media_url}
                        mediaMime={message.media_mime}
                        fileName={message.fileName}
                        duration={message.duration_ms ? Math.floor(message.duration_ms / 1000) : undefined}
                      />
                    </div>
                  )}
                  {message.conteudo && (
                    <p className="text-sm mt-1 opacity-90">{message.conteudo}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message time and status */}
          <div className={`flex items-center justify-between mt-2 text-[10px] ${
            isFromClient ? 'text-gray-500' : 'text-white/80'
          }`}>
            <div className="flex items-center gap-1">
              <span>{formatMessageTime(message.timestamp)}</span>
              {!isFromClient && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="text-white/60">
                    {isAI ? "IA" : "Você"}
                  </span>
                </>
              )}
            </div>
            {!isFromClient && (
              <div className="flex items-center">
                {message.lida ? (
                  <CheckCheck className="h-3 w-3 text-white/80" />
                ) : (
                  <Check className="h-3 w-3 text-white/80" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-green-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {(conversation.nome_cliente || conversation.numero_cliente).charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-medium">
              {conversation.nome_cliente || conversation.numero_cliente}
            </h3>
            <p className="text-sm text-green-100">
              {conversation.status === 'ATENDENDO' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-green-700 rounded-full">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-green-700 rounded-full">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-green-700 rounded-full">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs text-gray-400 mt-1">
                Envie uma mensagem para começar a conversa
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-end gap-2">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Paperclip className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Smile className="h-5 w-5" />
          </button>
          
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus-visible:ring-0 focus:border-gray-300 focus-visible:border-gray-300 focus-visible:outline-none focus:outline-none focus:shadow-none focus-visible:shadow-none resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
