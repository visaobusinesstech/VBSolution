
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, DollarSign, Calendar, User, Building2, Phone, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LeadWithDetails } from '@/hooks/useLeads';
import { FunnelStage } from '@/hooks/useFunnelStages';

interface PipedriveKanbanBoardProps {
  leads: LeadWithDetails[];
  stages: FunnelStage[];
  onMoveToStage: (leadId: string, stageId: string) => Promise<void>;
  onLeadClick: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: 'open' | 'won' | 'lost' | 'frozen') => Promise<void>;
  onEditLead: (lead: any) => void;
  selectedLeads?: string[];
  onSelectLead?: (leadId: string, selected: boolean) => void;
}

const PipedriveKanbanBoard = ({
  leads,
  stages,
  onMoveToStage,
  onLeadClick,
  onUpdateStatus,
  onEditLead,
  selectedLeads = [],
  onSelectLead = () => {}
}: PipedriveKanbanBoardProps) => {
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <Badge className="bg-green-100 text-green-800 text-xs">Ganho</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800 text-xs">Perdido</Badge>;
      case 'frozen':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Congelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">Ativo</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedLead) {
      await onMoveToStage(draggedLead, stageId);
      setDraggedLead(null);
    }
  };

  const handleLeadSelect = (leadId: string, checked: boolean) => {
    onSelectLead(leadId, checked);
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
        const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Header da coluna */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                <p className="text-sm text-gray-600">
                  {stageLeads.length} leads • R$ {stageValue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
            </div>

            {/* Cards dos leads */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {stageLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className={`cursor-move hover:shadow-md transition-all duration-200 border-l-4 ${getPriorityColor(lead.priority)} ${
                    draggedLead === lead.id ? 'opacity-50' : ''
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleLeadSelect(lead.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <CardTitle 
                            className="text-sm font-semibold leading-tight line-clamp-2 cursor-pointer hover:text-blue-600"
                            onClick={() => onLeadClick(lead.id)}
                          >
                            {lead.name}
                          </CardTitle>
                          {lead.company && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{lead.company.fantasy_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(lead.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditLead(lead)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(lead.id, 'won')}>
                              Marcar como Ganho
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(lead.id, 'lost')}>
                              Marcar como Perdido
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(lead.id, 'frozen')}>
                              Congelar Lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {/* Valor */}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {formatCurrency(lead.value, lead.currency)}
                        </span>
                        <span className="text-gray-500">({lead.conversion_rate}%)</span>
                      </div>

                      {/* Data prevista */}
                      {lead.expected_close_date && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Prev: {new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}

                      {/* Responsável */}
                      {lead.responsible && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <User className="h-3 w-3" />
                          <span className="truncate">{lead.responsible.name}</span>
                        </div>
                      )}

                      {/* Origem */}
                      {lead.source && (
                        <div className="text-xs text-gray-600">
                          <Badge variant="outline" className="text-xs">
                            {lead.source}
                          </Badge>
                        </div>
                      )}

                      {/* Ações rápidas */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        {lead.company?.phone && (
                          <Button variant="ghost" size="sm" className="h-6 p-1">
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                        {lead.company?.email && (
                          <Button variant="ghost" size="sm" className="h-6 p-1">
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                        <div className="text-xs text-gray-500 ml-auto">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Estado vazio */}
              {stageLeads.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm font-medium">Nenhum lead</div>
                  <div className="text-xs">Arraste leads para cá</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PipedriveKanbanBoard;
