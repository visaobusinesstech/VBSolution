
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Globe,
  FileText,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Edit,
  Archive
} from 'lucide-react';
import { LeadWithDetails } from '@/hooks/useLeads';

interface LeadExpandedModalProps {
  lead: LeadWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lead: LeadWithDetails) => void;
}

const LeadExpandedModal = ({ lead, isOpen, onClose, onEdit }: LeadExpandedModalProps) => {
  if (!lead) return null;

  const formatCurrency = (value: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <span className="text-2xl">{getStatusEmoji(lead.status)}</span>
                {lead.name}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={`${getPriorityColor(lead.priority)}`}>
                  {lead.priority === 'high' ? 'Alta' : 
                   lead.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                </Badge>
                <Badge variant="outline">
                  {lead.status === 'won' ? 'Ganho' : 
                   lead.status === 'lost' ? 'Perdido' : 
                   lead.status === 'frozen' ? 'Congelado' : 'Ativo'}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit?.(lead)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Arquivar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Financeiras */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Informações Financeiras
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valor do Lead</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(lead.value, lead.currency)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Conversão</span>
                      <span className="font-medium">{lead.conversion_rate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${lead.conversion_rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {lead.currency}
                      </div>
                      <div className="text-xs text-gray-600">Moeda</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {lead.source || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">Origem</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Cronograma */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Cronograma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Criado em</span>
                      <span className="font-medium">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    {lead.expected_close_date && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600">Previsão de Fechamento</span>
                        <span className="font-medium text-blue-600">
                          {new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    
                    {lead.last_contact_date && (
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-600">Último Contato</span>
                        <span className="font-medium text-green-600">
                          {new Date(lead.last_contact_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Responsável e Notas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Responsável */}
              {lead.responsible && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />
                      Responsável
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {lead.responsible.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{lead.responsible.name}</div>
                        <div className="text-sm text-gray-600">Vendedor</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[80px]">
                    <p className="text-sm text-gray-700">
                      {lead.notes || 'Nenhuma observação adicionada.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="company" className="mt-6">
            {lead.company && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {lead.company.fantasy_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Razão Social</label>
                        <p className="mt-1">{lead.company.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">CNPJ</label>
                        <p className="mt-1">{lead.company.cnpj || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Setor</label>
                        <p className="mt-1">{lead.company.sector || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Telefone</label>
                        <p className="mt-1 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {lead.company.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">E-mail</label>
                        <p className="mt-1 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {lead.company.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Endereço</label>
                        <p className="mt-1 flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-1" />
                          <span>
                            {lead.company.address ? 
                              `${lead.company.address}, ${lead.company.city || ''}, ${lead.company.state || ''}` 
                              : 'N/A'
                            }
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {lead.company.description && (
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium text-gray-600">Descrição</label>
                      <p className="mt-2 text-gray-700">{lead.company.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Atividades Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade registrada ainda.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Histórico de Mudanças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum histórico disponível.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadExpandedModal;
