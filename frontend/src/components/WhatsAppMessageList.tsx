import React, { useEffect, useRef } from 'react';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  CheckCheck, 
  Image, 
  Video, 
  Mic, 
  FileText, 
  AlertCircle,
  Download,
  User
} from 'lucide-react';

interface WhatsAppMessageListProps {
  chatId: string;
  userId: string;
}

const WhatsAppMessageList: React.FC<WhatsAppMessageListProps> = ({
  chatId,
  userId
}) => {
  const {
    messages,
    loading,
    error,
    loadMessages,
    joinConversation,
    leaveConversation,
    markAsRead,
    activeConversation
  } = useWhatsAppConversations();
  
  const { profile } = useUserProfile();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId && userId) {
      loadMessages(chatId, userId);
      joinConversation(chatId);
    }

    return () => {
      if (chatId) {
        leaveConversation(chatId);
      }
    };
  }, [chatId, userId, loadMessages, joinConversation, leaveConversation]);

  // Marcar mensagens como lidas quando a conversa for aberta
  useEffect(() => {
    if (chatId && activeConversation?.chat_id === chatId) {
      markAsRead(chatId);
    }
  }, [chatId, activeConversation, markAsRead]);

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getMessageIcon = (tipo: string) => {
    switch (tipo) {
      case 'IMAGEM':
        return <Image className="w-4 h-4" />;
      case 'VIDEO':
        return <Video className="w-4 h-4" />;
      case 'AUDIO':
        return <Mic className="w-4 h-4" />;
      case 'TEXTO':
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getReadStatus = (message: any) => {
    if (message.remetente === 'ATENDENTE') {
      return message.lida ? (
        <CheckCheck className="w-4 h-4 text-blue-500" />
      ) : (
        <Check className="w-4 h-4 text-gray-400" />
      );
    }
    return null;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const renderMessageContent = (message: any) => {
    if (message.media_url) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {getMessageIcon(message.tipo)}
            <span>Mídia {message.tipo.toLowerCase()}</span>
          </div>
          <div className="relative">
            {message.tipo === 'IMAGEM' ? (
              <img
                src={message.media_url}
                alt="Imagem"
                className="max-w-xs rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : message.tipo === 'VIDEO' ? (
              <video
                src={message.media_url}
                controls
                className="max-w-xs rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                {getMessageIcon(message.tipo)}
                <span className="text-sm">Arquivo de mídia</span>
                <a
                  href={message.media_url}
                  download
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <p className="text-sm whitespace-pre-wrap">{message.conteudo}</p>
        {message.tipo !== 'TEXTO' && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {getMessageIcon(message.tipo)}
            <span>{message.tipo}</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <img 
            src="https://img.icons8.com/color/48/whatsapp--v1.png" 
            alt="WhatsApp" 
            className="w-12 h-12 mx-auto mb-4"
          />
          <p className="text-gray-500">Nenhuma mensagem ainda</p>
        </div>
      ) : (
        messages.map((message, index) => {
          const isClient = message.remetente === 'CLIENTE';
          const showDate = index === 0 || 
            formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);

          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <Badge variant="outline" className="text-xs">
                    {formatDate(message.timestamp)}
                  </Badge>
                </div>
              )}
              
              <div className={`flex ${isClient ? 'justify-start' : 'justify-end'} mb-2 gap-2`}>
                {/* Avatar do atendente - apenas para mensagens enviadas */}
                {!isClient && (
                  <div className="flex-shrink-0 order-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-100 flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Atendente" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isClient
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {renderMessageContent(message)}
                  
                  <div className={`flex items-center justify-between mt-1 ${
                    isClient ? 'text-gray-500' : 'text-blue-100'
                  }`}>
                    <span className="text-xs">
                      {formatTime(message.timestamp)}
                    </span>
                    <div className="flex items-center gap-1">
                      {getReadStatus(message)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default WhatsAppMessageList;
