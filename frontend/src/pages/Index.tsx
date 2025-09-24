import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  CheckCircle,
  MessageSquare,
  Target,
  Sparkles,
  Info,
  Clock,
  Users,
  AlertTriangle,
  X,
  Calendar,
  User,
  Tag,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Trash2,
  MessageCircle,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useVB } from '@/contexts/VBContext';
import { useProject } from '@/contexts/ProjectContext';
import { useWorkGroup } from '@/contexts/WorkGroupContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useActivities } from '@/hooks/useActivities';
import { PageHeader } from '@/components/PageHeader';

export default function Index() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'activity' | 'project' | 'workgroup' | 'calendar'>('activity');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isManageCardsModalOpen, setIsManageCardsModalOpen] = useState(false);
  const [isGreetingSettingsOpen, setIsGreetingSettingsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [dashboardCards, setDashboardCards] = useState([
    { id: 'recentes', title: 'Recentes', visible: true, type: 'recentes' },
    { id: 'agenda', title: 'Agenda', visible: true, type: 'agenda' },
    { id: 'pendentes', title: 'Atividades Pendentes', visible: true, type: 'pendentes' },
    { id: 'andamento', title: 'Em Andamento', visible: true, type: 'andamento' },
    { id: 'atrasadas', title: 'Atrasadas', visible: true, type: 'atrasadas' },
    { id: 'equipes', title: 'Equipes de Trabalho', visible: true, type: 'equipes' },
    { id: 'projetos', title: 'Projetos Recentes', visible: true, type: 'projetos' },
    { id: 'standup', title: 'StandUp da IA', visible: true, type: 'standup' }
  ]);
  
  // Estados para drag and drop
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOverCard, setDragOverCard] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  
  const { userName, refreshUserData } = useUser();
  const { state: vbState } = useVB();
  const { state: projectState } = useProject();
  const { workGroups } = useWorkGroup();
  const { activities } = useActivities();
  const navigate = useNavigate();
  
  // Função para determinar a saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return `Bom dia, ${userName}`;
    } else if (hour >= 12 && hour < 18) {
      return `Boa tarde, ${userName}`;
    } else {
      return `Boa noite, ${userName}`;
    }
  };

  // Atualizar a saudação quando o componente montar e a cada hora
  useEffect(() => {
    setGreeting(getGreeting());
    
    // Atualizar a cada hora
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60 * 60 * 1000); // 1 hora em milissegundos

    return () => clearInterval(interval);
  }, [userName]); // Atualiza sempre que userName mudar

  // Carregar dados do usuário quando o componente montar
  useEffect(() => {
    refreshUserData();
  }, []);

  // Eventos do calendário carregados do Supabase
  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const fetchCalendarEvents = async () => {
    try {
      // Buscar eventos do Supabase quando implementarmos a tabela de eventos
      // Por enquanto, array vazio
      setCalendarEvents([]);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    }
  };

  // Função para obter atividades recentes
  const getRecentActivities = () => {
    const recentActivities = activities
      .filter(activity => !activity.archived) // Filtra apenas se o campo archived existir e for false
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);

    return recentActivities.map(activity => ({
      id: activity.id,
      title: activity.title,
      status: activity.status,
      type: activity.type,
      projectId: activity.project_id,
      description: activity.description,
      date: activity.due_date,
      responsibleId: activity.responsible_id,
      priority: activity.priority,
      companyId: activity.company_id
    }));
  };

  // Função para obter atividades atrasadas
  const getOverdueActivities = () => {
    const today = new Date();
    return activities
      .filter(activity => 
        !activity.archived && // Filtra apenas se o campo archived existir e for false
        activity.status !== 'completed' &&
        new Date(activity.due_date) < today
      )
      .slice(0, 3);
  };

  // Função para obter atividades em andamento
  const getInProgressActivities = () => {
    return activities
      .filter(activity => 
        !activity.archived && // Filtra apenas se o campo archived existir e for false
        activity.status === 'in-progress'
      )
      .slice(0, 3);
  };

  // Função para obter projetos recentes
  const getRecentProjects = () => {
    return projectState.projects
      .filter(project => !project.archived) // Filtra apenas se o campo archived existir e for false
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };

  // Função para obter equipes de trabalho
  const getWorkGroupsData = () => {
    return workGroups.slice(0, 3).map(group => ({
      id: group.id,
      name: group.name,
      members: group.members.length,
      activeProjects: group.activeProjects,
      color: group.color,
      description: group.description,
      sector: group.sector,
      membersList: group.members
    }));
  };
  
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      weekday: 'short' 
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>;
      case 'high':
        return <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-3 w-3 text-white" />
        </div>;
      case 'medium':
        return <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>;
      case 'low':
        return <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>;
      default:
        return <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Pendente URGENTE';
      case 'high':
        return 'Pendente ALTA';
      case 'medium':
        return 'Pendente';
      case 'low':
        return 'Pendente BAIXA';
      default:
        return 'Pendente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default:
        return <div className="w-3 h-3 border-2 border-gray-400 rounded-full"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in-progress':
        return 'Em Andamento';
      case 'overdue':
        return 'Atrasada';
      case 'pending':
        return 'Pendente';
      default:
        return 'Pendente';
    }
  };

  // Função para traduzir status dos projetos
  const getProjectStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Planejamento';
      case 'active':
        return 'Ativo';
      case 'on_hold':
        return 'Em Pausa';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Funções para abrir modais
  const openActivityModal = (activity: any) => {
    setSelectedItem(activity);
    setModalType('activity');
    setIsModalOpen(true);
  };

  const openProjectModal = (project: any) => {
    setSelectedItem(project);
    setModalType('project');
    setIsModalOpen(true);
  };

  const openWorkGroupModal = (workGroup: any) => {
    setSelectedItem(workGroup);
    setModalType('workgroup');
    setIsModalOpen(true);
  };

  const openCalendarModal = (event: any) => {
    setSelectedItem(event);
    setModalType('calendar');
    setIsModalOpen(true);
  };

  // Funções de navegação
  const navigateToActivities = () => navigate('/activities');
  const navigateToProjects = () => navigate('/projects');
  const navigateToCalendar = () => navigate('/calendar');
  const navigateToWorkGroups = () => navigate('/work-groups');

  // Funções para criar novos itens
  const createNewActivity = () => navigate('/activities');
  const createNewProject = () => navigate('/projects');
  const createNewCalendarEvent = () => navigate('/calendar');

  // Função para remover um bloco do dashboard
  const removeCard = (cardId: string) => {
    setDashboardCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, visible: false } : card
    ));
  };

  // Função para adicionar novo bloco de Comentários Atribuídos
  const addAssignedCommentsCard = () => {
    const newCard = {
      id: 'comentarios-atribuidos',
      title: 'Comentários Atribuídos',
      visible: true,
      type: 'comentarios-atribuidos'
    };
    
    // Verificar se já existe
    if (!dashboardCards.find(card => card.id === 'comentarios-atribuidos')) {
      setDashboardCards(prev => [...prev, newCard]);
    }
  };

  // Função para adicionar novo bloco de Prioridades
  const addPrioritiesCard = () => {
    const newCard = {
      id: 'prioridades',
      title: 'Prioridades (LineUp)',
      visible: true,
      type: 'prioridades'
    };
    
    // Verificar se já existe
    if (!dashboardCards.find(card => card.id === 'prioridades')) {
      setDashboardCards(prev => [...prev, newCard]);
    }
  };

  // Função para obter dados de comentários atribuídos (mock)
  const getAssignedCommentsData = () => {
    return [
      { id: '1', author: 'João Silva', comment: 'Preciso que você revise o documento...', project: 'Projeto A', time: '2 horas atrás', priority: 'high' },
      { id: '2', author: 'Maria Santos', comment: 'Pode verificar o status da tarefa?', project: 'Projeto B', time: '1 dia atrás', priority: 'medium' },
      { id: '3', author: 'Carlos Lima', comment: 'Excelente trabalho no relatório!', project: 'Projeto C', time: '3 dias atrás', priority: 'low' }
    ];
  };

  // Função para obter dados de prioridades (sincronizado com atividades)
  const getPrioritiesData = () => {
    return activities
      .filter(activity => 
        !activity.archived && // Filtra apenas se o campo archived existir e for false
        activity.status !== 'completed' &&
        activity.priority === 'high'
      )
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);
  };

  // Função para obter dados de novas mensagens (mock do chat)
  const getNewMessagesData = () => {
    return [
      { id: '1', sender: 'João Silva', message: 'Preciso de ajuda com o projeto...', time: '2 min atrás', unread: true },
      { id: '2', sender: 'Maria Santos', message: 'Reunião confirmada para amanhã', time: '15 min atrás', unread: true },
      { id: '3', sender: 'Carlos Lima', message: 'Documento enviado com sucesso', time: '1 hora atrás', unread: false }
    ];
  };

  // Função para renderizar o conteúdo de um bloco baseado no tipo
  const renderCardContent = (cardType: string) => {
    switch (cardType) {
      case 'recentes':
        return (
          <div className="space-y-3">
            {activities.filter(activity => !activity.archived).map((activity) => ( // Filtra apenas se o campo archived existir e for false
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                {getPriorityIcon(activity.priority)}
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{activity.title}</p>
                  <p className="text-gray-500 text-xs">• {getPriorityText(activity.priority)}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'agenda':
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-1" onClick={goToPreviousDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-gray-700 text-sm font-medium">{formatDate(currentDate)}</span>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-1" onClick={goToNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 px-3 py-1 text-sm flex items-center gap-2 transition-all duration-200"
                onClick={goToToday}
              >
                <CalendarDays className="h-4 w-4" />
                Hoje
              </Button>
            </div>
            
            <div className="space-y-3 mb-4">
              {calendarEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                  onClick={() => openCalendarModal(event)}
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm font-medium">{event.title}</p>
                    <p className="text-gray-600 text-xs">{event.time} • {event.type}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button 
                className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-md transition-all duration-300 text-[12px] h-[28px] mx-auto"
                onClick={navigateToCalendar}
              >
                <Plus size={12} />
                Ver Calendário
              </Button>
            </div>
            
            {/* Botão de lixeira no topo direito */}
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        );

      case 'pendentes':
        return (
          <div className="space-y-3">
            {activities.filter(activity => !activity.archived).map((activity) => ( // Filtra apenas se o campo archived existir e for false
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                {getPriorityIcon(activity.priority)}
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{activity.title}</p>
                  <p className="text-gray-500 text-xs">• {getPriorityText(activity.priority)}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'andamento':
        return (
          <div className="space-y-3">
            {getInProgressActivities().map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{activity.title}</p>
                  <p className="text-gray-500 text-xs">• {activity.type}</p>
                </div>
              </div>
            ))}
            {getInProgressActivities().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Nenhuma atividade em andamento. 
                  <span className="text-[#8854F7] underline cursor-pointer ml-1">Saiba mais</span>
                </p>
                <Button className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-md transition-all duration-300 text-[12px] h-[28px] mx-auto">
                  <Plus size={12} />
                  Iniciar atividade
                </Button>
              </div>
            )}
          </div>
        );

      case 'atrasadas':
        return (
          <div className="space-y-3">
            {getOverdueActivities().map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{activity.title}</p>
                  <p className="text-red-500 text-xs">• Atrasada desde {new Date(activity.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
            {getOverdueActivities().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Nenhuma atividade atrasada. 
                  <span className="text-[#8854F7] underline cursor-pointer ml-1">Saiba mais</span>
                </p>
              </div>
            )}
          </div>
        );

      case 'equipes':
        return (
          <div className="space-y-3">
            {getWorkGroupsData().map((group) => (
              <div 
                key={group.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openWorkGroupModal(group)}
              >
                <div 
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: group.color }}
                >
                  <Users className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{group.name}</p>
                  <p className="text-gray-500 text-xs">• {group.members} membros • {group.activeProjects} projetos</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'projetos':
        return (
          <div className="space-y-3">
            {getRecentProjects().map((project) => (
              <div 
                key={project.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openProjectModal(project)}
              >
                <div className="w-4 h-4 bg-[#8854F7] rounded-full flex items-center justify-center">
                  <FileText className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{project.name}</p>
                  <p className="text-gray-500 text-xs">• {getProjectStatusText(project.status)}</p>
                </div>
              </div>
            ))}
            {getRecentProjects().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Nenhum projeto recente. 
                  <span className="text-[#8854F7] underline cursor-pointer ml-1">Saiba mais</span>
                </p>
                <Button className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-md transition-all duration-300 text-[12px] h-[28px] mx-auto">
                  <Plus size={12} />
                  Criar projeto
                </Button>
              </div>
            )}
          </div>
        );

      case 'standup':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8854F7] via-[#6366F1] to-[#10B981] rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
        );

      case 'comentarios-atribuidos':
        return (
          <div className="space-y-3">
            {getAssignedCommentsData().map((comment) => (
              <div 
                key={comment.id} 
                className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  comment.priority === 'high' ? 'bg-red-500' : 
                  comment.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{comment.author}</p>
                  <p className="text-gray-600 text-xs">{comment.comment}</p>
                  <p className="text-gray-500 text-xs mt-1">• {comment.project} • {comment.time}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'prioridades':
        return (
          <div className="space-y-3">
            {getPrioritiesData().map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => openActivityModal(activity)}
              >
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <Flag className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{activity.title}</p>
                  <p className="text-red-500 text-xs">• Prioridade Alta • {new Date(activity.due_date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
            {getPrioritiesData().length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Flag className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Nenhuma atividade prioritária.
                </p>
              </div>
            )}
          </div>
        );

      case 'novas-mensagens':
        return (
          <div className="space-y-3">
            {getNewMessagesData().map((message) => (
              <div 
                key={message.id} 
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${message.unread ? 'bg-blue-500' : 'bg-gray-400'}`}>
                  <MessageCircle className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm font-medium">{message.sender}</p>
                  <p className="text-gray-500 text-xs">• {message.message} • {message.time}</p>
                </div>
                {message.unread && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Função para iniciar o drag
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    console.log('Drag started:', cardId); // Debug
    setDraggedCard(cardId);
    setIsDragging(true);
    setDragOverCard(null);
    
    // Definir dados do drag
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Efeito visual
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.opacity = '0.5';
      target.style.transform = 'scale(0.95)';
    }
  };

  // Função para permitir drop
  const handleDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedCard && draggedCard !== cardId) {
      setDragOverCard(cardId);
    }
  };

  // Função para finalizar o drop
  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    console.log('Drop:', draggedCard, 'onto:', targetCardId); // Debug
    
    if (draggedCard && draggedCard !== targetCardId) {
      // Reordenar os cards
      setDashboardCards(prev => {
        const cards = [...prev];
        const draggedIndex = cards.findIndex(card => card.id === draggedCard);
        const targetIndex = cards.findIndex(card => card.id === targetCardId);
        
        console.log('Reordering:', draggedIndex, 'to', targetIndex); // Debug
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const [draggedCardObj] = cards.splice(draggedIndex, 1);
          cards.splice(targetIndex, 0, draggedCardObj);
        }
        
        return cards;
      });
    }
    
    // Limpar estados
    setDraggedCard(null);
    setDragOverCard(null);
    setIsDragging(false);
  };

  // Função para finalizar o drag
  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag ended'); // Debug
    setDraggedCard(null);
    setDragOverCard(null);
    setIsDragging(false);
    
    // Restaurar aparência
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.opacity = '1';
      target.style.transform = '';
    }
  };

  return (
    <div className="min-h-screen">
      {/* PageHeader - apenas para Dashboard */}
      <PageHeader 
        showManageCardsButton={true}
        onManageCards={() => setIsManageCardsModalOpen(true)}
        showSettingsButton={true}
        onSettings={() => setIsGreetingSettingsOpen(true)}
        showPageIcon={true}
        showSidebarToggle={true}
      />
      
      {/* Dashboard Content */}
      <div className="p-6 pt-[60px]">
        {/* Header with Greeting and Manage Cards Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {showGreeting ? greeting : ''}
          </h1>
          <div className="flex items-center gap-3">
            {/* Botões agora estão na PageHeader */}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardCards.filter(card => card.visible).map((card) => (
            <div 
              key={card.id}
              className={`bg-white rounded-xl p-6 shadow-sm border border-gray-300 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-2 cursor-pointer relative group ${
                dragOverCard === card.id ? 'ring-2 ring-[#8854F7] ring-opacity-50 bg-purple-50' : ''
              } ${draggedCard === card.id ? 'opacity-50 scale-95' : ''}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, card.id)}
              onDragOver={(e) => handleDragOver(e, card.id)}
              onDrop={(e) => handleDrop(e, card.id)}
              onDragEnd={handleDragEnd}
            >
                {/* Botão de remoção - visível apenas no hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => removeCard(card.id)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover este campo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Botão de drag-and-drop - visível apenas no hover */}
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div
                    className="h-8 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing select-none bg-white rounded border border-gray-200 hover:bg-gray-50"
                    title="Clique e arraste para reordenar"
                    draggable={false}
                  >
                    <span className="text-lg text-gray-500 hover:text-gray-700 transition-colors">⋮⋮</span>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mb-4 pr-12 pl-12">{card.title}</h2>
                {renderCardContent(card.type)}
              </div>
            ))}
          </div>
        </div>

      {/* Modal Expandido com Detalhes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {modalType === 'activity' && 'Detalhes da Atividade'}
                {modalType === 'project' && 'Detalhes do Projeto'}
                {modalType === 'workgroup' && 'Detalhes da Equipe'}
                {modalType === 'calendar' && 'Detalhes do Evento'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Modal de Atividade */}
              {modalType === 'activity' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    </div>
                    <Badge className={`px-3 py-1 ${
                      selectedItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedItem.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      selectedItem.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusText(selectedItem.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Tag className="h-4 w-4" />
                        <span>Tipo: {selectedItem.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Data: {new Date(selectedItem.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Responsável: {selectedItem.responsibleId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/activities/${selectedItem.id}`)} className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 text-[12px] h-[28px]">
                      Ver na Página de Atividades
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}

              {/* Modal de Projeto */}
              {modalType === 'project' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    </div>
                    <Badge className="px-3 py-1 bg-blue-100 text-blue-800">
                      {selectedItem.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Criado: {new Date(selectedItem.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        <span>Status: {selectedItem.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/projects/${selectedItem.id}`)} className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 text-[12px] h-[28px]">
                      Ver na Página de Projetos
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}

              {/* Modal de Equipe de Trabalho */}
              {modalType === 'workgroup' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: selectedItem.color }}
                    >
                      {selectedItem.name.charAt(0)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{selectedItem.members} membros</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        <span>{selectedItem.activeProjects} projetos ativos</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Tag className="h-4 w-4" />
                        <span>Setor: {selectedItem.sector}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Membros da Equipe:</h4>
                    <div className="space-y-2">
                      {selectedItem.membersList?.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-[#0f172a] text-white">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-600">{member.position}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate(`/work-groups/${selectedItem.id}`)} className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 text-[12px] h-[28px]">
                      Ver na Página de Equipes
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              )}

              {/* Modal de Evento do Calendário */}
              {modalType === 'calendar' && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedItem.title}</h3>
                      <p className="text-gray-600 mt-1">{selectedItem.description}</p>
                    </div>
                    <Badge className="px-3 py-1 bg-blue-100 text-blue-800">
                      {selectedItem.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Data: {new Date(selectedItem.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Horário: {selectedItem.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Local: {selectedItem.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Participantes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.attendees?.map((attendee: string, index: number) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {attendee}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/calendar')} className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:from-[#0a1128] hover:to-[#1a2332] text-white px-3 py-1.5 rounded-md shadow-md transition-all duration-300 text-[12px] h-[28px]">
                      Ver no Calendário
                    </Button>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Fechar
                    </Button>
      </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Gerenciar Cartões */}
      <Dialog open={isManageCardsModalOpen} onOpenChange={setIsManageCardsModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar cartões
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pb-4">
            <div className="text-sm text-gray-600 mb-4">
              Adicione novos cartões ao seu dashboard para personalizar sua experiência.
            </div>
            
            {/* Comentários atribuídos */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Comentários atribuídos</h4>
                <p className="text-sm text-gray-600">Visualize os comentários atribuídos a você e realize as devidas ações.</p>
              </div>
              {dashboardCards.find(card => card.id === 'comentarios-atribuidos') ? (
                <Button 
                  size="sm"
                  className="bg-[#8854F7] hover:bg-[#7c4df0] text-white px-3 py-1 h-8 transition-all duration-200"
                  disabled
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Adicionado
                </Button>
              ) : (
                <Button 
                  size="sm"
                  className="bg-[#8854F7] hover:bg-[#7c4df0] text-white px-3 py-1 h-8 transition-all duration-200 hover:scale-105"
                  onClick={addAssignedCommentsCard}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
            
            {/* Prioridades (LineUp) */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Prioridades (LineUp)</h4>
                <p className="text-sm text-gray-600">Junte as tarefas mais importantes em uma lista concisa.</p>
              </div>
              {dashboardCards.find(card => card.id === 'prioridades') ? (
                <Button 
                  size="sm"
                  className="bg-[#8854F7] hover:bg-[#7c4df0] text-white px-3 py-1 h-8 transition-all duration-200"
                  disabled
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Adicionado
                </Button>
              ) : (
                <Button 
                  size="sm"
                  className="bg-[#8854F7] hover:bg-[#7c4df0] text-white px-3 py-1 h-8 transition-all duration-200 hover:scale-105"
                  onClick={addPrioritiesCard}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">Cartões Ativos:</div>
              <div className="space-y-2">
                {dashboardCards.filter(card => card.visible).map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <span className="text-sm text-gray-700">{card.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      Ativo
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações da Saudação */}
      <Dialog open={isGreetingSettingsOpen} onOpenChange={setIsGreetingSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Layout
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Saudação da página</h4>
                  <p className="text-sm text-gray-600">Exibir saudação personalizada no topo</p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <div className="relative">
                <input
                  type="checkbox"
                  id="greeting-toggle"
                  checked={showGreeting}
                  onChange={(e) => setShowGreeting(e.target.checked)}
                  className="sr-only"
                />
                <label
                  htmlFor="greeting-toggle"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                    showGreeting ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      showGreeting ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600">
                {showGreeting 
                  ? 'A saudação será exibida no topo da página com base no horário atual.'
                  : 'A saudação não será exibida na página.'
                }
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
