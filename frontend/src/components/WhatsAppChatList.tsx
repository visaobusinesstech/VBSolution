import { useState } from "react";
import { Search, MessageCircle } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { useConnections } from "@/contexts/ConnectionsContext";

export default function WhatsAppChatList({
  active,
  onSelect,
  ownerId,
}: {
  active?: { connectionId: string; chatId: string; atendimentoId: string } | null;
  onSelect: (c: { connectionId: string; chatId: string; atendimentoId: string }) => void;
  ownerId: string;
}) {
  const [q, setQ] = useState("");
  const { data: items = [], isLoading } = useConversations({ ownerId, q });
  const { activeConnection } = useConnections();

  return (
    <div className="h-full flex flex-col">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {isLoading && <div className="p-3 text-xs text-gray-500">Carregando…</div>}
        {!isLoading && items.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">Nenhuma conversa encontrada</div>
        )}

        <ul className="space-y-1">
          {items.map((c) => {
            const selected = active?.atendimentoId === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() =>
                    onSelect({
                      connectionId: activeConnection?.id ?? "whatsapp-web-teste",
                      chatId: c.chat_id ?? c.numero_cliente,
                      atendimentoId: c.id,
                    })
                  }
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${
                    selected ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 grid place-items-center overflow-hidden">
                      <MessageCircle className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.nome_cliente ?? c.numero_cliente}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {c.ultima_mensagem_preview ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-gray-400">
                      {c.ultima_mensagem_em
                        ? new Date(c.ultima_mensagem_em).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                    {c.nao_lidas > 0 && (
                      <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                        {c.nao_lidas}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}