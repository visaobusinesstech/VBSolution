
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  Globe,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Copy,
  AlertTriangle,
  Target,
  Flame
} from 'lucide-react';
import { LeadWithDetails } from '@/hooks/useLeads';

interface LeadDetailsModalProps {
  lead: LeadWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: 'open' | 'won' | 'lost' | 'frozen') => void;
  onEdit: (leadId: string) => void;
  onDelete: (leadId: string) => void;
  onDuplicate: (leadId: string) => void;
}

const LeadDetailsModal = ({ 
  lead, 
  isOpen, 
  onClose, 
  onUpdateStatus, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: LeadDetailsModalProps) => {
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

  const mockActivities = [
    {
      id: '1',
      type: 'call',
      title: 'Ligação de follow-up',
      description: 'Discussão sobre proposta enviada',
      datetime: '2024-01-20T10:00:00',
      status: 'completed'
    },
    {
      id: '2',
      type: 'email',
      title: 'Proposta comercial enviada',
      description: 'Enviada proposta personalizada',
      datetime: '2024-01-18T14:30:00',
      status: 'completed'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {lead.name}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {lead.company?.fantasy_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(lead.priority)}>
                {lead.priority === 'high' ? 'Alta Prioridade' : 
                 lead.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
              </Badge>
              <Badge className={getStatusColor(lead.status)}>
                {lead.status === 'won' ? 'Ganho' : 
                 lead.status === 'lost' ? 'Perdido' : 
                 lead.status === 'frozen' ? 'Congelado' : 'Aberto'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="files">Arquivos</TabsTrigger>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Informações principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Detalhes do Lead */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Detalhes do Lead
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Valor</label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(lead.value, lead.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Taxa de Conversão</label>
                      <p className="text-lg font-semibold text-blue-600">
                        {lead.conversion_rate}%
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Etapa Atual</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: lead.stage?.color }}
                      />
                      <span className="font-medium">{lead.stage?.name}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Origem</label>
                    <p className="font-medium capitalize">{lead.source}</p>
                  </div>

                  {lead.expected_close_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Previsão de Fechamento</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{new Date(lead.expected_close_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  )}

                  {lead.last_contact_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Último Contato</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{new Date(lead.last_contact_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  )}

                  {lead.responsible && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Responsável</label>
                      <div className="flex items-center gap-3 mt-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {lead.responsible.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.responsible.name}</p>
                          <p className="text-sm text-gray-600">{lead.responsible.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {lead.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Observações</label>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{lead.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações da Empresa */}
              {lead.company && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome Fantasia</label>
                      <p className="font-semibold">{lead.company.fantasy_name}</p>
                    </div>

                    {lead.company.sector && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Setor</label>
                        <p>{lead.company.sector}</p>
                      </div>
                    )}

                    {lead.company.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">E-mail</label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <a 
                            href={`mailto:${lead.company.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {lead.company.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {lead.company.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Telefone</label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <a 
                            href={`tel:${lead.company.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {lead.company.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Ações rápidas */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                onClick={() => onUpdateStatus(lead.id, 'won')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Ganho
              </Button>
              
              <Button
                onClick={() => onUpdateStatus(lead.id, 'lost')}
                variant="destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Marcar como Perdido
              </Button>

              <Button
                onClick={() => onEdit(lead.id)}
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>

              <Button
                onClick={() => onDuplicate(lead.id)}
                variant="outline"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>

              <Button
                onClick={() => onDelete(lead.id)}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Atividades e Interações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="bg-blue-100 p-2 rounded-full">
                        {activity.type === 'call' ? <Phone className="h-4 w-4 text-blue-600" /> :
                         activity.type === 'email' ? <Mail className="h-4 w-4 text-blue-600" /> :
                         <FileText className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{activity.title}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(activity.datetime).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Arquivos e Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum arquivo anexado</p>
                  <Button variant="outline" className="mt-3">
                    Anexar Arquivo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Linha do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Lead criado</p>
                      <p className="text-sm text-gray-600">
                        {new Date(lead.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailsModal;
