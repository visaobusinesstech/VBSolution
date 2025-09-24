"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { MessageCircle, Search, Paperclip, Mic, Phone, MoreVertical, Square, ArrowRight, Bot, User, Settings, Save, Plus, X, Edit3, ExternalLink, Bell, Home, Calendar, ChevronDown, Check, Zap, FileText } from "lucide-react";
import { useWhatsAppConversations } from "@/hooks/useWhatsAppConversations";
import { useContactSync } from "@/hooks/useContactSync";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useConnections } from "@/contexts/ConnectionsContext";
import { useConversationDrafts } from "@/hooks/useConversationDrafts";
import { useSearchParams, useNavigate } from "react-router-dom";
import MediaViewer from "../components/MediaViewer";
import { WhatsAppProfilePicture } from "../components/WhatsAppProfilePicture";
import { WhatsAppOptimizedComposer } from "../components/WhatsAppOptimizedComposer";
import ConversationsList from "../components/ConversationsList";
import { getBackupStats } from "../utils/unreadBackup";

/************************************
 * Layout helpers & message bubble   *
 ************************************/
function useViewportHeightFor(ref: React.RefObject<HTMLElement>) {
  const [h, setH] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const fit = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const next = Math.max(0, Math.ceil(vh - top + 1));
      setH(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    window.addEventListener("resize", fit);
    return () => { window.removeEventListener("resize", fit); ro.disconnect(); };
  }, [ref]);
  return h;
}

const isSameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const dayLabel = (d: Date) => { 
  const t = new Date(); 
  const y = new Date(); 
  y.setDate(t.getDate()-1); 
  if(isSameDay(d,t)) return "Hoje"; 
  if(isSameDay(d,y)) return "Ontem"; 
  return d.toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" }); 
};

function groupByDay(list: any[]) { 
  const out: {key:string;date:Date;items:any[]}[]=[]; 
  for(const m of list){ 
    const d=new Date(m.timestamp); 
    const key=d.toISOString().slice(0,10); 
    const last=out[out.length-1]; 
    if(!last||last.key!==key) out.push({ key, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), items:[m]}); 
    else last.items.push(m);
  } 
  return out; 
}

function getInitials(name: string){ 
  return (name||"?").split(" ").map(w=>w.charAt(0)).join("").toUpperCase().slice(0,2);
}

// Função para obter o ícone da plataforma baseado no tipo de conexão
const getPlatformIcon = (connectionType?: string, isWhatsApp?: boolean) => {
  // Se for uma conexão WhatsApp Web, sempre mostrar o ícone do WhatsApp
  if (isWhatsApp || connectionType === 'whatsapp') {
    return (
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      </div>
    );
  }

  // Para outros tipos de conexão, retornar ícones específicos
  switch (connectionType) {
    case 'instagram':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      );
    case 'facebook':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      );
    case 'telegram':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
      );
    default:
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-500 border-2 border-white rounded-full flex items-center justify-center">
          <MessageCircle className="w-2.5 h-2.5 text-white" />
        </div>
      );
  }
};


function MessageBubble({ message, onMediaLoaded, isGroup = false, isLastFromSender = false }: { message: any; onMediaLoaded: () => void; isGroup?: boolean; isLastFromSender?: boolean; }) {
  const t = String(message.message_type || "").toUpperCase();
  const fromClient = message.remetente === "CLIENTE";
  const isAI = message.remetente === "AI";
  const isAgent = message.remetente === "ATENDENTE";
  const { profile } = useUserProfile();
  
  
  return (
    <div className={`flex ${fromClient?"justify-start":"justify-end"} mb-3 gap-2 items-end`}>
      {/* Avatar do cliente - ESQUERDA da bolha */}
      {fromClient && isLastFromSender && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      )}
      
      {/* Espaço vazio para mensagens do cliente que não são a última */}
      {fromClient && !isLastFromSender && (
        <div className="flex-shrink-0 w-8 h-8"></div>
      )}
      
      <div className={`max-w-[75%] px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl ${
        fromClient 
          ? "bg-gray-100 text-gray-900 border border-gray-200" 
          : isAI
          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-200"
          : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200"
      }`}>
        {/* Nome do contato em grupos */}
        {isGroup && fromClient && message.group_contact_name && (
          <div className="text-xs font-semibold text-gray-600 mb-1">
            {message.group_contact_name}
          </div>
        )}
        
        {t === "IMAGEM" && message.media_url && (
          <MediaViewer
            type="IMAGEM"
            mediaUrl={message.media_url}
            mediaMime={message.media_mime}
            fileName={message.fileName}
          />
        )}
        {t === "VIDEO" && message.media_url && (
          <MediaViewer
            type="VIDEO"
            mediaUrl={message.media_url}
            mediaMime={message.media_mime}
            fileName={message.fileName}
          />
        )}
        {t === "AUDIO" && message.media_url && (
          <MediaViewer
            type="AUDIO"
            mediaUrl={message.media_url}
            mediaMime={message.media_mime}
            fileName={message.fileName}
            duration={message.duration_ms ? Math.floor(message.duration_ms / 1000) : undefined}
          />
        )}
        {t === "STICKER" && message.media_url && (
          <MediaViewer
            type="STICKER"
            mediaUrl={message.media_url}
            mediaMime={message.media_mime}
            fileName={message.fileName}
          />
        )}
        {(t === "TEXTO" || !message.media_url) && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.conteudo}</p>
        )}
        <div className={`mt-2 flex items-center justify-between ${
          fromClient
            ? "text-gray-500" 
            : "text-white/80"
        }`}>
          <span className="text-[10px]">
            {new Date(message.timestamp).toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}
          {!fromClient && (
              <>
                <span className="text-white/60"> • </span>
            <span className="text-white/60">
              {isAI ? "IA" : "Você"}
            </span>
              </>
          )}
          </span>
          
          {/* Checkmarks no canto inferior direito */}
          {!fromClient && (
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3">
                <svg viewBox="0 0 16 16" className="w-full h-full">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" fill="currentColor"/>
                </svg>
              </div>
              <div className="w-3 h-3">
                <svg viewBox="0 0 16 16" className="w-full h-full">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" fill="currentColor"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Avatar do atendente - DIREITA da bolha */}
      {isAgent && !fromClient && isLastFromSender && (
        <div className="flex-shrink-0">
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

      {/* Avatar da IA - DIREITA da bolha */}
      {isAI && !fromClient && isLastFromSender && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md bg-blue-100 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      )}
      
      {/* Espaço vazio para mensagens da IA/Atendente que não são a última - manter alinhamento */}
      {!fromClient && !isLastFromSender && (
        <div className="flex-shrink-0 w-8 h-8"></div>
      )}
    </div>
  );
}

// ---- Modern Right panel (ManyChat style) ----
function ContactSummaryPanel({
  ownerId,
  conversation,
  messagesCount,
  onFinalizeConversation,
}: {
  ownerId?: string;
  conversation: { chat_id: string; nome_cliente?: string; numero_cliente?: string; lastMessageAt?: string; status?: string };
  messagesCount: number;
  onFinalizeConversation: () => void;
}) {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiAgentMode, setAiAgentMode] = useState<'human' | 'ai'>('human');
  const [isRegisteringContact, setIsRegisteringContact] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const { getContactByPhone, updateContact, createContact } = useContactSync();
  const navigate = useNavigate();
  const [systemFields] = useState([
    { key: "Primeiro Nome", value: conversation.nome_cliente?.split(' ')[0] || "—" },
    { key: "Sobrenome", value: conversation.nome_cliente?.split(' ').slice(1).join(' ') || "—" }
  ]);

  // Carregar informações do contato
  useEffect(() => {
    const loadContactInfo = async () => {
      if (conversation.numero_cliente && ownerId) {
        setIsLoading(true);
        try {
          const contact = await getContactByPhone(conversation.numero_cliente, ownerId);
          if (contact) {
            setContactInfo(contact);
            setNote(contact.notes || "");
            setTags(contact.tags || []);
            setCustomFields(contact.custom_fields || customFields);
            
            // Carregar estado do agente IA do localStorage primeiro, depois do banco
            const savedMode = localStorage.getItem(`ai_agent_mode_${conversation.numero_cliente}`);
            if (savedMode && (savedMode === 'human' || savedMode === 'ai')) {
              setAiAgentMode(savedMode);
              console.log('🤖 Estado do agente IA carregado do localStorage:', savedMode);
            } else {
              setAiAgentMode(contact.ai_enabled ? 'ai' : 'human');
              console.log('🤖 Estado do agente IA carregado do banco de dados:', contact.ai_enabled ? 'ai' : 'human');
            }
          } else {
            // Se não encontrar contato, carregar do localStorage
            const savedMode = localStorage.getItem(`ai_agent_mode_${conversation.numero_cliente}`);
            if (savedMode && (savedMode === 'human' || savedMode === 'ai')) {
              setAiAgentMode(savedMode);
              console.log('🤖 Estado do agente IA carregado do localStorage (sem contato):', savedMode);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar informações do contato:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadContactInfo();
  }, [conversation.numero_cliente, getContactByPhone, ownerId]);

  // Buscar informações detalhadas do WhatsApp
  useEffect(() => {
    const loadWhatsAppInfo = async () => {
      if (!conversation.chat_id || !ownerId) return;
      
      try {
        // Buscar informações da conversa atual
        const response = await fetch(`/api/baileys-simple/test-conversations?ownerId=${ownerId}`);
        const data = await response.json();
        
        if (data.success && data.conversations) {
          const currentConv = data.conversations.find((conv: any) => conv.chat_id === conversation.chat_id);
          if (currentConv) {
            setContactInfo((prev: any) => ({
              ...prev,
              whatsapp_name: currentConv.whatsapp_name,
              whatsapp_jid: currentConv.whatsapp_jid,
              profile_picture: currentConv.profile_picture,
              whatsapp_business_name: currentConv.whatsapp_business_name,
              whatsapp_business_description: currentConv.whatsapp_business_description,
              whatsapp_business_email: currentConv.whatsapp_business_email,
              whatsapp_business_website: currentConv.whatsapp_business_website,
              whatsapp_business_category: currentConv.whatsapp_business_category,
              whatsapp_verified: currentConv.whatsapp_verified,
              whatsapp_is_group: currentConv.chat_id?.includes('@g.us'),
              whatsapp_group_subject: currentConv.whatsapp_group_subject,
              whatsapp_group_description: currentConv.whatsapp_group_description,
              whatsapp_group_participants: currentConv.whatsapp_group_participants,
              whatsapp_status: currentConv.whatsapp_status
            }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar informações do WhatsApp:', error);
      }
    };

    loadWhatsAppInfo();
  }, [conversation.chat_id, ownerId]);

  // Função para alternar modo do agente IA
  const toggleAiAgentMode = async (newMode: 'human' | 'ai') => {
    console.log('🤖 Alternando modo do agente IA para:', newMode);
    setAiAgentMode(newMode);
    
    // Salvar no localStorage para persistência
    const phoneNumber = conversation.numero_cliente || contactInfo?.phone || 'default';
    localStorage.setItem(`ai_agent_mode_${phoneNumber}`, newMode);
    console.log('🤖 Estado do agente IA salvo no localStorage para:', phoneNumber);
    
    if (contactInfo?.id) {
      try {
        console.log('🤖 Salvando estado do agente IA no banco de dados...');
        console.log('🤖 Contact ID:', contactInfo.id);
        console.log('🤖 New Mode:', newMode);
        console.log('🤖 AI Enabled:', newMode === 'ai');
        
        const result = await updateContact(contactInfo.id, { ai_enabled: newMode === 'ai' });
        console.log('🤖 Resultado da atualização:', result);
        console.log('🤖 Estado do agente IA salvo com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao alterar modo do agente:', error);
        // Reverter em caso de erro
        setAiAgentMode(aiAgentMode);
      }
    } else {
      console.log('⚠️ Contato não encontrado, não é possível salvar estado do agente IA');
    }
  };

  // Função para registrar contato
  const registerContact = async () => {
    if (!conversation.numero_cliente) return;
    
    setIsRegisteringContact(true);
    try {
      const newContact = await createContact({
        name: conversation.nome_cliente || conversation.numero_cliente,
        phone: conversation.numero_cliente,
        whatsapp_name: conversation.nome_cliente,
        email: '',
        notes: note,
        tags: tags,
        custom_fields: customFields,
        ai_enabled: aiAgentMode === 'ai'
      });
      
      setContactInfo(newContact);
      alert('Contato registrado com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar contato:', error);
      alert('Erro ao registrar contato. Tente novamente.');
    } finally {
      setIsRegisteringContact(false);
    }
  };

  // Função para navegar para a página de contatos
  const navigateToContacts = () => {
    if (contactInfo?.id) {
      // Se o contato já está registrado, navegar para a página de contatos com o ID específico
      navigate(`/contacts?edit=${contactInfo.id}`);
    } else {
      // Se não está registrado, navegar para a página de contatos para criar um novo
      navigate('/contacts?create=true');
    }
  };

  const saveNote = async () => {
    if (contactInfo?.id) {
      try {
        await updateContact(contactInfo.id, { notes: note });
        alert("Nota salva com sucesso!");
      } catch (error) {
        console.error('Erro ao salvar nota:', error);
        alert("Erro ao salvar nota. Tente novamente.");
      }
    } else {
      console.log("Nota salva localmente:", note);
      alert("Nota salva localmente!");
    }
  };

  const addTag = async () => {
    if (tagInput.trim()) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput("");
      
      if (contactInfo?.id) {
        try {
          await updateContact(contactInfo.id, { tags: newTags });
        } catch (error) {
          console.error('Erro ao salvar tags:', error);
        }
      }
    }
  };

  const removeTag = async (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    
    if (contactInfo?.id) {
      try {
        await updateContact(contactInfo.id, { tags: newTags });
      } catch (error) {
        console.error('Erro ao remover tag:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header com foto e nome */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <WhatsAppProfilePicture
              jid={conversation.chat_id}
              name={conversation.nome_cliente || conversation.numero_cliente}
              size="lg"
              showPresence={true}
              className="w-16 h-16 rounded-xl shadow-lg"
            />
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900">
                {conversation.chat_id?.includes('@g.us') 
                  ? (contactInfo?.whatsapp_group_subject || `Grupo ${conversation.chat_id.split('@')[0]}`)
                  : (contactInfo?.whatsapp_name || contactInfo?.whatsapp_business_name || conversation.nome_cliente || conversation.numero_cliente)
                }
              </h3>
              <p className="text-sm text-gray-600">{conversation.numero_cliente}</p>
              {contactInfo?.email && (
                <p className="text-sm text-gray-500">{contactInfo.email}</p>
              )}
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5"/>
          </button>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            contactInfo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              contactInfo ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            {contactInfo ? 'Contato Registrado' : 'Não Registrado'}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            WhatsApp
          </span>
        </div>


      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        

        {/* Tags do contato */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Tags do contato</h4>
            <button onClick={() => setTagInput("")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              + Adicionar Tag
            </button>
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {tags.length === 0 ? (
              <span className="text-sm text-gray-500">Nenhuma tag adicionada</span>
            ) : (
              tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          {tagInput !== "" && (
            <div className="flex gap-2">
              <input 
                value={tagInput} 
                onChange={e => setTagInput(e.target.value)} 
                placeholder="Digite a tag..." 
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                autoFocus
              />
              <button 
                onClick={addTag} 
                className="px-3 py-2 text-white rounded-lg text-sm hover:opacity-90"
                style={{ backgroundColor: '#4A5477' }}
              >
                ✓
              </button>
            </div>
          )}
        </section>



        {/* Campos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Campos</h4>
            <button 
              onClick={navigateToContacts}
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 hover:opacity-90"
              style={{ background: 'linear-gradient(45deg, #4A5477 0%, #3F30F1 100%)' }}
            >
              <Edit3 className="w-4 h-4" />
              Editar Contato
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Nome:</span>
              <span className="text-sm font-medium text-gray-900">{conversation.nome_cliente || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Sobrenome:</span>
              <span className="text-sm font-medium text-gray-900">{conversation.nome_cliente?.split(' ').slice(1).join(' ') || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Telefone:</span>
              <span className="text-sm font-medium text-gray-900">{conversation.numero_cliente || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="text-sm font-medium text-gray-900">{conversation.status || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">Mensagens:</span>
              <span className="text-sm font-medium text-gray-900">{messagesCount}</span>
            </div>
            {contactInfo && (
              <>
                {contactInfo.email && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{contactInfo.email}</span>
                  </div>
                )}
                {contactInfo.company && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Empresa:</span>
                    <span className="text-sm font-medium text-gray-900">{contactInfo.company}</span>
                  </div>
                )}
                {contactInfo.whatsapp_name && contactInfo.whatsapp_name !== conversation.nome_cliente && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Nome WhatsApp:</span>
                    <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_name}</span>
                  </div>
                )}
                
                {/* Informações do WhatsApp Business */}
                {contactInfo.whatsapp_business_name && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Negócio:</span>
                    <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_business_name}</span>
                  </div>
                )}
                {contactInfo.whatsapp_business_description && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Descrição:</span>
                    <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_business_description}</span>
                  </div>
                )}
                {contactInfo.whatsapp_business_email && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Email Negócio:</span>
                    <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_business_email}</span>
                  </div>
                )}
                {contactInfo.whatsapp_business_website && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Website:</span>
                    <a href={contactInfo.whatsapp_business_website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {contactInfo.whatsapp_business_website}
                    </a>
                  </div>
                )}
                {contactInfo.whatsapp_business_category && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Categoria:</span>
                    <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_business_category}</span>
                  </div>
                )}
                {contactInfo.whatsapp_verified && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Verificado:</span>
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 rounded-full px-2 py-1">
                      ✓ Verificado
                    </span>
                  </div>
                )}
                
                {/* Informações de Grupo */}
                {contactInfo.whatsapp_is_group && (
                  <>
                    {contactInfo.whatsapp_group_subject && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Nome do Grupo:</span>
                        <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_group_subject}</span>
                      </div>
                    )}
                    {contactInfo.whatsapp_group_description && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Descrição do Grupo:</span>
                        <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_group_description}</span>
                      </div>
                    )}
                    {contactInfo.whatsapp_group_participants && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">Participantes:</span>
                        <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_group_participants}</span>
                      </div>
                    )}
                  </>
                )}
                
                {/* Status do WhatsApp */}
                {contactInfo.whatsapp_status && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium text-gray-900">{contactInfo.whatsapp_status}</span>
                  </div>
                )}
              </>
            )}
            {customFields.length > 0 && (
              customFields.map(field => (
                <div key={field.key} className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-600">{field.key}:</span>
                  <span className="text-sm font-medium text-gray-900 break-all">{field.value}</span>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Footer com ações */}
      <div className="p-6 border-t bg-gray-50 space-y-3">
        {!contactInfo && (
          <button 
            onClick={registerContact}
            disabled={isRegisteringContact}
            className="w-full text-white rounded-lg py-3 font-medium transition-colors flex items-center justify-center gap-2 hover:opacity-90"
            style={{ backgroundColor: '#4A5477' }}
          >
            {isRegisteringContact ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Registrar como Contato
              </>
            )}
          </button>
        )}
        
        <button 
          onClick={onFinalizeConversation} 
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg py-3 font-medium transition-colors"
        >
          Finalizar Conversa
        </button>
        
        <button 
          onClick={() => alert("Converter em Lead")} 
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-3 font-medium transition-colors"
        >
          Converter em Lead
        </button>
      </div>
    </div>
  );
}

/************************************
 * Page component                    *
 ************************************/
export default function WhatsAppPage() {
  const { activeConnection, loadConnections } = useConnections();
  const { profile } = useUserProfile();
  const [searchParams] = useSearchParams();
  const {
    conversations, messages, selectedChatId,
    selectConversation, sendMessageTo, markConversationRead,
    connectSocket, disconnectSocket, loadConversations,
    setConversations, setSelectedChatId, setMessages,
  } = useWhatsAppConversations();

  const { syncWhatsAppContact, getContactByPhone, updateContact } = useContactSync();

  const pageRef = useRef<HTMLDivElement>(null);
  const pageH = useViewportHeightFor(pageRef);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const { drafts, setDraft, getDraft, clearDraft } = useConversationDrafts();
  const [statusFilter, setStatusFilter] = useState<"ATENDENDO"|"AGUARDANDO"|"FINALIZADO">("ATENDENDO");
  
  // Estados para os dropdowns do top bar
  const [attendanceModeDropdown, setAttendanceModeDropdown] = useState(false);
  const [closeOpenDropdown, setCloseOpenDropdown] = useState(false);
  const [closingNotesModal, setClosingNotesModal] = useState(false);
  const [closingNotesSummary, setClosingNotesSummary] = useState("");
  const [conversationCategory, setConversationCategory] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<'human' | 'ai'>('human');
  const [showClosingNotesBox, setShowClosingNotesBox] = useState(false);

  // Definir currentConversation antes de usar nos useEffects
  const currentConversation = useMemo(()=> selectedChatId ? conversations.find(c=>c.chat_id===selectedChatId) || null : null, [selectedChatId, conversations]);

  // Sincronizar contatos do WhatsApp com a tabela de contatos
  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(async (conv) => {
        try {
          await syncWhatsAppContact({
            chat_id: conv.chat_id,
            name: conv.nome_cliente || conv.numero_cliente,
            phone: conv.numero_cliente,
            whatsapp_name: conv.nome_cliente,
            last_message_at: conv.lastMessageAt,
            unread_count: conv.unread,
          });
        } catch (error) {
          console.error('Erro ao sincronizar contato:', error);
        }
      });
    }
  }, [conversations, syncWhatsAppContact]);

  // Carregar estado do attendanceMode quando uma conversa é selecionada
  useEffect(() => {
    if (currentConversation && activeConnection?.id) {
      const loadAttendanceMode = async () => {
        try {
          const phoneNumber = currentConversation.numero_cliente || 'default';
          
          // Primeiro, tentar carregar do localStorage
          const savedMode = localStorage.getItem(`ai_agent_mode_${phoneNumber}`);
          if (savedMode && (savedMode === 'human' || savedMode === 'ai')) {
            setAttendanceMode(savedMode);
            console.log('🔄 AttendanceMode carregado do localStorage:', savedMode);
            return;
          }
          
          // Se não encontrar no localStorage, carregar do banco de dados
          const contact = await getContactByPhone(phoneNumber, activeConnection.id);
          if (contact) {
            const mode = contact.ai_enabled ? 'ai' : 'human';
            setAttendanceMode(mode);
            // Salvar no localStorage para próxima vez
            localStorage.setItem(`ai_agent_mode_${phoneNumber}`, mode);
            console.log('🔄 AttendanceMode carregado do banco de dados:', mode);
          } else {
            // Se não encontrar contato, usar padrão humano
            setAttendanceMode('human');
            console.log('🔄 AttendanceMode definido como padrão (humano)');
          }
        } catch (error) {
          console.error('Erro ao carregar attendanceMode:', error);
          setAttendanceMode('human');
        }
      };
      
      loadAttendanceMode();
    }
  }, [currentConversation, activeConnection?.id, getContactByPhone]);

  // Processar parâmetros de URL para seleção automática de contato
  useEffect(() => {
    const contactId = searchParams.get('contact');
    const phone = searchParams.get('phone');
    
    if (contactId && phone && conversations.length > 0) {
      // Procurar conversa pelo número de telefone
      const conversation = conversations.find(conv => 
        conv.numero_cliente === phone || 
        conv.chat_id.includes(phone.replace(/\D/g, ''))
      );
      
      if (conversation) {
        selectConversation(conversation.chat_id);
      } else {
        // Se não encontrar conversa, criar uma nova conversa ou registrar contato
        console.log('Conversa não encontrada para o contato:', { contactId, phone });
      }
    }
  }, [searchParams, conversations, selectConversation]);
  const [noteMode, setNoteMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => { 
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior, block: "end" });
    }
    
    // Fallback: tentar scroll no container da thread se o bottomRef não funcionar
    if (threadScrollRef.current) {
      threadScrollRef.current.scrollTop = threadScrollRef.current.scrollHeight;
    }
  }, []);
  const onMediaLoaded = useCallback(() => scrollToBottom("smooth"), [scrollToBottom]);

  // Finalizar conversa
  const finalizarConversa = useCallback(async (chatId: string) => {
    if (!activeConnection?.id) return;
    try {
      const conversation = conversations.find(c => c.chat_id === chatId);
      const connectionId = conversation?.connection_id || activeConnection.id;
      await fetch(`/api/baileys-simple/connections/${connectionId}/finalizar-conversa`, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ chatId }) });
      setConversations(conversations.map(c => c.chat_id === chatId ? { ...c, status:"FINALIZADO" } : c));
      setStatusFilter("FINALIZADO");
      setSelectedChatId(null); setMessages([]); setInput("");
    } catch (e) { console.error("finalizarConversa", e); }
  }, [activeConnection?.id, conversations, setConversations, setSelectedChatId, setMessages]);

  // Função para gerar resumo da conversa com IA (últimas 100 mensagens)
  const generateConversationSummary = async () => {
    if (!currentConversation || messages.length === 0) return;
    
    try {
      // Pegar apenas as últimas 100 mensagens
      const recentMessages = messages.slice(-100);
      const conversationText = recentMessages
        .map(m => `${m.remetente}: ${m.conteudo}`)
        .join('\n');
      
      const response = await fetch('/api/ai/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Gere um resumo profissional e claro desta conversa de atendimento. Destaque os pontos principais, problemas resolvidos e próximos passos. Seja conciso mas completo:\n\n${conversationText}`,
          model: 'gpt-4o-mini'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setClosingNotesSummary(result.result || '');
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
    }
  };

  // Função para abrir conversa
  const openConversation = useCallback(async (chatId: string) => {
    try {
      const conversation = conversations.find(c => c.chat_id === chatId);
      const connectionId = conversation?.connection_id || activeConnection.id;
      await fetch(`/api/baileys-simple/connections/${connectionId}/abrir-conversa`, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ chatId }) });
      setConversations(conversations.map(c => c.chat_id === chatId ? { ...c, status:"ATENDENDO" } : c));
      setStatusFilter("ATENDENDO");
    } catch (e) { console.error("openConversation", e); }
  }, [activeConnection?.id, conversations, setConversations]);

  // Função para alternar modo de atendimento
  const toggleAttendanceMode = async (mode: 'human' | 'ai') => {
    if (!currentConversation || !activeConnection?.id) return;
    
    const phoneNumber = currentConversation.numero_cliente || 'default';
    
    // Atualizar estado local
    setAttendanceMode(mode);
    
    // Salvar no localStorage
    localStorage.setItem(`ai_agent_mode_${phoneNumber}`, mode);
    
    console.log(`🔄 Modo de atendimento alterado para: ${mode === 'human' ? 'Você' : 'Agente IA'}`);
    
    // Salvar no banco de dados
    try {
      const contact = await getContactByPhone(phoneNumber, activeConnection.id);
      if (contact) {
        await updateContact(contact.id, { ai_enabled: mode === 'ai' });
        console.log('🔄 Estado do Agente IA salvo no banco de dados');
      } else {
        console.log('⚠️ Contato não encontrado, não é possível salvar no banco de dados');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar estado no banco de dados:', error);
    }
    
    // Notificar o backend sobre a mudança de modo
    try {
      await fetch('/api/baileys-simple/atendimentos/change-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentConversation.chat_id,
          mode: mode,
          connectionId: activeConnection.id
        })
      });
      console.log('🔄 Backend notificado sobre mudança de modo');
    } catch (error) {
      console.error('❌ Erro ao notificar backend:', error);
    }
  };

  // Open chat
  const openChat = useCallback((chatId: string) => {
    console.log('🔄 openChat: Abrindo conversa:', chatId);
    console.log('🔄 openChat: selectedChatId atual:', selectedChatId);
    
    if (selectedChatId === chatId) {
      console.log('⚠️ openChat: Conversa já está selecionada');
      return;
    }
    
    if (selectedChatId && input.trim()) {
      setDraft(selectedChatId, input);
    }
    setInput(getDraft(chatId));
    
    // Usar selectConversation do hook
    selectConversation(chatId, { localMarkRead: true });
    markConversationRead(chatId).catch(console.error);
    
    // Garantir scroll para o final após carregar a conversa
    setTimeout(() => {
      scrollToBottom("auto");
    }, 100);
    
    // Scroll adicional após um tempo maior para garantir que as mensagens foram carregadas
    setTimeout(() => {
      scrollToBottom("auto");
    }, 500);
  }, [selectedChatId, input, setDraft, getDraft, selectConversation, markConversationRead, scrollToBottom]);

  // Keep scrolled to bottom when messages change
  useLayoutEffect(() => { 
    if (!selectedChatId) return; 
    
    // Scroll imediato
    requestAnimationFrame(() => scrollToBottom("auto"));
    
    // Scroll adicional com delay para garantir que o DOM foi atualizado
    setTimeout(() => {
      scrollToBottom("auto");
    }, 50);
  }, [messages, selectedChatId, scrollToBottom]);

  // Scroll to bottom when a new conversation is selected
  useLayoutEffect(() => {
    if (!selectedChatId) return;
    
    // Scroll imediato quando uma nova conversa é selecionada
    requestAnimationFrame(() => scrollToBottom("auto"));
    
    // Scroll com delay para garantir que as mensagens foram carregadas
    const timeoutId = setTimeout(() => {
      scrollToBottom("auto");
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [selectedChatId, scrollToBottom]);

  // Uploads
  async function fakeUpload(file: File): Promise<string> { return URL.createObjectURL(file); }
  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !selectedChatId) return;
    const url = await fakeUpload(file);
    const kind = file.type.startsWith("image/")?"IMAGEM": file.type.startsWith("video/")?"VIDEO":"ARQUIVO";
    const optimistic = { id:`temp-${Date.now()}`, message_id:`temp-${Date.now()}`, chat_id:selectedChatId, conteudo:file.name, message_type:kind as any, media_url:url, remetente:"OPERADOR", timestamp:new Date().toISOString(), lida:true } as any;
    setMessages([...messages, optimistic]); requestAnimationFrame(()=>scrollToBottom("auto"));
    try { await sendMessageTo(selectedChatId, file.name, kind as any, url); } catch {}
  }

  function startRecording(){ 
    if(!navigator.mediaDevices||recording) return; 
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{ 
      const rec=new MediaRecorder(stream); 
      setRecording(rec); 
      setChunks([]); 
      rec.ondataavailable=e=>setChunks(p=>[...p,e.data]); 
      rec.onstop=async()=>{ 
        const blob=new Blob(chunks,{type:"audio/webm"}); 
        const file=new File([blob],`audio-${Date.now()}.webm`,{type:"audio/webm"}); 
        const url=await fakeUpload(file); 
        if(selectedChatId){ 
          const optimistic={ id:`temp-${Date.now()}`, chat_id:selectedChatId, conteudo:"Áudio", message_type:"AUDIO", media_url:url, remetente:"OPERADOR", timestamp:new Date().toISOString(), lida:true } as any; 
          setMessages([...messages,optimistic]); 
          requestAnimationFrame(()=>scrollToBottom("auto")); 
          try{ await sendMessageTo(selectedChatId, "Áudio", "AUDIO", url);}catch{} 
        } 
      }; 
      rec.start(); 
    }).catch(console.error);
  } 
  
  function stopRecording(){ recording?.stop(); setRecording(null); }

  const handleSend = useCallback(async () => {
    const text = input.trim(); 
    if (!text || !selectedChatId) {
      console.log('⚠️ handleSend: Texto vazio ou chatId não selecionado', { text: text?.substring(0, 20), selectedChatId });
      return;
    }
    
    console.log('🚀 handleSend: Iniciando envio', { text: text.substring(0, 20), selectedChatId });
    
    // Limpar input imediatamente
    setInput(""); 
    clearDraft(selectedChatId);
    
    // Criar mensagem otimista
    const optimistic = { 
      id:`temp-${Date.now()}`, 
      message_id:`temp-${Date.now()}`, 
      chat_id:selectedChatId, 
      conteudo:text, 
      message_type:"TEXTO" as const, 
      remetente:"OPERADOR" as const, 
      timestamp:new Date().toISOString(), 
      lida:true 
    };
    
    console.log('📝 handleSend: Criando mensagem otimista', optimistic);
    
    // Adicionar mensagem à lista
    setMessages([...messages, optimistic]);
    
    // Atualizar preview da conversa
    setConversations(conversations.map(c=> 
      c.chat_id===selectedChatId ? {
        ...c, 
        lastMessage:optimistic, 
        lastMessageAt:optimistic.timestamp, 
        lastMessagePreview:text
      } : c
    ));
    
    // Scroll para baixo
    requestAnimationFrame(()=>scrollToBottom("auto"));
    
    // Enviar mensagem via API
    try{ 
      console.log('📤 handleSend: Chamando sendMessageTo');
      await sendMessageTo(selectedChatId, text, "TEXTO"); 
      console.log('✅ handleSend: Mensagem enviada com sucesso');
    } catch(e){ 
      console.error("❌ handleSend: Erro ao enviar mensagem:", e);
      // Opcional: reverter mensagem otimista em caso de erro
    } 
  }, [input, selectedChatId, sendMessageTo, setConversations, scrollToBottom, setMessages, clearDraft]);

  // Boot demo data
  useEffect(()=>{ loadConnections("905b926a-785a-4f6d-9c3a-9455729500b3"); }, [loadConnections]);
  useEffect(()=>{ 
    if(activeConnection?.id && activeConnection?.owner_id){
      // Debug: Mostrar backup local atual
      const backupStats = getBackupStats();
      console.log('💾 Estatísticas do backup local:', backupStats);
      
      loadConversations(activeConnection.owner_id); 
      connectSocket(activeConnection.owner_id);
    } 
    return ()=>disconnectSocket(); 
  }, [activeConnection?.id, activeConnection?.owner_id, loadConversations, connectSocket, disconnectSocket]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setAttendanceModeDropdown(false);
        setCloseOpenDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filters & selection
  const filteredConversations = useMemo(()=>{
    const list = (conversations||[]).filter(c=>c.status===statusFilter);
    const q = search.trim().toLowerCase(); if(!q) return list;
    return list.filter(conv => (conv.nome_cliente||conv.numero_cliente||"").toLowerCase().includes(q) || (conv.lastMessagePreview||"").toLowerCase().includes(q));
  }, [conversations, search, statusFilter]);

  return (
    <div ref={pageRef} style={pageH ? { height: pageH } : undefined} className="w-full overflow-hidden bg-gray-50">
      {/* Global scroll fix */}
      <style>{`html, body, #__next { height: 100%; overflow: hidden; } .app-content, .page-container { min-height: 0; }`}</style>

      {/* Layout com 3 colunas principais */}
      <div className="h-full flex">
        {/* LEFT – conversations list */}
          <aside className="w-96 h-full min-h-0 border-r border-gray-200 bg-white shadow-lg flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"/>
                    <span className="text-sm font-semibold text-green-600">Conectado</span>
            </div>
            </div>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
                <input 
                  value={search} 
                  onChange={(e)=>setSearch(e.target.value)} 
                  placeholder="Buscar conversas..." 
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm bg-white text-sm"
                />
              </div>
              <div className="flex gap-3 justify-center">
              {(["ATENDENDO","AGUARDANDO","FINALIZADO"] as const).map(s => (
                  <button 
                    key={s} 
                    onClick={()=>setStatusFilter(s)} 
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm ${
                      statusFilter===s 
                        ? (s==="AGUARDANDO"?"bg-orange-500":"bg-blue-500")+" text-white shadow-md" 
                        : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                  {s==="ATENDENDO"?"Atendendo":s==="AGUARDANDO"?"Aguardando":"Finalizados"}
                </button>
              ))}
            </div>
          </div>
            <div className="flex-1 overflow-y-auto min-h-0 bg-blue-25 p-3">
              {filteredConversations.map(conv => (
                <button
                  key={conv.chat_id}
                  onClick={() => openChat(conv.chat_id)}
                  className={`w-full text-left mb-2 rounded-xl transition-all duration-200 ${
                    selectedChatId === conv.chat_id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-white hover:bg-blue-25 border border-blue-100'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar com imagem de perfil */}
                      <div className="relative flex-shrink-0">
                        <WhatsAppProfilePicture
                          jid={conv.chat_id}
                          name={conv.nome_cliente || conv.numero_cliente}
                          size="md"
                          className="w-12 h-12 rounded-full"
                        />
                        {/* Ícone do WhatsApp */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate text-base">
                              {conv.chat_id?.includes('@g.us') 
                                ? `Grupo ${conv.chat_id.split('@')[0]}` 
                                : (conv.nome_cliente || conv.numero_cliente || 'Contato')
                              }
                            </h3>
                            <p className="text-sm text-gray-700 truncate mt-0.5">
                              {conv.lastMessage?.conteudo || "—"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                            <span className="text-xs text-gray-500">
                              {conv.lastMessageAt ? (() => {
                                const date = new Date(conv.lastMessageAt);
                                const now = new Date();
                                const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
                                
                                if (diffInHours < 24) {
                                  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                } else if (diffInHours < 48) {
                                  return 'Ontem';
                                } else {
                                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                }
                              })() : ""}
                            </span>
                            {conv.unread > 0 && (
                              <span className="inline-flex items-center justify-center rounded-full bg-green-500 text-white text-xs px-1.5 py-0.5 min-w-[16px] h-4 font-medium">
                                {conv.unread > 99 ? '99+' : conv.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-50"/>
                  <p className="text-sm">Nenhuma conversa encontrada</p>
                  {search && (
                    <p className="text-xs text-gray-400 mt-1">
                      Tente ajustar os filtros ou termo de busca
                    </p>
                  )}
                </div>
              )}
          </div>
        </aside>

        {/* CENTER – thread */}
          <main className="flex-1 h-full min-h-0 flex flex-col bg-white shadow-lg">
          {currentConversation ? (
            <>
              <div className="shrink-0 border-b border-gray-200 px-6 py-4 bg-white shadow-sm">
                <div className="flex items-center gap-4">
                  {/* Foto de perfil do contato */}
                  <WhatsAppProfilePicture
                    jid={currentConversation.chat_id}
                    name={currentConversation.nome_cliente || currentConversation.numero_cliente}
                    size="lg"
                    showPresence={true}
                    className="w-10 h-10 rounded-full shadow-lg"
                  />
                  
                  {/* Nome do contato */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {currentConversation.chat_id?.includes('@g.us') 
                        ? (currentConversation.whatsapp_group_subject || `Grupo ${currentConversation.chat_id.split('@')[0]}`)
                        : (currentConversation.whatsapp_name || currentConversation.whatsapp_business_name || currentConversation.nome_cliente || currentConversation.numero_cliente)
                      }
                    </h3>
                  </div>

                  {/* Dropdown Modo de Atendimento */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setAttendanceModeDropdown(!attendanceModeDropdown)}
                      className="flex items-center gap-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors h-10"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {attendanceMode === 'human' ? 'Você' : 'Agente IA'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {attendanceModeDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => {
                            toggleAttendanceMode('human');
                            setAttendanceModeDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                            attendanceMode === 'human' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <User className="w-4 h-4" />
                          <span>Você</span>
                          {attendanceMode === 'human' && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                        <button
                          onClick={() => {
                            toggleAttendanceMode('ai');
                            setAttendanceModeDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 ${
                            attendanceMode === 'ai' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <Bot className="w-4 h-4" />
                          <span>Agente IA</span>
                          {attendanceMode === 'ai' && <Check className="w-4 h-4 ml-auto" />}
                        </button>
                  </div>
                    )}
                  </div>

                  {/* Ícone de raio (automação) */}
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <Zap className="w-5 h-5" />
                  </button>

                  {/* Ícone de busca */}
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <Search className="w-5 h-5" />
                  </button>

                  {/* Dropdown Close/Open */}
                  <div className="relative dropdown-container">
                    <div className="flex items-center rounded-lg shadow-sm h-10">
                      <button
                        onClick={() => {
                          if (currentConversation.status === 'FINALIZADO') {
                            openConversation(currentConversation.chat_id);
                          } else {
                            setShowClosingNotesBox(!showClosingNotesBox);
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 text-white bg-green-500 hover:bg-green-600 hover:shadow-md transition-all duration-200 rounded-l-lg flex-1 h-full"
                      >
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">Fechar</span>
                      </button>
                      <div className="w-px h-8 bg-white opacity-30"></div>
                      <button
                        onClick={() => {
                          if (currentConversation.status === 'FINALIZADO') {
                            openConversation(currentConversation.chat_id);
                          } else {
                            setShowClosingNotesBox(!showClosingNotesBox);
                          }
                        }}
                        className="flex items-center justify-center px-4 text-white bg-green-500 hover:bg-green-600 hover:shadow-md transition-all duration-200 rounded-r-lg flex-1 h-full"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Closing Notes Box Inline */}
              {showClosingNotesBox && (
                <div className="border-b border-gray-200 bg-white shadow-sm">
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Nota de Fechamento</h2>
                      <button
                        onClick={() => setShowClosingNotesBox(false)}
                        className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria da Conversa
                        </label>
                        <select
                          value={conversationCategory}
                          onChange={(e) => setConversationCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione a categoria da conversa</option>
                          <option value="support">Suporte</option>
                          <option value="sales">Vendas</option>
                          <option value="billing">Cobrança</option>
                          <option value="technical">Técnico</option>
                          <option value="general">Geral</option>
                        </select>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Resumo
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={generateConversationSummary}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Gerar Resumo com IA"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-blue-600 hover:text-blue-800 border-2 border-red-500 rounded"
                              title="Resumo Manual"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">
                            Para economizar tempo, use o recurso Resumir para gerar um resumo claro e profissional da conversa com IA
                          </p>
                        </div>
                        <textarea
                          value={closingNotesSummary}
                          onChange={(e) => setClosingNotesSummary(e.target.value)}
                          placeholder="Adicione um resumo da conversa..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => {
                          setShowClosingNotesBox(false);
                          setClosingNotesSummary("");
                          setConversationCategory("");
                        }}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          // Aqui você pode salvar as notas e fechar a conversa
                          finalizarConversa(currentConversation.chat_id);
                          setShowClosingNotesBox(false);
                          setClosingNotesSummary("");
                          setConversationCategory("");
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Fechar Conversa
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div ref={threadScrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-6 py-6 min-h-0">
                {messages.length===0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="w-12 h-12 mb-4 opacity-50"/>
                    <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
                    <button className="mt-2 text-xs px-3 py-1.5 rounded-full border">Conversas anteriores</button>
                  </div>
                ) : (
                  <div className="flex flex-col justify-end min-h-full">
                    <div className="space-y-6 pb-6">
                      {groupByDay(messages).map(group => (
                        <div key={group.key}>
                          <div className="sticky top-2 z-10 w-full flex justify-center">
                            <span className="text-[11px] bg-white/80 backdrop-blur px-3 py-1 rounded-full border text-gray-600">{dayLabel(group.date)}</span>
                          </div>
                          <div className="mt-2 space-y-4">
                            {group.items.map((m:any, index: number) => {
                              // Determinar se é a última mensagem do mesmo remetente
                              const nextMessage = group.items[index + 1];
                              const isLastFromSender = !nextMessage || nextMessage.remetente !== m.remetente;
                              
                              return (
                              <MessageBubble 
                                key={m.id || m.message_id} 
                                message={m} 
                                onMediaLoaded={onMediaLoaded} 
                                isGroup={currentConversation?.chat_id?.includes('@g.us') || false}
                                  isLastFromSender={isLastFromSender}
                              />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Composer Avançado */}
              <div className="shrink-0">
                <WhatsAppOptimizedComposer
                  jid={selectedChatId || ''}
                  onMessageSent={(message) => {
                    console.log('📨 Mensagem enviada via composer:', message);
                    // Limpar rascunho após enviar
                    clearDraft(selectedChatId || '');
                    setInput('');
                    // Atualizar preview da conversa
                    setConversations(conversations.map(c=> 
                      c.chat_id===selectedChatId ? {
                        ...c, 
                        lastMessage: {
                          chat_id: selectedChatId,
                          conteudo: message.content || message.type,
                          remetente: "OPERADOR" as const,
                          timestamp: new Date().toISOString()
                        },
                        lastMessageAt: new Date().toISOString(),
                        lastMessagePreview: message.content || message.type
                      } : c
                    ));
                    // Scroll para baixo
                    requestAnimationFrame(()=>scrollToBottom("auto"));
                  }}
                  onNoteAdded={async (noteText) => {
                    console.log('📝 Nota adicionada:', noteText);
                  }}
                  onDraftChange={(jid, draft) => {
                    // Atualizar preview da conversa com rascunho
                    setConversations(conversations.map(c=> 
                      c.chat_id===jid ? {
                        ...c, 
                        lastMessagePreview: draft.trim() ? `Rascunho: ${draft}` : (c.lastMessagePreview || "Nenhuma mensagem")
                      } : c
                    ));
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500 max-w-md mx-auto px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4"><MessageCircle className="w-10 h-10 text-green-500"/></div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Selecione uma conversa</h3>
                <p className="text-sm text-gray-500">Escolha uma conversa da lista ao lado para começar a enviar mensagens.</p>
              </div>
            </div>
          )}
        </main>


        {/* RIGHT – contact details */}
          <aside className="w-96 h-full min-h-0 border-l border-gray-200 bg-white shadow-lg flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {currentConversation ? (
              <ContactSummaryPanel
                ownerId={activeConnection?.owner_id}
                conversation={{
                  chat_id: currentConversation.chat_id,
                  nome_cliente: currentConversation.nome_cliente,
                  numero_cliente: currentConversation.numero_cliente,
                  lastMessageAt: currentConversation.lastMessageAt,
                  status: currentConversation.status,
                }}
                messagesCount={messages.length}
                onFinalizeConversation={() => finalizarConversa(currentConversation.chat_id)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center"><MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50"/><p className="text-sm">Selecione uma conversa para ver os detalhes</p></div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}