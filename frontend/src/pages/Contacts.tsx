import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  MoreHorizontal,
  User,
  Phone,
  Mail,
  Building,
  Calendar,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Users,
  Tag,
  ChevronDown,
  AlignJustify,
  List,
  Grid,
  Grid3X3,
  MessageCircle,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContactDetailsModal from '@/components/ContactDetailsModal';
import EditContactModal from '@/components/EditContactModal';
import RegisterContactModal from '@/components/RegisterContactModal';
import ButtonTheme from '@/components/ButtonTheme';
import { useWhatsAppConversations } from '@/hooks/useWhatsAppConversations';
import { useWhatsAppContacts } from '@/hooks/useWhatsAppContacts';
import { WhatsAppContactsList } from '@/components/WhatsAppContactsList';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  owner_id: string;
  atendimento_id?: string;
  chat_id?: string;
  business_id?: string;
  name_wpp?: string;
  name: string;
  full_name?: string;
  phone: string;
  email?: string;
  created_at: string;
  updated_at: string;
  // Campos adicionais que podem ser adicionados
  company?: string;
  gender?: string;
  status?: 'active' | 'inactive' | 'lead';
  pipeline?: string;
  tags?: string[];
  whatsapp_opted?: boolean;
  profile_image_url?: string;
  last_contact_at?: string;
}

export default function Contacts() {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const { success, error: showError } = useToast();
  const { updateContactName } = useWhatsAppConversations();
  const { 
    contacts: whatsappContacts, 
    loading: whatsappLoading, 
    syncContacts,
    totalContacts: whatsappTotalContacts,
    onlineContacts: whatsappOnlineContacts,
    aiContacts: whatsappAiContacts
  } = useWhatsAppContacts();
  
  // Funções de atualização
  const handleUpdateContact = async (contactId: string, updatedData: Partial<Contact>) => {
    try {
      console.log('💾 handleUpdateContact: Atualizando contato:', contactId, updatedData);
      
      // Buscar o contato atual para obter o owner_id
      const currentContact = contacts.find(c => c.id === contactId);
      if (!currentContact) {
        throw new Error('Contato não encontrado');
      }
      
      // Preparar dados para atualização no Supabase
      const updateData = {
        ...updatedData,
        updated_at: new Date().toISOString()
      };
      
      console.log('💾 handleUpdateContact: Dados para atualização:', updateData);
      
      // Atualizar no Supabase
      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .eq('owner_id', currentContact.owner_id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ handleUpdateContact: Erro no Supabase:', error);
        throw error;
      }
      
      console.log('✅ handleUpdateContact: Contato atualizado no Supabase:', data);
      
      // Atualizar localmente
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? { ...contact, ...updatedData } : contact
      ));
      
      success('Contato atualizado com sucesso!');
    } catch (error) {
      console.error('❌ handleUpdateContact: Erro ao atualizar contato:', error);
      showError('Erro ao atualizar contato');
    }
  };

  const handleUpdateContactName = async (contactId: string, name: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId);
      if (!contact) return;
      
      // Usar a função do hook WhatsApp para atualizar o nome
      await updateContactName(contactId, name, contact.owner_id);
      
      // Atualizar localmente
      setContacts(prev => prev.map(contact => 
        contact.id === contactId ? { ...contact, name } : contact
      ));
      
      success('Nome do contato atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      showError('Erro ao atualizar nome do contato');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetails(false);
    setShowEditModal(true);
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowEditModal(false);
    setShowContactDetails(true);
  };

  const handleDeleteContact = async (contact: Contact) => {
    // Confirmação simples
    if (!window.confirm(`Tem certeza que deseja excluir o contato "${contact.name}"?`)) {
      return;
    }

    try {
      // Excluir do Supabase
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id)
        .eq('owner_id', contact.owner_id);
      
      if (error) {
        throw error;
      }
      
      // Remover da lista local
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      
      // Fechar modais se estiverem abertos
      setShowContactDetails(false);
      setShowEditModal(false);
      setSelectedContact(null);
      
      success('Contato excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      showError('Erro ao excluir contato');
    }
  };
  
  // Estados
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // Filtros
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'whatsapp'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Dados mockados para desenvolvimento
  const mockContacts: Contact[] = [
    {
      id: '1',
      owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3',
      name: 'Thiago',
      phone: '55863566664',
      email: 'thiago@email.com',
      company: 'Tech Corp',
      gender: 'masculino',
      status: 'active',
      pipeline: 'Qualificação',
      tags: ['Atendido Antes', 'Interessado'],
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-11T14:30:00Z',
      last_contact_at: '2025-01-11T14:30:00Z',
      whatsapp_opted: true
    },
    {
      id: '2',
      owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3',
      name: 'Bruna Silva',
      phone: '5511987654321',
      email: 'bruna@empresa.com',
      company: 'Marketing Plus',
      gender: 'feminino',
      status: 'lead',
      pipeline: 'Proposta',
      tags: ['Recebeu Informações', 'Hot Lead'],
      created_at: '2025-01-08T09:15:00Z',
      updated_at: '2025-01-11T16:45:00Z',
      last_contact_at: '2025-01-11T16:45:00Z',
      whatsapp_opted: true
    },
    {
      id: '3',
      owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3',
      name: 'Manoel Martins',
      phone: '5516999888777',
      email: 'manoel@startup.com',
      company: 'StartupXYZ',
      gender: 'masculino',
      status: 'active',
      pipeline: 'Negociação',
      tags: ['Cliente VIP', 'Follow-up'],
      created_at: '2025-01-05T14:20:00Z',
      updated_at: '2025-01-10T11:30:00Z',
      last_contact_at: '2025-01-10T11:30:00Z',
      whatsapp_opted: true
    }
  ];

  // Carregar contatos
  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      try {
        // Simular carregamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        setContacts(mockContacts);
      } catch (err) {
        showError('Erro', 'Erro ao carregar contatos');
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  // Filtrar contatos
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus;
    const matchesPipeline = selectedPipeline === 'all' || contact.pipeline === selectedPipeline;
    const matchesTags = selectedTags.length === 0 || (contact.tags && selectedTags.some(tag => contact.tags!.includes(tag)));

    return matchesSearch && matchesStatus && matchesPipeline && matchesTags;
  });

  // Handlers

  const handleRegisterContact = () => {
    setShowRegisterModal(true);
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'há 1 dia';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.ceil(diffDays / 7)} semanas`;
    return `há ${Math.ceil(diffDays / 30)} meses`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'lead': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'lead': return 'Lead';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header fixo responsivo ao sidebar */}
        <div 
          className="fixed top-[38px] right-0 bg-white border-b border-gray-200 z-30 transition-all duration-300"
          style={{
            left: sidebarExpanded ? '240px' : '64px'
          }}
        >
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão fixo de toggle da sidebar - SEMPRE VISÍVEL quando colapsada */}
              {!sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={14} />
                </Button>
              )}
              
              {[
                { 
                  id: 'all', 
                  label: 'Todos',
                  icon: Users,
                  active: activeTab === 'all',
                  count: contacts.length
                },
                {
                  id: 'whatsapp', 
                  label: 'Contatos WhatsApp',
                  icon: MessageCircle,
                  active: activeTab === 'whatsapp',
                  count: whatsappTotalContacts
                }
              ].map((button) => {
                const Icon = button.icon;
                return (
                <Button
                    key={button.id}
                    variant="ghost"
                  size="sm"
                    onClick={() => setActiveTab(button.id as 'all' | 'whatsapp')}
                  className={`
                      h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                      ${button.active 
                        ? 'bg-gray-50 text-slate-900 shadow-inner' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {button.label}
                    <Badge variant="secondary" className="ml-2">{button.count}</Badge>
                </Button>
                );
              })}
            </div>
            
            {/* Botões de ação na extrema direita */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                title="Buscar"
              >
                <Search className="h-4 w-4 text-gray-700" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                title="Filtros"
              >
                <Filter className="h-4 w-4 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Barra de filtros funcionais */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Campo de busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  placeholder="Filtrar por nome do contato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Filtros funcionais */}
            <div className="flex items-center gap-2">
              {/* Filtro de Status */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
                  <User className="h-3 w-3 mr-3" />
                  <SelectValue placeholder="Status" />
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Status</SelectItem>
                  <SelectItem value="active" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Ativo</SelectItem>
                  <SelectItem value="lead" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Lead</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Inativo</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Pipeline */}
              <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                <SelectTrigger className="h-7 w-24 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
                  <Building2 className="h-3 w-3 mr-3" />
                  <SelectValue placeholder="Pipeline" />
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Pipeline</SelectItem>
                  <SelectItem value="Qualificação" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Qualificação</SelectItem>
                  <SelectItem value="Proposta" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Proposta</SelectItem>
                  <SelectItem value="Negociação" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Negociação</SelectItem>
                  <SelectItem value="Fechamento" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Fechamento</SelectItem>
                </SelectContent>
              </Select>

              {/* Botão de visualização Lista */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-3 text-xs shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50"
              >
                <List className="h-3 w-3 mr-1" />
                Lista
              </Button>

              {/* Botão de visualização Grid */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 px-3 text-xs shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50"
              >
                <Grid3X3 className="h-3 w-3 mr-1" />
                Grid
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal com padding para o header fixo */}
      <div className="pt-[140px] pl-2 pr-6" style={{minHeight: 'calc(100vh - 38px)'}}>
          <div className="min-h-[600px]">
            <div className="p-6">
              {activeTab === 'all' ? (
                <>
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 ml-3">Carregando contatos...</p>
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Users className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">Nenhum contato encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selection Bar */}
                      {selectedContacts.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-4">
                            <span className="text-sm text-blue-700">
                              {selectedContacts.length} contato(s) selecionado(s)
                </span>
                <Button variant="outline" size="sm">
                  Ações Em Lote
                </Button>
            </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedContacts([])}
                          >
                            Limpar Seleção
                          </Button>
          </div>
                      )}

                      {/* Contacts List/Grid */}
                      {viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pipeline
                      </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Contato
                      </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <tr 
                        key={contact.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewContact(contact)}
                      >
                                  <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleContactSelect(contact.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                        </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                                        {contact.profile_image_url ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                            src={contact.profile_image_url}
                                  alt={contact.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contact.company || '-'}</div>
                          {contact.email && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </div>
                          )}
                        </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Badge className={getStatusColor(contact.status || 'inactive')}>
                                      {getStatusText(contact.status || 'inactive')}
                          </Badge>
                        </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contact.pipeline || '-'}</div>
                        </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(contact.last_contact_at || contact.updated_at)}</div>
                        </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewContact(contact);
                              }}
                                        className="p-2 h-8 w-8"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditContact(contact);
                              }}
                                        className="p-2 h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContact(contact);
                              }}
                                        className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredContacts.map((contact) => (
                            <Card 
                              key={contact.id} 
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleViewContact(contact)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    {contact.profile_image_url ? (
                                      <img
                                        className="h-10 w-10 rounded-full"
                                        src={contact.profile_image_url}
                                        alt={contact.name}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                        <User className="h-6 w-6 text-gray-600" />
                                      </div>
                                    )}
                                    <div>
                                      <h3 className="font-medium text-gray-900">{contact.name}</h3>
                                      <p className="text-sm text-gray-500">{contact.company || 'Sem empresa'}</p>
                                    </div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={selectedContacts.includes(contact.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleContactSelect(contact.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="rounded"
                                  />
                                </div>
                                
                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    {contact.phone}
                                  </div>
                                  {contact.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Mail className="w-4 h-4" />
                                      {contact.email}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(contact.status || 'inactive')}>
                                    {getStatusText(contact.status || 'inactive')}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewContact(contact);
                                      }}
                                      className="p-1 h-6 w-6"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditContact(contact);
                                      }}
                                      className="p-1 h-6 w-6"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <WhatsAppContactsList
                  onContactSelect={handleViewContact}
                  showFilters={true}
                  className="h-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Button
        onClick={handleRegisterContact}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
        style={{
          backgroundColor: '#021529',
          borderColor: '#021529'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#001122';
          e.currentTarget.style.borderColor = '#001122';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#021529';
          e.currentTarget.style.borderColor = '#021529';
        }}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* Modais */}
      {showContactDetails && selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          isOpen={showContactDetails}
          onClose={() => setShowContactDetails(false)}
          onEditContact={handleEditContact}
          onDeleteContact={handleDeleteContact}
        />
      )}

      {showEditModal && selectedContact && (
        <EditContactModal
          contact={selectedContact}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdateContact={handleUpdateContact}
          onUpdateContactName={handleUpdateContactName}
        />
      )}


      {showRegisterModal && (
        <RegisterContactModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onContactCreated={(contact) => {
            setContacts([contact, ...contacts]);
            success('Sucesso', 'Contato criado com sucesso');
          }}
        />
      )}
    </>
  );
}
