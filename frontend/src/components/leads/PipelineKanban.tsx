import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  MoreHorizontal, 
  Euro, 
  User, 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  product?: string;
  negotiated_price: number;
  expected_close_date?: string;
  pipeline_stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'won' | 'lost';
  assigned_to?: string;
  avatar?: string;
}

interface PipelineKanbanProps {
  leads: Lead[];
  onLeadUpdate: (leads: Lead[]) => void;
}

const PipelineKanban: React.FC<PipelineKanbanProps> = ({ leads, onLeadUpdate }) => {
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Definição das colunas do pipeline (inspirado no Pipedrive)
  const pipelineStages = [
    {
      id: 'qualified',
      name: 'Qualified',
      color: '#10b981',
      order: 1
    },
    {
      id: 'contact_made',
      name: 'Contact Made',
      color: '#3b82f6',
      order: 2
    },
    {
      id: 'demo_scheduled',
      name: 'Demo Scheduled',
      color: '#8b5cf6',
      order: 3
    },
    {
      id: 'proposal_made',
      name: 'Proposal Made',
      color: '#f59e0b',
      order: 4
    },
    {
      id: 'negotiations_started',
      name: 'Negotiations Started',
      color: '#ef4444',
      order: 5
    }
  ];

  // Agrupar leads por estágio
  const leadsByStage = pipelineStages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => lead.pipeline_stage === stage.id);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Calcular totais por estágio
  const getStageTotals = (stageId: string) => {
    const stageLeads = leadsByStage[stageId] || [];
    const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.negotiated_price || 0), 0);
    const dealCount = stageLeads.length;
    
    return {
      totalValue: totalValue.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }),
      dealCount
    };
  };

  // Função para iniciar o drag
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLead(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Função para permitir drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Função para finalizar o drop
  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    
    if (draggedLead) {
      // Atualizar o lead com o novo estágio
      const updatedLeads = leads.map(lead => 
        lead.id === draggedLead 
          ? { ...lead, pipeline_stage: targetStage }
          : lead
      );
      
      onLeadUpdate(updatedLeads);
      
      // Aqui você pode adicionar uma chamada para API para salvar no banco
      // updateLeadStage(draggedLead, targetStage);
    }
    
    setDraggedLead(null);
  };

  // Função para obter ícone de status
  const getStatusIcon = (lead: Lead) => {
    if (lead.status === 'won') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (lead.status === 'lost') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (lead.priority === 'urgent') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (lead.priority === 'high') {
      return <TrendingUp className="w-4 h-4 text-orange-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-green-500" />;
  };

  // Função para obter cor do card baseada na prioridade
  const getCardBorderColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-400';
      default: return 'border-l-gray-400';
    }
  };

  // Componente do card de lead
  const LeadCard: React.FC<{ lead: Lead }> = ({ lead }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, lead.id)}
      className={`
        bg-white rounded-lg shadow-sm border-l-4 p-4 cursor-move hover:shadow-md transition-all duration-200
        ${getCardBorderColor(lead.priority)}
        ${draggedLead === lead.id ? 'opacity-50 transform rotate-2' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-sm mb-1">{lead.name}</h3>
          <p className="text-xs text-gray-600 mb-2">{lead.company}</p>
          {lead.product && (
            <p className="text-xs text-blue-600 mb-2">{lead.product}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon(lead)}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Euro className="w-3 h-3 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {lead.negotiated_price?.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }) || 'R$ 0,00'}
          </span>
        </div>
        
        {lead.expected_close_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {lead.assigned_to && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-gray-600" />
          </div>
          <span className="text-xs text-gray-600">{lead.assigned_to}</span>
        </div>
      )}
    </div>
  );

  // Componente da coluna do pipeline
  const PipelineColumn: React.FC<{ stage: typeof pipelineStages[0] }> = ({ stage }) => {
    const stageLeads = leadsByStage[stage.id] || [];
    const totals = getStageTotals(stage.id);

    return (
      <div
        className="flex-shrink-0 w-72 bg-gray-50 rounded-lg p-4"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, stage.id)}
      >
        {/* Cabeçalho da coluna */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-medium text-gray-900">{stage.name}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {stageLeads.length}
          </Badge>
        </div>

        {/* Totais da coluna */}
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <div className="text-lg font-semibold text-gray-900">
            {totals.totalValue}
          </div>
          <div className="text-sm text-gray-600">
            {totals.dealCount} {totals.dealCount === 1 ? 'deal' : 'deals'}
          </div>
        </div>

        {/* Cards dos leads */}
        <div className="space-y-3 min-h-[200px]">
          {stageLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          
          {/* Card para adicionar novo lead */}
          <Button
            variant="ghost"
            className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <div className="flex flex-col items-center gap-1">
              <Plus className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Adicionar Lead</span>
            </div>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Áreas de ação na parte inferior (inspirado no Pipedrive) */}
      <div className="flex justify-center gap-4 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Arraste para:</span>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 border-2 border-dashed border-red-300 rounded-lg text-red-600 text-sm font-medium">
            DELETE
          </div>
          <div className="px-4 py-2 border-2 border-dashed border-red-300 rounded-lg text-red-600 text-sm font-medium">
            LOST
          </div>
          <div className="px-4 py-2 border-2 border-dashed border-green-300 rounded-lg text-green-600 text-sm font-medium">
            WON
          </div>
          <div className="px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 text-sm font-medium">
            MOVE/CONVERT
          </div>
        </div>
      </div>

      {/* Board do Pipeline */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => (
          <PipelineColumn key={stage.id} stage={stage} />
        ))}
      </div>

      {/* Modal de criação de lead (será implementado) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Criar Novo Lead</h2>
            <p className="text-gray-600 mb-4">
              Modal de criação será implementado aqui
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsCreateModalOpen(false)}>
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineKanban;