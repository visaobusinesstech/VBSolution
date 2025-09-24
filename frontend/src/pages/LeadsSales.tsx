import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  List, 
  BarChart3, 
  FileText, 
  Settings,
  X,
  ChevronDown,
  MoreHorizontal,
  Phone,
  Mail,
  Building,
  DollarSign,
  Clock,
  User,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  Upload,
  Edit,
  Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CreateDealModal from '@/components/leads/CreateDealModal';
import CreatePipelineModal from '@/components/leads/CreatePipelineModal';
import LeadExpandedModal from '@/components/leads/LeadExpandedModal';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  stage_id: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'won' | 'lost';
  source: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  companies?: {
    name: string;
  };
  funnel_stages?: {
    name: string;
    color: string;
  };
}

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  position: number;
  owner_id: string;
}

interface Pipeline {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

const LeadsSales: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modais e UI
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [showCreatePipeline, setShowCreatePipeline] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [selectedLeadData, setSelectedLeadData] = useState<Lead | null>(null);
  
  // Estados para filtros e visualização
  const [selectedPipeline, setSelectedPipeline] = useState<string>('Pipeline Principal');
  const [activeTab, setActiveTab] = useState('pipeline');
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLeads(),
        loadFunnelStages(),
        loadPipelines(),
        loadCompanies(),
        loadTemplates()
      ]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          companies(name),
          funnel_stages(name, color)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    }
  };

  const loadFunnelStages = async () => {
    try {
      const { data, error } = await supabase
        .from('funnel_stages')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setFunnelStages(data || []);
    } catch (err) {
      console.error('Erro ao carregar estágios:', err);
    }
  };

  const loadPipelines = async () => {
    try {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPipelines(data || []);
    } catch (err) {
      console.error('Erro ao carregar pipelines:', err);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStageId = destination.droppableId;
    const leadId = draggableId;

    try {
      // Atualizar no Supabase
      const { error } = await supabase
        .from('leads')
        .update({ 
          stage_id: newStageId, 
          updated_at: new Date().toISOString() 
        } as any)
        .eq('id', leadId);

      if (error) throw error;

      // Atualizar estado local
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId
            ? { ...lead, stage_id: newStageId, updated_at: new Date().toISOString() }
            : lead
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar lead:', err);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadData(lead);
    setExpandedLead(lead.id);
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'lost': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const leadsByStage = funnelStages.reduce((acc, stage) => {
    acc[stage.id] = filteredLeads.filter(lead => lead.stage_id === stage.id);
    return acc;
  }, {} as Record<string, Lead[]>);

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header fixo no topo */}
      <div className="flex-shrink-0 z-40 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
              
              {/* Seletor de Pipeline */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedPipeline}
                  onChange={(e) => setSelectedPipeline(e.target.value)}
                  className="border-none bg-transparent text-lg font-semibold text-gray-900 focus:outline-none focus:ring-0"
                >
                  <option value="Pipeline Principal">Pipeline Principal</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreatePipeline(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Barra de Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar leads e vendas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Botões de Ação */}
              <Button
                onClick={() => setShowCreateDeal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Abas de navegação */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="flex space-x-1 px-6 py-2">
          <Button
            variant={activeTab === 'pipeline' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('pipeline')}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Pipeline</span>
          </Button>
          <Button
            variant={activeTab === 'lista' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('lista')}
            className="flex items-center space-x-2"
          >
            <List className="h-4 w-4" />
            <span>Lista</span>
          </Button>
          <Button
            variant={activeTab === 'calendario' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('calendario')}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Calendário</span>
          </Button>
          <Button
            variant={activeTab === 'template' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('template')}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Template</span>
          </Button>
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
        </div>
      </div>

      {/* Conteúdo das abas */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'pipeline' && (
          <div className="h-full flex flex-col">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="h-full flex flex-col">
                {/* Cabeçalhos das colunas - Design Pipedrive */}
                <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-200">
                  <div className="flex space-x-6">
                    {funnelStages.map(stage => (
                      <div key={stage.id} className="flex-1 min-w-64">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <h3 className="font-semibold text-gray-900 text-sm">{stage.name}</h3>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {leadsByStage[stage.id]?.length || 0}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {leadsByStage[stage.id]?.reduce((sum, lead) => sum + lead.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • {leadsByStage[stage.id]?.length || 0} deals
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Área dos cards - SCROLLÁVEL HORIZONTALMENTE */}
                <div className="flex-1 flex overflow-x-auto overflow-y-hidden bg-gray-50">
                  {funnelStages.map(stage => (
                    <Droppable key={stage.id} droppableId={stage.id} type="stage">
                      {(provided: any, snapshot: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex-1 min-w-64 p-4"
                        >
                          <div className="space-y-3 h-full overflow-y-auto">
                            {/* Card de adicionar lead - Estilo Pipedrive */}
                            <div 
                              className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors rounded-lg p-4 text-center bg-white"
                              onClick={() => setShowCreateDeal(true)}
                            >
                              <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 font-medium">Adicionar Lead</p>
                            </div>

                            {/* Cards de leads - Estilo Pipedrive */}
                            {leadsByStage[stage.id]?.map((lead, index) => (
                              <Draggable key={lead.id} draggableId={lead.id} index={index + 1}>
                                {(provided: any, snapshot: any) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`cursor-pointer transition-all duration-200 hover:shadow-md bg-white rounded-lg border border-gray-200 p-4 ${
                                      snapshot.isDragging ? 'shadow-lg rotate-1 scale-105' : ''
                                    }`}
                                    onClick={() => handleLeadClick(lead)}
                                  >
                                    <div className="space-y-3">
                                      {/* Header do card */}
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                                            {lead.name}
                                          </h4>
                                          <p className="text-xs text-gray-500 truncate">
                                            {(lead as any).companies?.name || lead.company}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-1 ml-2">
                                          {lead.status === 'won' && (
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          )}
                                          {lead.status === 'lost' && (
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                          )}
                                          {lead.status === 'open' && (
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Valor */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-900">
                                          R$ {lead.value.toLocaleString('pt-BR')}
                                        </span>
                                        <Badge
                                          className={`text-xs ${getPriorityColor(lead.priority)}`}
                                        >
                                          {getPriorityLabel(lead.priority)}
                                        </Badge>
                                      </div>
                                      
                                      {/* Footer do card */}
                                      <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center space-x-1">
                                          <User className="h-3 w-3" />
                                          <span>João Silva</span>
                                        </div>
                                        <span>
                                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>

                {/* Áreas de Drop na parte inferior - Estilo Pipedrive */}
                <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
                  <div className="flex justify-center space-x-8">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <Trash2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">DELETE</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="w-8 h-8 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                      <span className="text-sm font-medium">LOST</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="w-8 h-8 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm font-medium">WON</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="w-8 h-8 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">MOVE/CONVERT</span>
                    </div>
                  </div>
                </div>
              </div>
            </DragDropContext>
          </div>
        )}

        {activeTab === 'lista' && (
          <div className="h-full flex flex-col">
            {/* Cabeçalho com filtros e ações */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lista de Leads</h3>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Exportar CSV</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Exportar XLSX</span>
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Todas as etapas</option>
                    {funnelStages.map(stage => (
                      <option key={stage.id} value={stage.id}>{stage.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Todos os status</option>
                    <option value="open">Aberto</option>
                    <option value="won">Ganho</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Todas as empresas</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">Todos os períodos</option>
                    <option value="today">Hoje</option>
                    <option value="week">Esta semana</option>
                    <option value="month">Este mês</option>
                    <option value="quarter">Este trimestre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cabeçalho da tabela */}
            <div className="flex-shrink-0 px-6 py-3 bg-white border-b">
              <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-600">
                  <span>Cliente</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-600">
                  <span>Empresa</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-600">
                  <span>Produto</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-600">
                  <span>Valor</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-600">
                  <span>Etapa</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-600">
                  <span>Status</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-2 cursor-pointer hover:text-blue-600">
                  <span>Data</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Lista de leads */}
            <div className="flex-1 overflow-y-auto">
              {filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <User className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
                  <p className="text-gray-500">Comece criando seu primeiro lead</p>
                </div>
              ) : (
                filteredLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleLeadClick(lead)}
                  >
                    <div className="grid grid-cols-7 gap-4 items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-900">
                        {(lead as any).companies?.name || lead.company}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Produto
                      </div>
                      
                      <div className="text-sm font-medium text-gray-900">
                        R$ {lead.value.toLocaleString('pt-BR')}
                      </div>
                      
                      <div>
                        <Badge
                          className="text-xs"
                          style={{
                            backgroundColor: (lead as any).funnel_stages?.color || '#6B7280',
                            color: 'white'
                          }}
                        >
                          {(lead as any).funnel_stages?.name || 'Sem etapa'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(lead.status)}
                        <span className="text-sm text-gray-600 capitalize">
                          {lead.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginação */}
            <div className="flex-shrink-0 px-6 py-4 bg-white border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {filteredLeads.length} de {leads.length} leads
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" className="bg-blue-600 text-white">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    2
                  </Button>
                  <Button variant="outline" size="sm">
                    3
                  </Button>
                  <Button variant="outline" size="sm">
                    Próximo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendario' && (
          <div className="h-full flex flex-col">
            {/* Cabeçalho do calendário */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900">Calendário de Atividades</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">Hoje</Button>
                    <Button variant="outline" size="sm">Mês</Button>
                    <Button variant="outline" size="sm">Semana</Button>
                    <Button variant="outline" size="sm">Dia</Button>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <ChevronDown className="h-4 w-4" />
                    <span>Janeiro 2024</span>
                  </Button>
                  <Button 
                    onClick={() => setShowCreateDeal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Atividade
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendário */}
            <div className="flex-1 p-6">
              <div className="bg-white rounded-lg border border-gray-200 h-full">
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 border-b border-gray-200">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="p-4 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid do calendário */}
                <div className="grid grid-cols-7 h-full">
                  {/* Dias do mês */}
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 6; // Começar do dia 1
                    const isCurrentMonth = day > 0 && day <= 31;
                    const isToday = day === 21; // Exemplo: hoje é dia 21
                    
                    return (
                      <div 
                        key={i} 
                        className={`border-r border-b border-gray-200 last:border-r-0 p-2 min-h-24 ${
                          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'bg-blue-50' : ''}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        } ${isToday ? 'text-blue-600' : ''}`}>
                          {isCurrentMonth ? day : ''}
                        </div>
                        
                        {/* Eventos do dia */}
                        <div className="space-y-1">
                          {isCurrentMonth && day === 15 && (
                            <div className="bg-blue-100 text-blue-800 text-xs p-1 rounded cursor-pointer hover:bg-blue-200">
                              Reunião com Cliente A
                            </div>
                          )}
                          {isCurrentMonth && day === 18 && (
                            <div className="bg-green-100 text-green-800 text-xs p-1 rounded cursor-pointer hover:bg-green-200">
                              Demo Produto B
                            </div>
                          )}
                          {isCurrentMonth && day === 22 && (
                            <div className="bg-purple-100 text-purple-800 text-xs p-1 rounded cursor-pointer hover:bg-purple-200">
                              Follow-up Lead C
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="h-full flex flex-col">
            {/* Cabeçalho */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar templates..."
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button 
                    onClick={() => setShowCreateTemplate(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                  </Button>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex-shrink-0 px-6 py-3 bg-white border-b">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Plataforma:</label>
                  <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                    <option value="">Todas</option>
                    <option value="email">E-mail</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="proposta">Proposta</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Categoria:</label>
                  <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                    <option value="">Todas</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="proposta">Proposta</option>
                    <option value="agendamento">Agendamento</option>
                    <option value="lembrete">Lembrete</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lista de templates */}
            <div className="flex-1 overflow-y-auto p-6">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
                  <p className="text-gray-500 mb-4">Crie seu primeiro template para começar</p>
                  <Button onClick={() => setShowCreateTemplate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{template.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {template.platform}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                          {template.body}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}</span>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              Usar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700">
                              Duplicar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="h-full flex flex-col">
            {/* Cabeçalho do Dashboard */}
            <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Dashboard de Métricas</h3>
                <div className="flex items-center space-x-3">
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="7days">Últimos 7 dias</option>
                    <option value="30days">Últimos 30 dias</option>
                    <option value="90days">Últimos 90 dias</option>
                    <option value="custom">Período customizado</option>
                  </select>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>

            {/* Métricas principais */}
            <div className="flex-shrink-0 px-6 py-4 bg-white border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total de Leads */}
                <Card className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                        <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600">+12%</span>
                      <span className="text-gray-500 ml-1">vs mês anterior</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Leads Ganhos */}
                <Card className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Leads Ganhos</p>
                        <p className="text-2xl font-bold text-green-600">
                          {leads.filter(lead => lead.status === 'won').length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600">+8%</span>
                      <span className="text-gray-500 ml-1">vs mês anterior</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Leads Perdidos */}
                <Card className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Leads Perdidos</p>
                        <p className="text-2xl font-bold text-red-600">
                          {leads.filter(lead => lead.status === 'lost').length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-600">+3%</span>
                      <span className="text-gray-500 ml-1">vs mês anterior</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Taxa de Conversão */}
                <Card className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {leads.length > 0 ? 
                            Math.round((leads.filter(lead => lead.status === 'won').length / leads.length) * 100) : 0}%
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600">+5%</span>
                      <span className="text-gray-500 ml-1">vs mês anterior</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Gráficos */}
            <div className="flex-1 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Gráfico de Leads por Etapa */}
                <Card className="p-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-lg font-semibold">Leads por Etapa</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      {funnelStages.map(stage => {
                        const stageLeads = leadsByStage[stage.id]?.length || 0;
                        const percentage = leads.length > 0 ? (stageLeads / leads.length) * 100 : 0;
                        return (
                          <div key={stage.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: stage.color }}
                                />
                                <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                              </div>
                              <span className="text-sm text-gray-500">{stageLeads} leads</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  backgroundColor: stage.color,
                                  width: `${percentage}%`
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico de Valores por Etapa */}
                <Card className="p-6">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-lg font-semibold">Valores por Etapa</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      {funnelStages.map(stage => {
                        const stageValue = leadsByStage[stage.id]?.reduce((sum, lead) => sum + lead.value, 0) || 0;
                        const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
                        const percentage = totalValue > 0 ? (stageValue / totalValue) * 100 : 0;
                        return (
                          <div key={stage.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: stage.color }}
                                />
                                <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                              </div>
                              <span className="text-sm text-gray-500">
                                R$ {stageValue.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  backgroundColor: stage.color,
                                  width: `${percentage}%`
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão flutuante de novo lead */}
      <Button
        onClick={() => setShowCreateDeal(true)}
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
        <Plus className="h-5 w-5 text-white" />
      </Button>

      {/* Modais */}
      <CreateDealModal
        open={showCreateDeal}
        onClose={() => setShowCreateDeal(false)}
        onLeadCreated={() => {
          loadLeads();
          setShowCreateDeal(false);
        }}
      />
      
      <CreatePipelineModal 
        open={showCreatePipeline} 
        onClose={() => setShowCreatePipeline(false)}
        onPipelineCreated={(pipeline) => {
          loadPipelines(); // Recarregar pipelines
          setSelectedPipeline(pipeline.name);
          setShowCreatePipeline(false);
        }}
      />

      <LeadExpandedModal
        lead={selectedLeadData}
        isOpen={!!expandedLead}
        onClose={() => setExpandedLead(null)}
        onEdit={() => {}}
      />
    </div>
  );
};

export default LeadsSales;