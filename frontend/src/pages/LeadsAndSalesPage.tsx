import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeadsAndSales from '@/components/LeadsAndSales';
import SalesReports from '@/components/SalesReports';
import LeadsFilters from '@/components/leads/LeadsFilters';
import CreateLeadModal from '@/components/sales/CreateLeadModal';
import StageManagementModal from '@/components/sales/StageManagementModal';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';
import PipelineKanban from '@/components/leads/PipelineKanban';
import SalesKanbanPipeline from '@/components/sales/SalesKanbanPipeline';
import SalesTopIndicators from '@/components/sales/SalesTopIndicators';
import SalesFiltersBar from '@/components/sales/SalesFiltersBar';
import BulkActionsBar from '@/components/leads/BulkActionsBar';
import ImportCompaniesTab from '@/components/sales/ImportCompaniesTab';
import { useLeads } from '@/hooks/useLeads';
import { useFunnelStages } from '@/hooks/useFunnelStages';
import { useCompanies } from '@/hooks/useCompanies';
import { 
  Plus,
  Settings,
  List,
  BarChart3,
  Kanban,
  Settings2,
  FileText,
  Upload
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const LeadsAndSalesPage = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('leads');
  const [filters, setFilters] = useState({
    search: '',
    company: 'all',
    responsible: 'all',
    stage: 'all',
    status: 'all',
    priority: 'all'
  });

  const { leads, loading, createLead, updateLead, moveLeadToStage, updateLeadStatus, refetch } = useLeads();
  const { stages, loading: stagesLoading, createStage } = useFunnelStages();
  const { companies, loading: companiesLoading } = useCompanies();

  const viewButtons = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'list', label: 'Lista', icon: List },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'import', label: 'Importar', icon: Upload },
  ];

  const handleSelectLead = (leadId: string, selected: boolean) => {
    if (selected) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads?.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads?.map(l => l.id) || []);
    }
  };

  const handleMoveToStage = async (leadId: string, stageId: string) => {
    try {
      await moveLeadToStage(leadId, stageId);
      toast({
        title: "Lead movido",
        description: "Lead foi movido para a nova etapa com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover o lead",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (leadId: string, status: 'open' | 'won' | 'lost' | 'frozen') => {
    try {
      await updateLeadStatus(leadId, status);
      toast({
        title: "Status atualizado",
        description: "Status do lead foi atualizado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  const handleLeadCreated = async () => {
    try {
      setIsCreateModalOpen(false);
      await refetch();
      toast({
        title: "Lead criado",
        description: "Novo lead foi criado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o lead",
        variant: "destructive"
      });
    }
  };

  const handleStageCreated = async () => {
    try {
      await refetch();
      toast({
        title: "Etapa criada",
        description: "Nova etapa foi criada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a etapa",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    // Implementation for bulk actions
    console.log('Bulk action:', action, 'for leads:', selectedLeads);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const selectedLeadObject = selectedLead ? leads?.find(lead => lead.id === selectedLead) || null : null;

  // Calculate stats for SalesReports
  const totalRevenue = leads?.reduce((sum, lead) => {
    return lead.status === 'won' ? sum + lead.value : sum;
  }, 0) || 0;

  const newCompaniesThisMonth = companies?.filter(company => {
    const createdDate = new Date(company.created_at);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length || 0;

  if (loading || stagesLoading || companiesLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Funil de Vendas</h1>
            <p className="text-gray-600 mt-1">Gerencie seu funil de vendas e leads</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsStageModalOpen(true)}
              className="bg-white border-gray-300 hover:bg-gray-50"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Gerenciar Etapas
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Lead
            </Button>
          </div>
        </div>

        {/* View Selection Buttons */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {viewButtons.map((button) => {
            const Icon = button.icon;
            return (
              <Button
                key={button.id}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 text-sm px-4 py-2 h-9 font-medium rounded-md transition-all ${
                  activeView === button.id
                    ? 'bg-white text-black shadow-sm border border-gray-300'
                    : 'text-gray-600 hover:text-black hover:bg-white/50'
                }`}
                onClick={() => setActiveView(button.id)}
              >
                <Icon className="h-4 w-4" />
                {button.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'dashboard' && (
          <div className="p-6">
            <SalesTopIndicators leads={leads || []} />
          </div>
        )}

        {activeView === 'kanban' && (
          <div className="p-6">
            <SalesFiltersBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              companies={companies || []}
              stages={stages || []}
            />
            <div className="mt-6">
              <SalesKanbanPipeline
                leads={leads || []}
                stages={stages || []}
                onMoveToStage={handleMoveToStage}
                onUpdateStatus={handleUpdateStatus}
                selectedLeads={selectedLeads}
                onSelectLead={handleSelectLead}
              />
            </div>
          </div>
        )}

        {activeView === 'list' && (
          <div className="p-6">
            <SalesFiltersBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              companies={companies || []}
              stages={stages || []}
            />
            <LeadsAndSales />
          </div>
        )}

        {activeView === 'reports' && (
          <div className="p-6">
            <SalesReports 
              companies={companies || []}
              totalRevenue={totalRevenue}
              newCompaniesThisMonth={newCompaniesThisMonth}
            />
          </div>
        )}

        {activeView === 'import' && (
          <div className="p-6">
            <ImportCompaniesTab />
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedLeads.length}
          onSelectAll={handleSelectAll}
          onBulkAction={handleBulkAction}
          onClear={() => setSelectedLeads([])}
        />
      )}

      {/* Side Panel for Lead Details */}
      {selectedLeadObject && (
        <LeadDetailPanel
          lead={selectedLeadObject}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={() => {}}
        />
      )}

      {/* Modals */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        companies={companies}
        stages={stages}
        onLeadCreated={handleLeadCreated}
      />

      <StageManagementModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        stages={stages || []}
        onStageCreated={handleStageCreated}
      />
    </div>
  );
};

export default LeadsAndSalesPage;
