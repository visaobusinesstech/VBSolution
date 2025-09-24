import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Search,
  Info,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Star,
  Link,
  Image,
  FileText,
  Keyboard,
  ChevronDown,
  Bot,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TopBarControls from '@/components/TopBarControls';

interface WhatsAppMessage {
  id: string;
  content: string;
  timestamp: Date;
  fromMe: boolean;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  quotedMessage?: WhatsAppMessage;
}

interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
  participants: string[];
  unreadCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    fromMe: boolean;
  };
  timestamp: number;
  profilePicture?: string;
  whatsappName?: string;
  phoneNumber?: string;
  aiEnabled?: boolean;
  attendantName?: string;
  attendantPhoto?: string;
}

interface WhatsAppChatWindowProps {
  chat: WhatsAppChat | null;
  connectionId: string;
  onBack?: () => void;
}

export default function WhatsAppChatWindow({ 
  chat, 
  connectionId, 
  onBack 
}: WhatsAppChatWindowProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      loadMessages();
    }
  }, [chat, connectionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!chat || !connectionId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/baileys-simple/connections/${connectionId}/chats/${chat.id}/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMessages(data.data);
        } else {
          // Mock data fallback
          setMessages([
            {
              id: '1',
              content: 'Oi tudo bem?',
              timestamp: new Date(),
              fromMe: true,
              status: 'read',
              type: 'text'
            },
            {
              id: '2',
              content: 'Oi',
              timestamp: new Date(),
              fromMe: false,
              status: 'sent',
              type: 'text'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Mock data fallback
      setMessages([
        {
          id: '1',
          content: 'Oi tudo bem?',
          timestamp: new Date(),
          fromMe: true,
          status: 'read',
          type: 'text'
        },
        {
          id: '2',
          content: 'Oi',
          timestamp: new Date(),
          fromMe: false,
          status: 'sent',
          type: 'text'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat || !connectionId) return;

    const messageData = {
      content: newMessage,
      type: 'text'
    };

    try {
      const response = await fetch(`/api/baileys-simple/connections/${connectionId}/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const newMsg: WhatsAppMessage = {
          id: Date.now().toString(),
          content: newMessage,
          timestamp: new Date(),
          fromMe: true,
          status: 'sent',
          type: 'text'
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-300" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <img 
            src="https://img.icons8.com/color/48/whatsapp--v1.png" 
            alt="WhatsApp" 
            className="h-16 w-16 mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecione uma conversa
          </h3>
          <p className="text-gray-500">
            Escolha uma conversa para começar a enviar mensagens
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 lg:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {/* Avatar do contato */}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.profilePicture} alt={chat.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                {chat.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Ícone do WhatsApp no canto do avatar */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <img 
                src="https://img.icons8.com/color/48/whatsapp--v1.png" 
                alt="WhatsApp" 
                className="w-3 h-3"
              />
            </div>
          </div>
          
          {/* Informações do contato */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              {chat.whatsappName || chat.name}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 truncate">
                {chat.phoneNumber || chat.id}
              </p>
              {chat.isGroup && (
                <span className="text-xs text-gray-500">
                  • {chat.participants.length} participantes
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Controles da barra superior */}
        <TopBarControls 
          chatId={chat.id}
          messages={messages}
          scrollRef={messagesEndRef}
        />
      </div>


      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {/* Date separator */}
            <div className="flex justify-center">
              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                Hoje, 18:26
              </span>
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                data-mid={message.id}
                className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl ${
                    message.fromMe
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center justify-end mt-1 space-x-1 ${
                    message.fromMe ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.fromMe && (
                      <div className="flex space-x-0.5">
                        {getMessageStatusIcon(message.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <Tabs defaultValue="reply" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="reply">Responder</TabsTrigger>
            <TabsTrigger value="observation">Observação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reply" className="space-y-4">
            <div className="text-xs text-gray-500 mb-2">
              Aberto até 4 de setembro, 18:56
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Smile className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Keyboard className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Star className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Responda neste campo ou utilize um modelo de mensagem útil e gratuito"
                  className="rounded-full border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white px-4"
              >
                Enviar E Fechar
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white px-4"
              >
                Enviar WhatsApp
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="observation" className="space-y-4">
            <div className="text-xs text-gray-500 mb-2">
              Adicione uma observação interna sobre esta conversa
            </div>
            <Input
              placeholder="Digite sua observação aqui..."
              className="rounded-lg"
            />
            <div className="flex justify-end">
              <Button size="sm" className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
                Salvar Observação
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}