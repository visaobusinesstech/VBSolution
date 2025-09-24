
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  CheckSquare,
  Presentation,
  Clock,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCommercialActivities, ActivityWithDetails } from '@/hooks/useCommercialActivities';
import { toast } from '@/hooks/use-toast';
import ActivityFiltersWithResponsible from '@/components/ActivityFiltersWithResponsible';

interface CommercialActivitiesTabProps {
  leadId?: string;
  companyId?: string;
}

const CommercialActivitiesTab = ({ leadId, companyId }: CommercialActivitiesTabProps) => {
  const { activities, loading, updateActivity } = useCommercialActivities();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Filtrar atividades
  let filteredActivities = activities;

  // Se for um lead específico ou empresa específica
  if (leadId) {
    filteredActivities = filteredActivities.filter(activity => activity.lead_id === leadId);
  }
  if (companyId) {
    filteredActivities = filteredActivities.filter(activity => activity.company_id === companyId);
  }

  // Aplicar filtros de busca
  if (searchTerm) {
    filteredActivities = filteredActivities.filter(activity =>
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (statusFilter) {
    filteredActivities = filteredActivities.filter(activity => activity.status === statusFilter);
  }

  if (typeFilter) {
    filteredActivities = filteredActivities.filter(activity => activity.type === typeFilter);
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'presentation':
        return <Presentation className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-800';
      case 'email':
        return 'bg-purple-100 text-purple-800';
      case 'meeting':
        return 'bg-green-100 text-green-800';
      case 'whatsapp':
        return 'bg-emerald-100 text-emerald-800';
      case 'task':
        return 'bg-orange-100 text-orange-800';
      case 'presentation':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      await updateActivity(activityId, { status: 'completed' });
      toast({
        title: "Atividade concluída",
        description: "A atividade foi marcada como concluída!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao concluir atividade",
        variant: "destructive",
      });
    }
  };

  const handleCancelActivity = async (activityId: string) => {
    try {
      await updateActivity(activityId, { status: 'cancelled' });
      toast({
        title: "Atividade cancelada",
        description: "A atividade foi cancelada!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar atividade",
        variant: "destructive",
      });
    }
  };

  const mockEmployees = [
    { id: '1', name: 'Ana Paula Silva', email: 'ana@empresa.com' },
    { id: '2', name: 'Carlos Santos', email: 'carlos@empresa.com' },
    { id: '3', name: 'Maria Oliveira', email: 'maria@empresa.com' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Atividades Comerciais</h3>
          <p className="text-sm text-gray-600">
            {filteredActivities.length} atividade(s) encontrada(s)
          </p>
        </div>
        
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Atividade
        </Button>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar atividades por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="call">Ligação</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="task">Tarefa</SelectItem>
                  <SelectItem value="presentation">Apresentação</SelectItem>
                </SelectContent>
              </Select>

              <ActivityFiltersWithResponsible
                employees={mockEmployees}
                selectedResponsibles={selectedResponsibles}
                onResponsibleChange={setSelectedResponsibles}
                selectedPriorities={selectedPriorities}
                onPriorityChange={setSelectedPriorities}
                selectedStatuses={selectedStatuses}
                onStatusChange={setSelectedStatuses}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de atividades */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhuma atividade encontrada</h3>
                <p className="text-sm">
                  {leadId || companyId ? 
                    'Não há atividades para este item ainda.' : 
                    'Crie sua primeira atividade comercial.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Ícone da atividade */}
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Detalhes da atividade */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                        </div>
                        
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status === 'completed' ? 'Concluído' : 
                           activity.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </div>

                      {/* Metadados */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(activity.datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        {activity.lead?.name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Lead: {activity.lead.name}</span>
                          </div>
                        )}

                        {activity.company?.fantasy_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Empresa: {activity.company.fantasy_name}</span>
                          </div>
                        )}

                        {activity.responsible && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-xs">
                                {activity.responsible.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{activity.responsible.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activity.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCompleteActivity(activity.id)}
                        className="h-8 w-8 p-0"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </Button>

                    {activity.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelActivity(activity.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommercialActivitiesTab;
