"use client";

import { useState, useMemo } from 'react';
import { Search, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useWhatsAppV2Conversations } from '@/hooks/useWhatsAppV2Conversations';

interface WhatsAppV2ConversationsListProps {
  ownerId: string;
  onSelectConversation: (conversation: any) => void;
  selectedConversationId?: string;
}

export default function WhatsAppV2ConversationsList({
  ownerId,
  onSelectConversation,
  selectedConversationId
}: WhatsAppV2ConversationsListProps) {
  const [search, setSearch] = useState('');
  const { conversations, loading, error, markAsRead } = useWhatsAppV2Conversations(ownerId);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    
    const searchLower = search.toLowerCase();
    return conversations.filter(conv => 
      (conv.nome_cliente || '').toLowerCase().includes(searchLower) ||
      (conv.numero_cliente || '').toLowerCase().includes(searchLower) ||
      (conv.lastPreview || '').toLowerCase().includes(searchLower)
    );
  }, [conversations, search]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AGUARDANDO':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ATENDENDO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ENCERRADO':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGUARDANDO':
        return 'bg-yellow-100 text-yellow-800';
      case 'ATENDENDO':
        return 'bg-green-100 text-green-800';
      case 'ENCERRADO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 168) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleConversationClick = async (conversation: any) => {
    // Marcar como lida
    await markAsRead(conversation.id);
    
    // Selecionar conversa
    onSelectConversation(conversation);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
        <p className="text-sm">Carregando conversas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversas</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <MessageCircle className="h-8 w-8 mb-2" />
            <p className="text-sm text-center">
              {search ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium text-sm">
                        {(conversation.nome_cliente || conversation.numero_cliente).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.nome_cliente || conversation.numero_cliente}
                      </h3>
                      <div className="flex items-center gap-2">
                        {conversation.unread > 0 && (
                          <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                            {conversation.unread}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.ultima_mensagem)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastPreview || 'Nenhuma mensagem'}
                      </p>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(conversation.status)}
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                      </div>
                    </div>

                    {/* Priority indicator */}
                    {conversation.prioridade > 1 && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Prioridade {conversation.prioridade}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {filteredConversations.length} conversa{filteredConversations.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
