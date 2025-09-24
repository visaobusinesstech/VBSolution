
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Edit,
  CheckCircle2,
  XCircle,
  Archive,
  ExternalLink,
  MessageSquare,
  Clock,
  Star,
  Tag
} from 'lucide-react';
import { LeadWithDetails, Lead } from '@/hooks/useLeads';
import { toast } from '@/hooks/use-toast';

interface LeadSidePanelProps {
  lead: LeadWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: 'open' | 'won' | 'lost' | 'frozen') => void;
  onEditLead: (lead: LeadWithDetails) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

const LeadSidePanel = ({ 
  lead, 
  isOpen, 
  onClose, 
  onUpdateStatus, 
  onEditLead,
  onUpdateLead 
}: LeadSidePanelProps) => {
  const [notes, setNotes] = useState(lead?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!isOpen || !lead) return null;

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'lost':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'frozen':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleSaveNotes = async () => {
    try {
      await onUpdateLead(lead.id, { notes });
      setIsEditingNotes(false);
      toast({
        title: "Observações atualizadas",
        description: "As observações foram salvas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar observações",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40" 
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Detalhes do Lead</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Informações Principais */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{lead.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status === 'won' ? 'Ganho' : 
                   lead.status === 'lost' ? 'Perdido' : 
                   lead.status === 'frozen' ? 'Congelado' : 'Aberto'}
                </Badge>
                <Badge className={getPriorityColor(lead.priority)}>
                  Prioridade {lead.priority === 'high' ? 'Alta' : 
                              lead.priority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              </div>
            </div>

            {/* Valor da Oportunidade */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Valor da Oportunidade</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(lead.value, lead.currency)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <Star className="h-4 w-4" />
                  <span>Taxa de conversão: {lead.conversion_rate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações da Empresa */}
          {lead.company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Empresa Vinculada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{lead.company.fantasy_name}</p>
                  {lead.company.sector && (
                    <p className="text-sm text-gray-600">{lead.company.sector}</p>
                  )}
                </div>
                
                {lead.company.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{lead.company.email}</span>
                  </div>
                )}
                
                {lead.company.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{lead.company.phone}</span>
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full mt-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver empresa completa
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Responsável */}
          {lead.responsible && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{lead.responsible.name}</p>
                    <p className="text-sm text-gray-600">{lead.responsible.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Criado em:</span>
                <span className="text-sm font-medium">
                  {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              {lead.expected_close_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Previsão fechamento:</span>
                  <span className={`text-sm font-medium ${
                    new Date(lead.expected_close_date) < new Date() ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              
              {lead.last_contact_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Último contato:</span>
                  <span className="text-sm font-medium">
                    {new Date(lead.last_contact_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Etapa Atual */}
          {lead.stage && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: lead.stage.color }}
                  />
                  <span className="font-medium">Etapa: {lead.stage.name}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Origem do Lead */}
          {lead.source && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Origem:</span>
                  <span className="font-medium">{lead.source}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Observações
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsEditingNotes(true);
                    setNotes(lead.notes || '');
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre este lead..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes} className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
                      Salvar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsEditingNotes(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {lead.notes || 'Nenhuma observação adicionada.'}
                </p>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Ações */}
          <div className="space-y-3">
            <Button 
              onClick={() => onEditLead(lead)} 
              className="w-full" 
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Lead
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {lead.status !== 'won' && (
                <Button
                  onClick={() => onUpdateStatus(lead.id, 'won')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Ganho
                </Button>
              )}

              {lead.status !== 'lost' && (
                <Button
                  onClick={() => onUpdateStatus(lead.id, 'lost')}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Marcar como Perdido
                </Button>
              )}
            </div>

            {lead.status !== 'frozen' && (
              <Button
                onClick={() => onUpdateStatus(lead.id, 'frozen')}
                variant="outline"
                className="w-full"
              >
                <Archive className="h-4 w-4 mr-2" />
                Congelar Lead
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadSidePanel;
