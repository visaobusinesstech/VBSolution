
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, Filter, List, LayoutGrid, Search, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';
import { useFunnelStages } from '@/hooks/useFunnelStages';
import { useCompanies } from '@/hooks/useCompanies';
import SalesKanbanPipeline from '@/components/sales/SalesKanbanPipeline';
import CreateLeadModal from '@/components/sales/CreateLeadModal';
import StageManagementModal from '@/components/leads/StageManagementModal';
import SalesFiltersBar from '@/components/sales/SalesFiltersBar';
import SalesTopIndicators from '@/components/sales/SalesTopIndicators';
import ImportCompaniesTab from '@/components/sales/ImportCompaniesTab';
import { Input } from '@/components/ui/input';
import { EnhancedSalesDashboard } from '@/components/dashboard/EnhancedSalesDashboard';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import { ButtonGroup } from '@/components/ui/button-group';

const LeadsAndSales = () => {
  const { leads, loading: leadsLoading, moveLeadToStage, updateLeadStatus, refetch: refetchLeads } = useLeads();
  const { stages, loading: stagesLoading, createStage } = useFunnelStages();
  const { companies, loading: companiesLoading } = useCompanies();

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  // Filtrar leads baseado nos filtros ativos
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company?.fantasy_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesStage = stageFilter === 'all' || lead.stage_id === stageFilter;
    const matchesResponsible = responsibleFilter === 'all' || lead.responsible_id === responsibleFilter;
    const matchesCompany = companyFilter === 'all' || lead.company_id === companyFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesStage && matchesResponsible && matchesCompany;
  });

  const handleMoveToStage = async (leadId: string, stageId: string) => {
    try {
      await moveLeadToStage(leadId, stageId);
      toast({
        title: "Lead movido",
        description: "Lead movido para nova etapa com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover lead",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (leadId: string, status: 'open' | 'won' | 'lost' | 'frozen') => {
    try {
      await updateLeadStatus(leadId, status);
      toast({
        title: "Status atualizado",
        description: `Lead marcado como ${status === 'won' ? 'ganho' : status === 'lost' ? 'perdido' : status === 'frozen' ? 'congelado' : 'ativo'}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const handleSelectLead = (leadId: string, selected: boolean) => {
    if (selected) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) return;

    try {
      for (const leadId of selectedLeads) {
        await updateLeadStatus(leadId, action as 'open' | 'won' | 'lost' | 'frozen');
      }

      setSelectedLeads([]);
      toast({
        title: "Ação em lote concluída",
        description: `${selectedLeads.length} leads atualizados com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao executar ação em lote",
        variant: "destructive",
      });
    }
  };

  const filters = {
    search: searchQuery,
    status: statusFilter,
    priority: priorityFilter,
    stage: stageFilter,
    responsible: responsibleFilter,
    company: companyFilter
  };

  const onFiltersChange = (newFilters: any) => {
    setSearchQuery(newFilters.search || '');
    setStatusFilter(newFilters.status || 'all');
    setPriorityFilter(newFilters.priority || 'all');
    setStageFilter(newFilters.stage || 'all');
    setResponsibleFilter(newFilters.responsible || 'all');
    setCompanyFilter(newFilters.company || 'all');
  };

  if (leadsLoading || stagesLoading || companiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[90%] mx-auto space-y-6 p-6" style={{ backgroundColor: '#f8fafc' }}>
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="importar">Importar Empresas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <EnhancedSalesDashboard />
        </TabsContent>

        <TabsContent value="vendas" className="space-y-4">
          {/* Header compacto estilo Pipedrive */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: '#021529' }}>Funil de Vendas</h1>
              <p className="text-sm text-gray-500 mt-1">{filteredLeads.length} leads ativos</p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle compacto */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={`text-xs px-2 py-1 h-7 font-medium rounded transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  Pipeline
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`text-xs px-2 py-1 h-7 font-medium rounded transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-3 w-3 mr-1" />
                  Lista
                </Button>
              </div>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setIsStageModalOpen(true)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 h-8 px-3"
              >
                <Settings className="h-4 w-4 mr-1" />
                Configurar
              </Button>
              
              <Button 
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                style={{ backgroundColor: '#021529' }}
                className="hover:opacity-90 text-white h-8 px-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Lead
              </Button>
            </div>
          </div>

          {/* Barra de busca e filtros integrados */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar leads, empresas ou tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              
              <AdvancedFilters />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9 px-3"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Indicadores compactos */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <SalesTopIndicators leads={filteredLeads} />
          </div>

          {/* Pipeline Kanban */}
          {viewMode === 'kanban' && (
            <SalesKanbanPipeline
              leads={filteredLeads}
              stages={stages}
              onMoveToStage={handleMoveToStage}
              onUpdateStatus={handleUpdateStatus}
              selectedLeads={selectedLeads}
              onSelectLead={handleSelectLead}
            />
          )}

          {/* Lista de Leads */}
          {viewMode === 'list' && (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <div key={lead.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                          <p className="text-sm text-gray-600">{lead.company?.fantasy_name}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            R$ {lead.value.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-sm text-gray-600">{lead.stage?.name}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="importar">
          <ImportCompaniesTab />
        </TabsContent>
      </Tabs>

      {/* Modal de criação de lead */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        companies={companies}
        stages={stages}
        onLeadCreated={refetchLeads}
      />

      {/* Modal de gerenciamento de etapas */}
      <StageManagementModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        stages={stages}
        onStageCreated={createStage}
      />
    </div>
  );
};

export default LeadsAndSales;
