
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Download, Upload, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLeads } from '@/hooks/useLeads';
import { useFunnelStages } from '@/hooks/useFunnelStages';
import { useCompanies } from '@/hooks/useCompanies';
import PipedriveKanbanBoard from './leads/PipedriveKanbanBoard';
import CreateLeadModal from './leads/CreateLeadModal';
import LeadDetailPanel from './leads/LeadDetailPanel';
import AdvancedFiltersModal from './leads/AdvancedFiltersModal';
import LeadsTopIndicators from './leads/LeadsTopIndicators';
import BulkActionsBar from './leads/BulkActionsBar';
import ExportModal from './leads/ExportModal';

const LeadsAndSales = () => {
  const { leads, loading: leadsLoading, moveLeadToStage, updateLeadStatus, refetch: refetchLeads } = useLeads();
  const { stages, loading: stagesLoading } = useFunnelStages();
  const { companies, loading: companiesLoading } = useCompanies();

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  // Filtrar leads baseado nos filtros ativos
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company?.fantasy_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesStage = stageFilter === 'all' || lead.stage_id === stageFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesStage;
  });

  const handleLeadClick = (leadId: string) => {
    setSelectedLead(leadId);
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead.id);
  };

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

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) return;

    try {
      // Implementar ações em lote baseado no tipo de ação
      switch (action) {
        case 'won':
          for (const leadId of selectedLeads) {
            await updateLeadStatus(leadId, 'won');
          }
          break;
        case 'lost':
          for (const leadId of selectedLeads) {
            await updateLeadStatus(leadId, 'lost');
          }
          break;
        case 'frozen':
          for (const leadId of selectedLeads) {
            await updateLeadStatus(leadId, 'frozen');
          }
          break;
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

  if (leadsLoading || stagesLoading || companiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Find selected lead object
  const selectedLeadObject = selectedLead ? filteredLeads.find(lead => lead.id === selectedLead) : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus leads e oportunidades de vendas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Indicadores superiores */}
      <LeadsTopIndicators leads={filteredLeads} />

      {/* Filtros e busca */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome do lead ou empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status</SelectItem>
                  <SelectItem value="open">Ativo</SelectItem>
                  <SelectItem value="won">Ganho</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                  <SelectItem value="frozen">Congelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Prioridade</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setIsFiltersModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Barra de ações em lote */}
      {selectedLeads.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedLeads.length}
          onSelectAll={handleSelectAll}
          onBulkAction={handleBulkAction}
          onClear={() => setSelectedLeads([])}
        />
      )}

      {/* Board Kanban */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <PipedriveKanbanBoard
          leads={filteredLeads}
          stages={stages}
          onMoveToStage={handleMoveToStage}
          onLeadClick={handleLeadClick}
          onUpdateStatus={handleUpdateStatus}
          onEditLead={handleEditLead}
          selectedLeads={selectedLeads}
          onSelectLead={handleSelectLead}
        />
      </div>

      {/* Modal de criação de lead */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        companies={companies}
        stages={stages}
        onLeadCreated={refetchLeads}
      />

      {/* Painel de detalhes do lead */}
      {selectedLeadObject && (
        <LeadDetailPanel
          lead={selectedLeadObject}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={refetchLeads}
        />
      )}

      {/* Modal de filtros avançados */}
      <AdvancedFiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        onApplyFilters={(filters) => {
          console.log('Aplicando filtros:', filters);
        }}
        stages={stages}
      />

      {/* Modal de exportação */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        leads={filteredLeads}
      />
    </div>
  );
};

export default LeadsAndSales;
