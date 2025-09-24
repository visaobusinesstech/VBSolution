import { useEffect } from "react";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { useConnections } from "@/contexts/ConnectionsContext";

interface ConversationsListProps {
  ownerId?: string;
  onConversationSelect?: (conversationId: string) => void;
}

export default function ConversationsList({ ownerId, onConversationSelect }: ConversationsListProps) {
  const { socket, activeConnection } = useConnections(); // make sure your context exposes these
  const { items, loading, reload, markRead } = useWhatsAppConversations({
    connectionId: activeConnection?.id || "",
    ownerId,
    socket
  });

  useEffect(() => { 
    if (activeConnection?.id) reload(); 
  }, [activeConnection?.id, reload]);

  const handleConversationClick = (conversationId: string) => {
    console.log('🖱️ ConversationsList: Clique na conversa:', conversationId);
    console.log('🖱️ ConversationsList: items disponíveis:', items.length);
    console.log('🖱️ ConversationsList: items:', items.map(i => ({ id: i.id, chat_id: i.chat_id, nome: i.nome_cliente })));
    
    // Mark as read when opening conversation
    markRead(conversationId);
    
    // Call parent handler if provided
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 text-sm text-gray-500">
        {loading ? "Carregando..." : `${items.length} conversas`}
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.map(conv => (
          <button
            key={conv.chat_id}
            onClick={() => handleConversationClick(conv.chat_id)}
            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b flex flex-col"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium truncate">
                {conv.nome_cliente || conv.numero_cliente}
              </div>
              <div className="text-xs text-gray-400 ml-2">
                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString() : ""}
              </div>
            </div>
            <div className="text-sm text-gray-600 truncate mt-1">
              {conv.lastPreview || "—"}
            </div>
            {conv.unread ? (
              <span className="inline-flex mt-1 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] px-2 py-[2px] w-fit">
                {conv.unread}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
