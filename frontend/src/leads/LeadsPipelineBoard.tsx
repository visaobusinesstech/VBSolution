
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle2,
  Edit,
  MoreVertical,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadWithDetails } from '@/hooks/useLeads';
import { FunnelStage } from '@/hooks/useFunnelStages';
import { toast } from '@/hooks/use-toast';

interface LeadsPipelineBoardProps {
  leads: LeadWithDetails[];
  stages: FunnelStage[];
  onLeadClick: (lead: LeadWithDetails) => void;
  onMoveToStage: (leadId: string, stageId: string) => void;
  onUpdateStatus: (leadId: string, status: 'open' | 'won' | 'lost' | 'frozen') => void;
  selectedLeads: string[];
  onSelectLead: (leadId: string, selected: boolean) => void;
}

const LeadsPipelineBoard = ({ 
  leads, 
  stages, 
  onLeadClick, 
  onMoveToStage, 
  onUpdateStatus,
  selectedLeads,
  onSelectLead
}: LeadsPipelineBoardProps) => {
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedLead && draggedLead !== stageId) {
      onMoveToStage(draggedLead, stageId);
    }
    setDraggedLead(null);
    setDragOverStage(null);
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Flame className="h-3 w-3 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'low':
        return <Clock className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'frozen':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR')}`;
  };

  const isOverdue = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const daysSinceContact = (date?: string) => {
    if (!date) return null;
    return Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 min-h-[700px]">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
        const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
        const isDragOver = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            className={`flex-shrink-0 w-80 bg-slate-50/80 rounded-xl border-2 transition-all duration-200 ${
              isDragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200'
            }`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Header da coluna */}
            <div className="p-4 border-b border-slate-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-sm text-slate-800">{stage.name}</h3>
                </div>
                <Badge variant="secondary" className="bg-white/80 text-slate-700 font-medium">
                  {stageLeads.length}
                </Badge>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                R$ {stageValue.toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Cards de leads */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[600px]">
              {stageLeads.map((lead) => {
                const daysWithoutContact = daysSinceContact(lead.last_contact_date);
                const isSelected = selectedLeads.includes(lead.id);
                
                return (
                  <Card
                    key={lead.id}
                    className={`cursor-move hover:shadow-lg transition-all duration-200 bg-white border group ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200'
                    } ${draggedLead === lead.id ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                  >
                    <CardHeader className="pb-2 px-4 pt-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onSelectLead(lead.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">
                              {lead.name}
                            </h4>
                            {lead.company && (
                              <p className="text-xs text-slate-600 truncate">
                                {lead.company.fantasy_name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(lead.priority)}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onLeadClick(lead)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateStatus(lead.id, 'won')}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Marcar como Ganho
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateStatus(lead.id, 'lost')}>
                                <Flag className="h-4 w-4 mr-2" />
                                Marcar como Perdido
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="px-4 py-2 space-y-3" onClick={() => onLeadClick(lead)}>
                      {/* Valor e probabilidade */}
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-blue-700 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Valor:
                          </span>
                          <span className="font-semibold text-blue-800">
                            {formatCurrency(lead.value, lead.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-blue-700">Conversão:</span>
                          <span className="font-semibold text-blue-800">
                            {lead.conversion_rate}%
                          </span>
                        </div>
                      </div>

                      {/* Responsável */}
                      {lead.responsible && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs bg-slate-100">
                              {lead.responsible.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{lead.responsible.name}</span>
                        </div>
                      )}

                      {/* Data de fechamento */}
                      {lead.expected_close_date && (
                        <div className={`flex items-center gap-2 text-xs ${
                          isOverdue(lead.expected_close_date) ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          <Calendar className="h-3 w-3" />
                          <span>
                            Previsão: {new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}
                          </span>
                          {isOverdue(lead.expected_close_date) && (
                            <Badge className="bg-red-100 text-red-700 text-xs px-1">
                              Atrasado
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Último contato */}
                      {daysWithoutContact !== null && (
                        <div className={`text-xs p-2 rounded ${
                          daysWithoutContact > 7 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {daysWithoutContact === 0 
                            ? 'Contato hoje' 
                            : daysWithoutContact === 1 
                            ? 'Contato ontem'
                            : `Último contato: ${daysWithoutContact} dias atrás`
                          }
                          {daysWithoutContact > 7 && (
                            <AlertTriangle className="inline h-3 w-3 ml-1" />
                          )}
                        </div>
                      )}

                      {/* Origem e status */}
                      <div className="flex items-center justify-between">
                        {lead.source && (
                          <Badge variant="outline" className="text-xs">
                            {lead.source}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                          {lead.status === 'won' ? 'Ganho' : 
                           lead.status === 'lost' ? 'Perdido' : 
                           lead.status === 'frozen' ? 'Congelado' : 'Ativo'}
                        </Badge>
                      </div>

                      {/* Ações rápidas */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Implementar ligação
                            toast({
                              title: "Ligação",
                              description: "Funcionalidade em desenvolvimento",
                            });
                          }}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Ligar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Implementar email
                            toast({
                              title: "E-mail",
                              description: "Funcionalidade em desenvolvimento",
                            });
                          }}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          E-mail
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Estado vazio */}
              {stageLeads.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Nenhum lead</p>
                  <p className="text-xs">Arraste leads para esta etapa</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeadsPipelineBoard;
