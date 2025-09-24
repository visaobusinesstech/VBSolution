
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  AlertCircle,
  Flame,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { LeadWithDetails } from '@/hooks/useLeads';
import { useFunnelStages } from '@/hooks/useFunnelStages';
import { toast } from '@/hooks/use-toast';

interface LeadsKanbanBoardProps {
  leads: LeadWithDetails[];
  onMoveToStage: (leadId: string, stageId: string) => void;
  onLeadClick: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: 'open' | 'won' | 'lost' | 'frozen') => void;
}

const LeadsKanbanBoard = ({ leads, onMoveToStage, onLeadClick, onUpdateStatus }: LeadsKanbanBoardProps) => {
  const { stages } = useFunnelStages();
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedLead) {
      onMoveToStage(draggedLead, stageId);
      setDraggedLead(null);
      toast({
        title: "Lead movido",
        description: "Lead movido para nova etapa com sucesso!",
      });
    }
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.stage_id === stageId);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Flame className="h-3 w-3 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
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
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 min-h-[700px]">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.id);
        const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);

        return (
          <div
            key={stage.id}
            className="bg-gray-50/80 backdrop-blur-sm rounded-xl border-2 border-gray-200 p-4 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Header da coluna */}
            <div className="mb-4 pb-3 border-b border-gray-300/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-sm text-gray-800">{stage.name}</h3>
                </div>
                <Badge variant="secondary" className="bg-white/80 text-gray-700 font-medium">
                  {stageLeads.length}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 font-medium">
                R$ {stageValue.toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Cards de leads */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {stageLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-move hover:shadow-lg transition-all duration-200 bg-white/95 backdrop-blur-sm border border-gray-200/50 group"
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  onClick={() => onLeadClick(lead.id)}
                >
                  <CardHeader className="pb-2 px-4 pt-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold leading-tight text-gray-900 flex-1 mr-2">
                        {lead.name}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(lead.priority)}
                        <Badge className={`text-xs px-1.5 py-0.5 ${getStatusColor(lead.status)}`}>
                          {lead.status === 'won' ? 'Ganho' : 
                           lead.status === 'lost' ? 'Perdido' : 
                           lead.status === 'frozen' ? 'Congelado' : 'Aberto'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="px-4 py-2 space-y-3">
                    {/* Empresa */}
                    {lead.company && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{lead.company.fantasy_name}</span>
                      </div>
                    )}

                    {/* Valor e conversão */}
                    <div className="bg-blue-50 rounded-lg p-2 space-y-1">
                      <div className="flex justify-between items-center text-xs">
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
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {lead.responsible.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{lead.responsible.name}</span>
                      </div>
                    )}

                    {/* Data de fechamento */}
                    {lead.expected_close_date && (
                      <div className={`flex items-center gap-2 text-xs ${
                        isOverdue(lead.expected_close_date) ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        <span>
                          Previsão: {new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {/* Último contato */}
                    {lead.last_contact_date && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        Último contato: {new Date(lead.last_contact_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}

                    {/* Ações rápidas */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(lead.id, 'won');
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ganho
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Adicionar atividade
                        }}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Ligar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Estado vazio */}
              {stageLeads.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Building2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-xs font-medium">Nenhum lead</p>
                  <p className="text-xs opacity-75">Arraste leads para cá</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeadsKanbanBoard;
