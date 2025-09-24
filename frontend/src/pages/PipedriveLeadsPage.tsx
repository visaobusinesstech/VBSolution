import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Download, Import, Search, Zap, Kanban, List, Clock, Calendar, BarChart3, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';
import { useCompanies } from '@/hooks/useCompanies';
import { useFunnelStages } from '@/hooks/useFunnelStages';
import { useTheme } from '@/contexts/ThemeContext';
import PipelineKanban from '@/components/leads/PipelineKanban';
import LeadsTopIndicators from '@/components/leads/LeadsTopIndicators';
import LeadsFiltersBar from '@/components/leads/LeadsFiltersBar';
import CreateLeadModal from '@/components/leads/CreateLeadModal';
import ImportCompaniesModal from '@/components/leads/ImportCompaniesModal';
import ActivitiesHistoryTab from '@/components/leads/ActivitiesHistoryTab';
import ReportsIndicatorsTab from '@/components/leads/ReportsIndicatorsTab';
import StageManagementModal from '@/components/leads/StageManagementModal';

const PipedriveLeadsPage = () => {
  const { leads, loading: leadsLoading, moveLeadToStage, updateLeadStatus, refetch: refetchLeads } = useLeads();
  const { companies, loading: companiesLoading } = useCompanies();
  const { stages, loading: stagesLoading, createStage } = useFunnelStages();
  const { topBarColor } = useTheme();
  
  const [activeTab, setActiveTab] = useState('pipeline');
  const [viewMode, setViewMode] = useState<'pipeline' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard'>('pipeline');
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isStageManagementOpen, setIsStageManagementOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    responsible: '',
    stage: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Função para mudar modo de visualização
  const handleViewModeChange = (mode: 'pipeline' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard') => {
    setViewMode(mode);
    // Mapear para as abas existentes
    if (mode === 'pipeline') setActiveTab('pipeline');
    else if (mode === 'lista') setActiveTab('activities');
    else if (mode === 'dashboard') setActiveTab('reports');
    else setActiveTab('pipeline'); // fallback
  };

  // Aplicar filtros
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !filters.search || 
      lead.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (lead.company?.fantasy_name || '').toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCompany = !filters.company || lead.company_id === filters.company;
    const matchesResponsible = !filters.responsible || lead.responsible_id === filters.responsible;
    const matchesStage = !filters.stage || lead.stage_id === filters.stage;
    const matchesStatus = filters.status === 'all' || lead.status === filters.status;

    return matchesSearch && matchesCompany && matchesResponsible && matchesStage && matchesStatus;
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
        description: "Status do lead atualizado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive",
      });
    }
  };

  // Função para focar no campo de busca
  const handleSearchIconClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) return;

    try {
      for (const leadId of selectedLeads) {
        if (action === 'won' || action === 'lost' || action === 'frozen') {
          await updateLeadStatus(leadId, action as 'won' | 'lost' | 'frozen');
        }
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

  if (leadsLoading || companiesLoading || stagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Botões de visualização adaptados para leads
  const viewButtons = [
    { 
      id: 'pipeline', 
      label: 'Pipeline',
      icon: Kanban,
      active: viewMode === 'pipeline'
    },
    {
      id: 'lista', 
      label: 'Lista',
      icon: List,
      active: viewMode === 'lista'
    },
    {
      id: 'prazo', 
      label: 'Prazo',
      icon: Clock,
      active: viewMode === 'prazo'
    },
    {
      id: 'planejador', 
      label: 'Planejador',
      icon: Kanban,
      active: viewMode === 'planejador'
    },
    {
      id: 'calendario', 
      label: 'Calendário',
      icon: Calendar,
      active: viewMode === 'calendario'
    },
    {
      id: 'dashboard', 
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação e filtros - alinhada perfeitamente */}
      <div className="bg-white -mt-6 -mx-6">
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {viewButtons.map((button) => {
                const Icon = button.icon;
                return (
                <Button
                    key={button.id}
                    variant="ghost"
                  size="sm"
                    onClick={() => handleViewModeChange(button.id as any)}
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
                onClick={handleSearchIconClick}
              >
                <Search className="h-4 w-4 text-gray-700" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsAutomationModalOpen(true)}
                title="Automações"
              >
                <Zap className="h-4 w-4 text-gray-700" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStageManagementOpen(true)}
                className="h-8 px-3 text-xs"
              >
                <Settings className="h-4 w-4 mr-1" />
                Etapas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="h-8 px-3 text-xs"
              >
                <Import className="h-4 w-4 mr-1" />
                Importar
              </Button>
              <Button
                onClick={() => setIsCreateLeadModalOpen(true)}
                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Lead
              </Button>
            </div>
          </div>
        </div>

        {/* Indicadores superiores */}
        <div className="px-6 py-4 border-b border-gray-200">
          <LeadsTopIndicators leads={filteredLeads} />
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 border-b border-gray-200">
          <LeadsFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            companies={companies}
            stages={stages}
            selectedCount={selectedLeads.length}
            onBulkAction={handleBulkAction}
            onClearSelection={() => setSelectedLeads([])}
            searchInputRef={searchInputRef}
          />
        </div>
      </div>

      {/* Container principal com padding otimizado */}
      <div className="px-1 pt-3">
        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'pipeline' && (
          <div className="w-full">
            <PipelineKanban
              leads={filteredLeads}
              stages={stages}
              onMoveToStage={handleMoveToStage}
              onUpdateStatus={handleUpdateStatus}
              selectedLeads={selectedLeads}
              onSelectLead={(leadId, selected) => {
                if (selected) {
                  setSelectedLeads(prev => [...prev, leadId]);
                } else {
                  setSelectedLeads(prev => prev.filter(id => id !== leadId));
                }
              }}
            />
          </div>
        )}

        {viewMode === 'lista' && (
          <div className="w-full">
            <ActivitiesHistoryTab leads={filteredLeads} />
          </div>
        )}

        {viewMode === 'dashboard' && (
          <div className="w-full">
            <ReportsIndicatorsTab leads={filteredLeads} stages={stages} />
          </div>
        )}

        {/* Para os outros modos, usar pipeline como fallback */}
        {(viewMode === 'prazo' || viewMode === 'planejador' || viewMode === 'calendario') && (
          <div className="w-full">
            <PipelineKanban
              leads={filteredLeads}
              stages={stages}
              onMoveToStage={handleMoveToStage}
              onUpdateStatus={handleUpdateStatus}
              selectedLeads={selectedLeads}
              onSelectLead={(leadId, selected) => {
                if (selected) {
                  setSelectedLeads(prev => [...prev, leadId]);
                } else {
                  setSelectedLeads(prev => prev.filter(id => id !== leadId));
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Botão flutuante + no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsCreateLeadModalOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
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
          size="lg"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Modals */}
      <CreateLeadModal
        isOpen={isCreateLeadModalOpen}
        onClose={() => setIsCreateLeadModalOpen(false)}
        companies={companies}
        stages={stages}
        onLeadCreated={refetchLeads}
      />

      <ImportCompaniesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <StageManagementModal
        isOpen={isStageManagementOpen}
        onClose={() => setIsStageManagementOpen(false)}
        stages={stages}
        onStageCreated={createStage}
      />

      {/* Modal de Automações */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAutomationModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Automatize</h2>
                <button
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 py-6">
              <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Espaço para futuras automações de leads</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipedriveLeadsPage;
