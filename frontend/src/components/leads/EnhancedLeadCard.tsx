
import { Card, CardContent } from '@/components/ui/card';
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
  TrendingUp,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { LeadWithDetails } from '@/hooks/useLeads';

interface EnhancedLeadCardProps {
  lead: LeadWithDetails;
  onCardClick: (leadId: string) => void;
  onMoveToStage?: (leadId: string, stageId: string) => void;
}

const EnhancedLeadCard = ({ lead, onCardClick, onMoveToStage }: EnhancedLeadCardProps) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap className="h-3 w-3 text-red-500" />;
      case 'medium':
        return <Target className="h-3 w-3 text-yellow-500" />;
      case 'low':
        return <Clock className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'won':
        return '🏆';
      case 'lost':
        return '❌';
      case 'frozen':
        return '🧊';
      default:
        return '🔥';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR')}`;
  };

  return (
    <Card 
      className={`
        cursor-pointer hover:shadow-lg transition-all duration-300 
        border-l-4 ${getPriorityColor(lead.priority)}
        group relative overflow-hidden
      `}
      onClick={() => onCardClick(lead.id)}
    >
      {/* Linha de marcação superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      <CardContent className="p-4 space-y-3">
        {/* Header do card */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusEmoji(lead.status)}</span>
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
          </div>
          
          <div className="flex items-center gap-1">
            {getPriorityIcon(lead.priority)}
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              {lead.conversion_rate}%
            </Badge>
          </div>
        </div>

        {/* Valor e progresso */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-700">Valor</span>
            </div>
            <span className="font-bold text-green-600">
              {formatCurrency(lead.value, lead.currency)}
            </span>
          </div>
          
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${lead.conversion_rate}%` }}
            />
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
                <AvatarFallback className="text-xs">
                  {lead.responsible.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-600 truncate">{lead.responsible.name}</span>
            </div>
          )}

          {/* Tags/Source */}
          {lead.source && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {lead.source}
              </Badge>
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {lead.company?.phone && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Phone className="h-3 w-3" />
              </Button>
            )}
            {lead.company?.email && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Mail className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* Indicador de atividade recente */}
        {lead.last_contact_date && (
          <div className="absolute top-2 right-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedLeadCard;
