
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Phone, Mail, Calendar, CheckCircle, Clock, User } from 'lucide-react';
import { LeadWithDetails } from '@/hooks/useLeads';
import CreateActivityModal from './CreateActivityModal';

interface ActivitiesHistoryTabProps {
  leads: LeadWithDetails[];
}

const ActivitiesHistoryTab = ({ leads }: ActivitiesHistoryTabProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    lead: ''
  });

  // Mock activities - em produção viria de um hook específico
  const mockActivities = [
    {
      id: '1',
      title: 'Ligação de follow-up',
      type: 'call',
      status: 'completed',
      scheduledDate: new Date('2024-01-20T10:00:00'),
      completedAt: new Date('2024-01-20T10:15:00'),
      leadId: leads[0]?.id,
      leadName: leads[0]?.name,
      responsible: 'João Silva',
      description: 'Discussão sobre proposta comercial'
    },
    {
      id: '2',
      title: 'Envio de proposta',
      type: 'email',
      status: 'completed',
      scheduledDate: new Date('2024-01-21T14:00:00'),
      completedAt: new Date('2024-01-21T14:30:00'),
      leadId: leads[1]?.id,
      leadName: leads[1]?.name,
      responsible: 'Maria Santos',
      description: 'Proposta personalizada enviada'
    },
    {
      id: '3',
      title: 'Reunião de apresentação',
      type: 'meeting',
      status: 'scheduled',
      scheduledDate: new Date('2024-01-25T15:00:00'),
      leadId: leads[0]?.id,
      leadName: leads[0]?.name,
      responsible: 'João Silva',
      description: 'Apresentação da solução completa'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'scheduled':
        return 'Agendada';
      case 'overdue':
        return 'Atrasada';
      default:
        return 'Pendente';
    }
  };

  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = !filters.search || 
      activity.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      activity.leadName?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || activity.type === filters.type;
    const matchesStatus = filters.status === 'all' || activity.status === filters.status;
    const matchesLead = !filters.lead || activity.leadId === filters.lead;

    return matchesSearch && matchesType && matchesStatus && matchesLead;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Histórico de Atividades</h2>
          <p className="text-gray-600 mt-1">
            Acompanhe todas as interações com seus leads
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Atividade
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar atividades..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="call">Ligação</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="task">Tarefa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="overdue">Atrasada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.lead} onValueChange={(value) => setFilters(prev => ({ ...prev, lead: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os leads</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de atividades */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        {getStatusLabel(activity.status)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {activity.scheduledDate.toLocaleDateString('pt-BR')} às{' '}
                          {activity.scheduledDate.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{activity.responsible}</span>
                      </div>
                      
                      <div>
                        Lead: <span className="font-medium">{activity.leadName}</span>
                      </div>
                    </div>

                    {activity.completedAt && (
                      <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
                        <CheckCircle className="h-3 w-3" />
                        <span>
                          Concluída em {activity.completedAt.toLocaleDateString('pt-BR')} às{' '}
                          {activity.completedAt.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredActivities.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Não há atividades que correspondam aos filtros selecionados.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira atividade
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de criação */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        leads={leads}
      />
    </div>
  );
};

export default ActivitiesHistoryTab;
