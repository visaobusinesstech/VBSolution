
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Edit, Phone, Mail, Calendar, DollarSign, Building2 } from 'lucide-react';
import { useLeads, LeadWithDetails } from '@/hooks/useLeads';
import { toast } from '@/hooks/use-toast';

interface LeadDetailPanelProps {
  lead: LeadWithDetails | null;
  onClose: () => void;
  onLeadUpdated: () => void;
}

const LeadDetailPanel = ({ lead, onClose, onLeadUpdated }: LeadDetailPanelProps) => {
  const [loading, setLoading] = useState(false);

  if (!lead) {
    return null;
  }

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won':
        return <Badge className="bg-green-100 text-green-800">Ganho</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">Perdido</Badge>;
      case 'frozen':
        return <Badge className="bg-blue-100 text-blue-800">Congelado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Aberto</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary">Média</Badge>;
      case 'low':
        return <Badge variant="outline">Baixa</Badge>;
      default:
        return <Badge variant="secondary">Média</Badge>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Detalhes do Lead</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header do Lead */}
          <div>
            <h3 className="text-xl font-bold mb-2">{lead.name}</h3>
            <div className="flex items-center gap-2 mb-3">
              {getStatusBadge(lead.status)}
              {getPriorityBadge(lead.priority)}
            </div>
            
            {lead.company && (
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>{lead.company.fantasy_name}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Informações Principais */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Valor</label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-lg font-semibold">
                  {formatCurrency(lead.value, lead.currency)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Taxa de Conversão</label>
              <div className="mt-1">
                <span className="text-lg font-semibold">{lead.conversion_rate}%</span>
              </div>
            </div>

            {lead.expected_close_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">Data Prevista</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            )}

            {lead.source && (
              <div>
                <label className="text-sm font-medium text-gray-500">Origem</label>
                <div className="mt-1">
                  <Badge variant="outline">{lead.source}</Badge>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Responsável */}
          {lead.responsible && (
            <div>
              <label className="text-sm font-medium text-gray-500">Responsável</label>
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {lead.responsible.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{lead.responsible.name}</div>
                    {lead.responsible.email && (
                      <div className="text-sm text-gray-500">{lead.responsible.email}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Observações */}
          {lead.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Observações</label>
              <div className="mt-1 text-sm text-gray-700">
                {lead.notes}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              Editar Lead
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                E-mail
              </Button>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Criado: {new Date(lead.created_at).toLocaleString('pt-BR')}</div>
            <div>Atualizado: {new Date(lead.updated_at).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailPanel;
