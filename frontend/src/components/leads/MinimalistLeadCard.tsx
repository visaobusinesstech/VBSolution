
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail
} from 'lucide-react';
import { LeadWithDetails } from '@/hooks/useLeads';

interface MinimalistLeadCardProps {
  lead: LeadWithDetails;
  onCardClick: (leadId: string) => void;
  onMoveToStage?: (leadId: string, stageId: string) => void;
}

const MinimalistLeadCard = ({ lead, onCardClick, onMoveToStage }: MinimalistLeadCardProps) => {
  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR')}`;
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return 'N/A';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'won':
        return 'Ganho';
      case 'lost':
        return 'Perdido';
      case 'frozen':
        return 'Congelado';
      default:
        return 'Ativo';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white group"
      onClick={() => onCardClick(lead.id)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header do card */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
              {lead.name}
            </h4>
            {lead.company && (
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{lead.company.fantasy_name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300">
              {getPriorityText(lead.priority)}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300">
              {getStatusText(lead.status)}
            </Badge>
          </div>
        </div>

        {/* Valor */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Valor</span>
            </div>
            <span className="font-bold text-gray-900">
              {formatCurrency(lead.value, lead.currency)}
            </span>
          </div>
        </div>

        {/* Informações principais */}
        <div className="space-y-2">
          {/* Data prevista */}
          {lead.expected_close_date && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Prev: {new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          {/* Responsável */}
          {lead.responsible && (
            <div className="flex items-center gap-2 text-xs">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                  {lead.responsible.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-600 truncate">{lead.responsible.name}</span>
            </div>
          )}

          {/* Source */}
          {lead.source && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700">
                {lead.source}
              </Badge>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {lead.company?.phone && (
              <div className="h-6 w-6 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <Phone className="h-3 w-3 text-gray-500" />
              </div>
            )}
            {lead.company?.email && (
              <div className="h-6 w-6 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <Mail className="h-3 w-3 text-gray-500" />
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MinimalistLeadCard;
