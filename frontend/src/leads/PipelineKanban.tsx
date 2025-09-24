
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, DollarSign, Calendar, User, Building2, Phone, Mail } from 'lucide-react';
import { LeadWithDetails } from '@/hooks/useLeads';
import { FunnelStage } from '@/hooks/useFunnelStages';

interface PipelineKanbanProps {
  leads: LeadWithDetails[];
  stages: FunnelStage[];
  onMoveToStage: (leadId: string, stageId: string) => Promise<void>;
  onUpdateStatus: (leadId: string, status: 'open' | 'won' | 'lost' | 'frozen') => Promise<void>;
  selectedLeads?: string[];
  onSelectLead?: (leadId: string, selected: boolean) => void;
}

const PipelineKanban = ({
  leads,
  stages,
  onMoveToStage,
  onUpdateStatus,
  selectedLeads = [],
  onSelectLead = () => {}
}: PipelineKanbanProps) => {
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'frozen':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 min-h-[600px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Header da coluna */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {stageLeads.length} leads
                  </div>
                  <div className="text-xs text-gray-500">
                    R$ {stageValue.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Cards dos leads */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
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
                            onCheckedChange={(checked) => onSelectLead(lead.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold leading-tight line-clamp-2">
                              {lead.name}
                            </h4>
                            {lead.company && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{lead.company.fantasy_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {/* Valor */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              {formatCurrency(lead.value, lead.currency)}
                            </span>
                          </div>
                          <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                            {lead.status === 'won' ? 'Ganho' : 
                             lead.status === 'lost' ? 'Perdido' : 
                             lead.status === 'frozen' ? 'Congelado' : 'Ativo'}
                          </Badge>
                        </div>

                        {/* Data prevista */}
                        {lead.expected_close_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Prev: {new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}

                        {/* Responsável */}
                        {lead.responsible && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <User className="h-3 w-3" />
                            <span className="truncate">{lead.responsible.name}</span>
                          </div>
                        )}

                        {/* Origem */}
                        {lead.source && (
                          <div className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              {lead.source}
                            </Badge>
                          </div>
                        )}

                        {/* Ações rápidas */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-1">
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
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Estado vazio */}
                {stageLeads.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-3 opacity-50"
                      style={{ backgroundColor: stage.color }}
                    />
                    <div className="text-sm font-medium">Nenhum lead</div>
                    <div className="text-xs">Arraste leads para cá</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineKanban;
