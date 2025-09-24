import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVB } from '@/contexts/VBContext';
import { useActivities } from '@/hooks/useActivities';
import { supabase } from '@/integrations/supabase/client';
import { DropResult } from 'react-beautiful-dnd';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';
import KanbanBoard from '@/components/KanbanBoard';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import BitrixActivityForm from '@/components/BitrixActivityForm';
import FilterBar from '@/components/FilterBar';
import { 
  Search,
  Plus,
  Eye,
  User,
  Share,
  ChevronDown,
  MoreHorizontal,
  Kanban,
  List,
  Clock,
  Calendar,
  BarChart3,
  X,
  Zap,
  ArrowUpDown,
  Building2,
  Edit,
  Trash2,
  AlignJustify
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Activities = () => {
  const { state } = useVB();
  const { companies, employees } = state;
  const { activities, loading, error, createActivity, updateActivity, deleteActivity, moveActivity, refetch, fetchActivities } = useActivities();
  const { topBarColor } = useTheme();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard'>('board');
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [prazoViewMode, setPrazoViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [expandedSprint, setExpandedSprint] = useState<number | null>(null);
  const [sprintsViewMode, setSprintsViewMode] = useState<'compact' | 'expanded'>('compact');
  const [sprintsMinimized, setSprintsMinimized] = useState(false);
  const [isKanbanEditModalOpen, setIsKanbanEditModalOpen] = useState(false);
  // Estado inicial vazio - será preenchido pelo useEffect
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [kanbanLoaded, setKanbanLoaded] = useState(false);
  
  // Estados para controle
  const [forceLoading, setForceLoading] = useState(false);
  
  // Usar contexto do sidebar
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
  
  // Debug do estado do sidebar
  console.log('🔧 [ACTIVITIES] Estado do sidebar:', { sidebarExpanded, showMenuButtons });

  // Carregar configurações do Kanban salvas
  useEffect(() => {
    // Limpar configuração salva para forçar uso das colunas padrão
    localStorage.removeItem('kanbanColumns');
    console.log('🧹 [KANBAN] Limpando configuração salva e usando padrão');
    
    // Usar configuração padrão das Activities - CORRIGIDA para corresponder à imagem
    console.log('📋 [KANBAN] Usando configuração padrão corrigida');
    setKanbanColumns([
      { id: 'todo', name: 'PENDENTE', color: 'gray', status: 'todo' },
      { id: 'doing', name: 'EM PROGRESSO', color: 'orange', status: 'doing' },
      { id: 'done', name: 'CONCLUÍDA', color: 'green', status: 'done' }
    ]);
    setKanbanLoaded(true);
  }, []);

  // Salvar configurações do Kanban sempre que houver mudanças (apenas após carregar)
  useEffect(() => {
    if (kanbanLoaded && kanbanColumns.length > 0) {
      localStorage.setItem('kanbanColumns', JSON.stringify(kanbanColumns));
    }
  }, [kanbanColumns, kanbanLoaded]);

  // Carregar atividades quando a página é montada
  useEffect(() => {
    // Se não há atividades carregadas e não está carregando, forçar carregamento
    if (activities.length === 0 && !loading && !error) {
      fetchActivities();
    }
  }, [activities.length, loading, error, fetchActivities]);

  // Debug simplificado apenas quando necessário
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && activities.length > 0) {
      console.log('📊 Atividades carregadas na página:', activities.length);
    }
  }, [activities]);

  // Função para debug - recarregar atividades manualmente
  const handleDebugReload = async () => {
    console.log('🔧 [DEBUG] Recarregando atividades manualmente...');
    try {
      await refetch();
      toast({
        title: "Atividades recarregadas",
        description: `Encontradas ${activities.length} atividades`
      });
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao recarregar:', error);
      toast({
        title: "Erro ao recarregar",
        description: "Erro ao recarregar atividades",
        variant: "destructive"
      });
    }
  };

  // Função para debug - verificar atividades no Supabase
  const handleDebugCheckSupabase = async () => {
    console.log('🔍 [DEBUG] Verificando atividades diretamente no Supabase...');
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [DEBUG] Erro ao consultar Supabase:', error);
        toast({
          title: "Erro na consulta",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('📊 [DEBUG] Atividades encontradas no Supabase:', data?.length || 0);
        console.log('📋 [DEBUG] Detalhes:', data?.map(a => ({
          id: a.id,
          title: a.title,
          status: a.status,
          created_at: a.created_at
        })));
        toast({
          title: "Consulta realizada",
          description: `Encontradas ${data?.length || 0} atividades no Supabase`
        });
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erro na consulta:', error);
      toast({
        title: "Erro na consulta",
        description: "Erro ao consultar Supabase",
        variant: "destructive"
      });
    }
  };

  // Timeout para evitar loading infinito
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setForceLoading(true);
      }, 10000); // 10 segundos

      return () => clearTimeout(timeout);
    } else {
      setForceLoading(false);
    }
  }, [loading]);

  // Calcular largura dos blocos para ocupar toda a tela sem scroll horizontal
  const getBlockWidth = () => {
    const sidebarWidth = sidebarExpanded ? 240 : 64;
    const containerPadding = 24; // Padding do container principal
    const screenWidth = window.innerWidth;
    const availableWidth = screenWidth - sidebarWidth - containerPadding;
    
    // Usar o número real de colunas configuradas
    const numberOfColumns = kanbanColumns.length || 5;
    const gapSize = 8; // Gap entre colunas
    const totalGaps = Math.max(numberOfColumns - 1, 0) * gapSize;
    const blockWidth = (availableWidth - totalGaps) / numberOfColumns;
    
    // Garantir largura mínima para usabilidade
    const minWidth = 200;
    const calculatedWidth = Math.max(Math.floor(blockWidth), minWidth);
    
    return `${calculatedWidth}px`;
  };

  // Container deve ocupar toda a largura disponível sem scroll horizontal
  const getContainerWidth = () => {
    const sidebarWidth = sidebarExpanded ? 240 : 64;
    return `calc(100vw - ${sidebarWidth}px - 24px)`; // Largura total menos sidebar e padding
  };
  
  // Estilo do container Kanban para eliminar scroll horizontal
  const getKanbanContainerStyle = () => {
    const numberOfColumns = kanbanColumns.length || 5;
    return {
      display: 'flex',
      gap: '8px',
      width: '100%',
      maxWidth: getContainerWidth(),
      overflow: 'hidden', // Eliminar scroll horizontal
      justifyContent: 'space-between'
    };
  };
  
  // Hook para gerenciar filtros
  const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Função para aplicar filtros
  const applyFilters = async () => {
    const filterParams = getFilterParams();
    await fetchActivities(filterParams);
  };

  // Aplicar filtros automaticamente
  const handleFilterApply = () => {
    applyFilters();
  };

  // Mapeamento de cores para as bordas superiores das colunas
  const getColumnBorderColor = (status: string) => {
    const colorMap = {
      'open': '#D1D5DB',      // Cinza
      'pending': '#FACC15',   // Amarelo
      'in_progress': '#3B82F6', // Azul
      'review': '#EC4899',    // Rosa
      'completed': '#10B981'  // Verde
    };
    return colorMap[status as keyof typeof colorMap] || '#D1D5DB';
  };

  // Função para obter o nome de exibição do status
  const getStatusDisplayName = (status: string) => {
    const nameMap = {
      'open': 'ABERTO',
      'pending': 'PENDENTE', 
      'in_progress': 'EM PROGRESSO',
      'review': 'REVISÃO',
      'completed': 'CONCLUÍDO'
    };
    return nameMap[status as keyof typeof nameMap] || status.toUpperCase();
  };

  // Funções para gerenciar sprints
  const getSprintData = () => {
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const inProgressActivities = activities.filter(a => a.status === 'in_progress').length;
    const pendingActivities = activities.filter(a => a.status === 'pending' || a.status === 'open').length;
    
    // Simular sprints baseados nas atividades reais
    const sprints = [
      {
        id: 1,
        name: 'Sprint 1',
        completed: Math.min(completedActivities, Math.floor(totalActivities * 0.3)),
        total: Math.floor(totalActivities * 0.3),
        startDate: '01/01',
        endDate: '15/01',
        status: 'completed',
        progress: Math.min(completedActivities, Math.floor(totalActivities * 0.3)) / Math.floor(totalActivities * 0.3) * 100
      },
      {
        id: 2,
        name: 'Sprint 2',
        completed: Math.min(completedActivities - Math.floor(totalActivities * 0.3), Math.floor(totalActivities * 0.4)),
        total: Math.floor(totalActivities * 0.4),
        startDate: '16/01',
        endDate: '31/01',
        status: 'completed',
        progress: Math.min(completedActivities - Math.floor(totalActivities * 0.3), Math.floor(totalActivities * 0.4)) / Math.floor(totalActivities * 0.4) * 100
      },
      {
        id: 3,
        name: 'Sprint 3',
        completed: inProgressActivities,
        total: inProgressActivities + Math.floor(pendingActivities * 0.5),
        startDate: '01/02',
        endDate: '15/02',
        status: 'in_progress',
        progress: inProgressActivities / (inProgressActivities + Math.floor(pendingActivities * 0.5)) * 100
      },
      {
        id: 4,
        name: 'Sprint 4',
        completed: 0,
        total: Math.max(pendingActivities - Math.floor(pendingActivities * 0.5), 1),
        startDate: '16/02',
        endDate: '28/02',
        status: 'planned',
        progress: 0
      }
    ];

    return sprints;
  };

  const handleToggleSprintExpansion = (sprintId: number) => {
    setExpandedSprint(expandedSprint === sprintId ? null : sprintId);
  };

  const handleToggleSprintsView = () => {
    setSprintsViewMode(sprintsViewMode === 'compact' ? 'expanded' : 'compact');
  };

  const handleToggleSprintsMinimized = () => {
    setSprintsMinimized(prev => !prev);
  };

  const handleOpenKanbanEditModal = () => {
    setIsKanbanEditModalOpen(true);
  };

  const handleCloseKanbanEditModal = () => {
    setIsKanbanEditModalOpen(false);
  };

  // Wrapper para o moveActivity do KanbanBoard
  const handleMoveActivity = async (activityId: string, newColumn: string, newPosition: number) => {
    try {
      // Mapear coluna para status
      let newStatus = 'todo'; // padrão
      if (newColumn === 'todo') newStatus = 'todo';
      else if (newColumn === 'doing') newStatus = 'doing';
      else if (newColumn === 'done') newStatus = 'done';
      
      console.log('🔄 Movendo atividade:', { activityId, newColumn, newStatus });
      
      const result = await moveActivity(activityId, newStatus);
      
      if (result.error) {
        console.error('❌ Erro ao mover atividade:', result.error);
        // Mostrar toast de erro
        toast({
          title: "Erro ao mover atividade",
          description: result.error,
          variant: "destructive"
        });
        return { data: null, error: result.error };
      }
      
      console.log('✅ Atividade movida com sucesso');
      
      // Mostrar toast de sucesso
      toast({
        title: "Atividade movida",
        description: `Atividade movida para ${newColumn}`,
      });
      
      return result;
    } catch (error) {
      console.error('❌ Erro no handleMoveActivity:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Mostrar toast de erro
      toast({
        title: "Erro ao mover atividade",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { data: null, error: errorMessage };
    }
  };

  const handleUpdateKanbanColumn = (columnId: string, updates: any) => {
    setKanbanColumns(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, ...updates } : col
      )
    );
    
    // Feedback visual para mudanças
    if (updates.name) {
      toast({
        title: "Nome atualizado",
        description: `Etapa renomeada para "${updates.name}"`,
        duration: 2000,
      });
    }
  };

  const handleAddKanbanColumn = () => {
    const newId = `column_${Date.now()}`;
    const newColumn = {
      id: newId,
      name: 'NOVA ETAPA',
      color: 'blue',
      status: newId
    };
    setKanbanColumns(prev => [...prev, newColumn]);
    
    toast({
      title: "Nova etapa adicionada",
      description: "Você pode personalizar o nome e cor da nova etapa",
      duration: 3000,
    });
  };

  const handleRemoveKanbanColumn = (columnId: string) => {
    if (kanbanColumns.length > 1) {
      const columnToRemove = kanbanColumns.find(col => col.id === columnId);
      setKanbanColumns(prev => prev.filter(col => col.id !== columnId));
      
      toast({
        title: "Etapa removida",
        description: `"${columnToRemove?.name}" foi removida do seu Kanban`,
        duration: 3000,
      });
    }
  };

  const handleReorderKanbanColumns = (startIndex: number, endIndex: number) => {
    const result = Array.from(kanbanColumns);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setKanbanColumns(result);
  };

  const handleStartSprint = (sprintId: number) => {
    toast({
      title: "Sprint iniciada",
      description: `Sprint ${sprintId} foi iniciada com sucesso`
    });
  };

  const handleFinishSprint = (sprintId: number) => {
    toast({
      title: "Sprint finalizada",
      description: `Sprint ${sprintId} foi finalizada com sucesso`
    });
  };

  const handleActivityClick = (activityId: string) => {
    navigate(`/activities/${activityId}`);
  };

  const handleCreateActivity = async (formData: any) => {
    try {
      const activityData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as 'task' | 'meeting' | 'call' | 'email' | 'other',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: formData.status || 'todo',
        due_date: formData.date ? new Date(formData.date).toISOString() : undefined,
        responsible_id: formData.responsibleId || undefined,
        project_id: formData.projectId || undefined,
        work_group: formData.workGroup || undefined,
        department: formData.department || undefined,
        company_id: formData.companyId || undefined
      };

      console.log('🔄 [CREATE] Criando atividade:', activityData);

      const result = await createActivity(activityData);
      
      if (result && !result.error) {
        console.log('✅ [CREATE] Atividade criada com sucesso:', result.data);
        
        toast({
          title: "Atividade criada",
          description: "Nova atividade foi criada com sucesso"
        });
        
        setIsCreateModalOpen(false);
        
        // Recarregar atividades imediatamente
        console.log('🔄 [CREATE] Recarregando atividades...');
        await refetch();
        
      } else if (result && result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ [CREATE] Erro ao criar atividade:', error);
      toast({
        title: "Erro ao criar atividade",
        description: error instanceof Error ? error.message : "Erro inesperado ao criar atividade",
        variant: "destructive"
      });
    }
  };

  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleUpdateActivity = async (formData: any) => {
    try {
      if (!editingActivity) return;

      const updateData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as 'task' | 'meeting' | 'call' | 'email' | 'other',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: formData.status as 'open' | 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled',
        due_date: formData.date ? new Date(formData.date).toISOString() : undefined,
        responsible_id: formData.responsibleId || undefined
      };

      const result = await updateActivity(editingActivity.id, updateData);
      
      if (result) {
        toast({
          title: "Tarefa atualizada",
          description: "Tarefa foi atualizada com sucesso"
        });
        setIsEditModalOpen(false);
        setEditingActivity(null);
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

    try {
      const result = await deleteActivity(activityId);
      
      if (result) {
        toast({
          title: "Tarefa excluída",
          description: "Tarefa foi excluída com sucesso"
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir tarefa",
        variant: "destructive"
      });
    }
  };


  // Função para lidar com drag and drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não há destino, não faz nada
    if (!destination) return;

    // Se o item foi solto na mesma posição, não faz nada
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    try {
      // Atualizar o status da atividade
      const newStatus = destination.droppableId;
      const result = await updateActivity(draggableId, { status: newStatus });
      
      if (result) {
        toast({
          title: "Status atualizado",
          description: "Tarefa movida com sucesso"
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover tarefa",
        variant: "destructive"
      });
    }
  };

  // Funções de scroll removidas - layout agora se ajusta sem scroll horizontal

  const handleCreateQuickTask = async (title: string, status: string) => {
    try {
      const activityData = {
        title,
        description: '',
        type: 'task' as const,
        priority: 'medium' as const,
        status: status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        responsible_id: employees.length > 0 ? employees[0].id : undefined
      };

      const result = await createActivity(activityData);
      
      if (result) {
        toast({
          title: "Tarefa rápida criada",
          description: "Nova tarefa foi criada com sucesso"
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa rápida",
        variant: "destructive"
      });
    }
  };

  const handleOpenCreateModal = (columnId?: string) => {
    setIsCreateModalOpen(true);
    // Aqui poderia definir o status inicial baseado na coluna
    // Por enquanto, apenas abre o modal
  };

  const handleOpenCreateModalClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const columnId = event.currentTarget.dataset.columnId;
    handleOpenCreateModal(columnId);
  };

  const handleViewModeChange = (mode: 'board' | 'lista' | 'prazo' | 'planejador' | 'calendario' | 'dashboard') => {
    setViewMode(mode);
  };

  // Função para renderizar os botões de ação de cada atividade
  const renderActivityActions = (activity: any) => (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditActivity(activity);
        }}
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
        title="Editar tarefa"
      >
        <Edit className="h-3 w-3" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteActivity(activity.id);
        }}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
        title="Excluir tarefa"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );

  // Botões de visualização exatos da imagem
  const viewButtons = [
    { 
      id: 'board', 
      label: 'Quadro',
      icon: Kanban,
      active: viewMode === 'board'
    },
    {
      id: 'lista', 
      label: 'Lista',
      icon: List,
      active: viewMode === 'lista'
    },
    {
      id: 'prazo', 
      label: 'Prazo',
      icon: Clock,
      active: viewMode === 'prazo'
    },
    {
      id: 'planejador', 
      label: 'Planejador',
      icon: Kanban,
      active: viewMode === 'planejador'
    },
    {
      id: 'calendario', 
      label: 'Calendário',
      icon: Calendar,
      active: viewMode === 'calendario'
    },
    {
      id: 'dashboard', 
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  // Tratamento de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar atividades</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !forceLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando suas tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header fixo responsivo ao sidebar */}
        <div 
          className="fixed top-[38px] right-0 bg-white border-b border-gray-200 z-30 transition-all duration-300"
          style={{
            left: sidebarExpanded ? '240px' : '64px'
          }}
        >
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão fixo de toggle da sidebar - SEMPRE VISÍVEL quando colapsada */}
              {!sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={14} />
                </Button>
              )}
              
              {viewButtons.map((button) => {
                const Icon = button.icon;
                return (
                <Button
                    key={button.id}
                    variant="ghost"
                  size="sm"
                    onClick={() => handleViewModeChange(button.id as any)}
                  className={`
                      h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                      ${button.active 
                        ? 'bg-gray-50 text-slate-900 shadow-inner' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {button.label}
                </Button>
                );
              })}
            </div>
            
            {/* Botões de ação na extrema direita */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                title="Buscar"
              >
                <Search className="h-4 w-4 text-gray-700" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsAutomationModalOpen(true)}
                title="Automações"
              >
                <Zap className="h-4 w-4 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Barra de filtros funcionais */}
        <FilterBar
          filters={filters}
          onFilterChange={updateFilter}
          onApplyFilters={handleFilterApply}
          onClearFilters={clearFilters}
          employees={employees}
          departments={state.settings.departments}
          searchPlaceholder="Filtrar por nome da tarefa..."
        />
      </div>

      {/* Container principal com padding para o header fixo */}
      <div className="pt-[140px] px-6" style={{minHeight: 'calc(100vh - 38px)'}}>

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && (
          <div className="w-full">
            {/* Cabeçalho do Kanban Board */}
            <div className="flex items-center justify-end mb-4 mt-2">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenKanbanEditModal}
                  className="flex items-center text-sm px-3 py-2 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
            
            {/* KanbanBoard - Drag and Drop com @hello-pangea/dnd */}
            <KanbanBoard
              activities={activities}
              onMoveActivity={handleMoveActivity}
              onReindexColumn={async () => ({ data: null, error: null })}
              onAddActivity={handleOpenCreateModal}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
              className="px-3"
            />
          </div>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'lista' && (
          <div className="w-full -ml-2">
            {/* Tabela de Atividades */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Cabeçalho da Tabela */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center px-6 py-4 gap-4">
                  <div className="w-12 flex items-center">
                    <Checkbox className="h-4 w-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>Nome</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Atividade</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Prazo Final</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Criado Por</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-40 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Responsável</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                    <span>Projeto</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="w-24 flex items-center justify-end gap-2 text-sm font-medium text-gray-700">
                    <span>Marcadores</span>
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Linhas da Tabela */}
              <div className="divide-y divide-gray-200">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-center px-6 py-4 h-16 hover:bg-gray-50 transition-colors gap-4">
                  <div className="w-12 flex items-center">
                    <Checkbox className="h-4 w-4" />
                  </div>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">
                            {activity.title ? activity.title.charAt(0).toUpperCase() : 'A'}
                          </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                          <span className="text-sm text-gray-900 truncate">{activity.title}</span>
                          <span className="text-xs text-gray-400">
                            {activity.description || 'Sem descrição'}
                          </span>
                    </div>
                  </div>
                  <div className="w-32 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-white font-medium">
                              {activity.type ? activity.type.charAt(0).toUpperCase() : 'O'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">
                            {activity.type === 'task' ? 'Tarefa' :
                             activity.type === 'meeting' ? 'Reunião' :
                             activity.type === 'call' ? 'Chamada' :
                             activity.type === 'email' ? 'Email' : 'Outro'}
                          </span>
                        </div>
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                        </span>
                  </div>
                  <div className="w-32 flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">
                            {activity.owner_id ? activity.owner_id.charAt(0).toUpperCase() : 'A'}
                          </span>
                    </div>
                        <span className="text-sm text-gray-900">
                          {activity.owner_id || 'Admin'}
                        </span>
                  </div>
                  <div className="w-40 flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-white font-medium">
                            {activity.responsible_id ? activity.responsible_id.charAt(0).toUpperCase() : 'F'}
                          </span>
                    </div>
                        <span className="text-sm text-gray-900">
                          {activity.responsible_id || 'Não atribuído'}
                        </span>
                  </div>
                  <div className="w-32 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400" />
                        <span>
                          {activity.project_id || 'Sem projeto'}
                        </span>
                  </div>
                  <div className="w-24 flex items-center justify-end">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          activity.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                          activity.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          activity.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {activity.priority === 'urgent' ? 'Urgente' :
                           activity.priority === 'high' ? 'Alta' :
                           activity.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Nenhuma atividade encontrada
                  </div>
                )}
              </div>
            </div>

            {/* Espaço branco inferior */}
            <div className="h-32 bg-[#F9FAFB]"></div>
          </div>
        )}

        {viewMode === 'prazo' && (
          <div className="w-full -ml-2">
            {/* Cartões de Resumo das Atividades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Cartão Vencidas */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate < today;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Vencidas</h3>
                  <p className="text-xs text-gray-600">Tarefas com prazo vencido</p>
                </div>
              </div>

              {/* Cartão Para Hoje */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      const dueDate = new Date(a.due_date);
                      return dueDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Para Hoje</h3>
                  <p className="text-xs text-gray-600">Tarefas para hoje</p>
                </div>
              </div>

              {/* Cartão Para Amanhã */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const dueDate = new Date(a.due_date);
                      return dueDate.toDateString() === tomorrow.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Para Amanhã</h3>
                  <p className="text-xs text-gray-600">Tarefas para amanhã</p>
                </div>
              </div>

              {/* Cartão Esta Semana */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const tomorrow = new Date(today);
                      tomorrow.setDate(today.getDate() + 1);
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + 7);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate >= tomorrow && dueDate <= endOfWeek;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Esta Semana</h3>
                  <p className="text-xs text-gray-600">Tarefas desta semana</p>
                </div>
              </div>

              {/* Cartão Mais Tarde */}
              <div className="bg-white/80 border border-gray-100 rounded-lg p-4 relative hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {activities.filter(a => {
                      if (!a.due_date) return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + 7);
                      const dueDate = new Date(a.due_date);
                      dueDate.setHours(0, 0, 0, 0);
                      return dueDate > endOfWeek;
                    }).length}
                  </span>
                </div>
                <div className="flex flex-col items-start text-left">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Mais Tarde</h3>
                  <p className="text-xs text-gray-600">Tarefas futuras</p>
                </div>
              </div>
            </div>

            {/* Visualização Principal por Prazo */}
            <div className="p-3">
              {/* Cabeçalho da Visualização */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <h3 className="text-base font-semibold text-gray-900/85">
                    Visualização por Prazo
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={prazoViewMode === 'lista' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs font-medium"
                    onClick={() => setPrazoViewMode('lista')}
                    style={prazoViewMode === 'lista' ? {
                      backgroundColor: topBarColor,
                      borderColor: topBarColor,
                      color: 'white'
                    } : {}}
                  >
                    Lista
                  </Button>
                  <Button
                    variant={prazoViewMode === 'kanban' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs font-medium"
                    onClick={() => setPrazoViewMode('kanban')}
                    style={prazoViewMode === 'kanban' ? {
                      backgroundColor: topBarColor,
                      borderColor: topBarColor,
                      color: 'white'
                    } : {}}
                  >
                    Kanban
                  </Button>

                </div>
              </div>

              {/* Conteúdo baseado no modo de visualização selecionado */}
              {prazoViewMode === 'kanban' ? (
                /* Kanban por Prazo - Grid horizontal com largura proporcional e espaçamento correto */
                <div className="grid grid-cols-5 gap-4 w-full overflow-hidden pb-6 items-start">
                  {/* Coluna VENCIDAS */}
                  <div className="w-full flex flex-col">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            VENCIDAS
                          </h3>
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                            {activities.filter(activity => {
                              if (!activity.due_date) return false;
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const dueDate = new Date(activity.due_date);
                              dueDate.setHours(0, 0, 0, 0);
                              return dueDate < today;
                            }).length}
                          </span>
                        </div>
                      </div>
                      
                      {/* Linha colorida discreta abaixo do título */}
                      <div className="w-full h-0.5 bg-red-500 rounded mb-4"></div>

                      <div className="space-y-3 flex-1">
                        {activities
                          .filter(activity => {
                            if (!activity.due_date) return false;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dueDate = new Date(activity.due_date);
                            dueDate.setHours(0, 0, 0, 0);
                            return dueDate < today;
                          })
                          .map(activity => (
                            <div key={activity.id} className="group relative bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                              {/* Botões de ação - aparecem apenas no hover */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                  title="Editar tarefa"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity(activity.id);
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="mb-2 pr-8">
                                <h4 className="text-xs font-normal text-gray-900 mb-1">
                                  {activity.title}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {activity.description || 'Sem descrição'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  activity.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  activity.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  activity.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {activity.priority === 'urgent' ? 'Urgente' :
                                   activity.priority === 'high' ? 'Alta' :
                                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                              </div>
                            </div>
                          ))}
                        
                        {activities.filter(activity => {
                          if (!activity.due_date) return false;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const dueDate = new Date(activity.due_date);
                          dueDate.setHours(0, 0, 0, 0);
                          return dueDate < today;
                        }).length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Nenhuma atividade vencida
                          </div>
                        )}
                      </div>

                      {/* Botão para criar nova tarefa */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
                        onClick={handleOpenCreateModal}
                      >
                        + NOVA TAREFA
                      </Button>
                    </div>
                  </div>

                  {/* Coluna HOJE */}
                  <div className="w-full flex flex-col">
                    <div className="bg-white/50 border border-gray-100 rounded-lg p-3 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            HOJE
                          </h3>
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                            {activities.filter(activity => {
                              if (!activity.due_date) return false;
                              const today = new Date();
                              const dueDate = new Date(activity.due_date);
                              return dueDate.toDateString() === today.toDateString();
                            }).length}
                          </span>
                        </div>
                      </div>
                      
                      {/* Linha colorida discreta abaixo do título */}
                      <div className="w-full h-0.5 bg-yellow-500 rounded mb-4"></div>

                      <div className="space-y-3 flex-1">
                        {activities
                          .filter(activity => {
                            if (!activity.due_date) return false;
                            const today = new Date();
                            const dueDate = new Date(activity.due_date);
                            return dueDate.toDateString() === today.toDateString();
                          })
                          .map(activity => (
                            <div key={activity.id} className="group relative bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                              {/* Botões de ação - aparecem apenas no hover */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                  title="Editar tarefa"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity(activity.id);
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="mb-2 pr-8">
                                <h4 className="text-xs font-normal text-gray-900 mb-1">
                                  {activity.title}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {activity.description || 'Sem descrição'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  activity.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  activity.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  activity.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {activity.priority === 'urgent' ? 'Urgente' :
                                   activity.priority === 'high' ? 'Alta' :
                                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                              </div>
                            </div>
                          ))}
                        
                        {activities.filter(activity => {
                          if (!activity.due_date) return false;
                          const today = new Date();
                          const dueDate = new Date(activity.due_date);
                          return dueDate.toDateString() === today.toDateString();
                        }).length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Nenhuma atividade para hoje
                          </div>
                        )}
                      </div>

                      {/* Botão para criar nova tarefa */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
                        onClick={handleOpenCreateModal}
                      >
                        + NOVA TAREFA
                      </Button>
                    </div>
                  </div>

                  {/* Coluna AMANHÃ */}
                  <div className="w-full flex flex-col">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            AMANHÃ
                          </h3>
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                            {activities.filter(activity => {
                              if (!activity.due_date) return false;
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const dueDate = new Date(activity.due_date);
                              return dueDate.toDateString() === tomorrow.toDateString();
                            }).length}
                          </span>
                        </div>
                      </div>
                      
                      {/* Linha colorida discreta abaixo do título */}
                      <div className="w-full h-0.5 bg-blue-500 rounded mb-4"></div>

                      <div className="space-y-3 flex-1">
                        {activities
                          .filter(activity => {
                            if (!activity.due_date) return false;
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const dueDate = new Date(activity.due_date);
                            return dueDate.toDateString() === tomorrow.toDateString();
                          })
                          .map(activity => (
                            <div key={activity.id} className="group relative bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                              {/* Botões de ação - aparecem apenas no hover */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                  title="Editar tarefa"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity(activity.id);
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="mb-2 pr-8">
                                <h4 className="text-xs font-normal text-gray-900 mb-1">
                                  {activity.title}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {activity.description || 'Sem descrição'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  activity.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  activity.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  activity.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {activity.priority === 'urgent' ? 'Urgente' :
                                   activity.priority === 'high' ? 'Alta' :
                                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                              </div>
                            </div>
                          ))}
                        
                        {activities.filter(activity => {
                          if (!activity.due_date) return false;
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const dueDate = new Date(activity.due_date);
                          return dueDate.toDateString() === tomorrow.toDateString();
                        }).length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Nenhuma atividade para amanhã
                          </div>
                        )}
                      </div>

                      {/* Botão para criar nova tarefa */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
                        onClick={handleOpenCreateModal}
                      >
                        + NOVA TAREFA
                      </Button>
                    </div>
                  </div>

                  {/* Coluna ESTA SEMANA */}
                  <div className="w-full flex flex-col">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            ESTA SEMANA
                          </h3>
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                            {activities.filter(activity => {
                              if (!activity.due_date) return false;
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const tomorrow = new Date(today);
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const endOfWeek = new Date(today);
                              endOfWeek.setDate(today.getDate() + 7);
                              const dueDate = new Date(activity.due_date);
                              dueDate.setHours(0, 0, 0, 0);
                              return dueDate >= tomorrow && dueDate <= endOfWeek;
                            }).length}
                          </span>
                        </div>
                      </div>
                      
                      {/* Linha colorida discreta abaixo do título */}
                      <div className="w-full h-0.5 bg-green-500 rounded mb-4"></div>

                      <div className="space-y-3 flex-1">
                        {activities
                          .filter(activity => {
                            if (!activity.due_date) return false;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const tomorrow = new Date(today);
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            const endOfWeek = new Date(today);
                            endOfWeek.setDate(today.getDate() + 7);
                            const dueDate = new Date(activity.due_date);
                            dueDate.setHours(0, 0, 0, 0);
                            return dueDate >= tomorrow && dueDate <= endOfWeek;
                          })
                          .map(activity => (
                            <div key={activity.id} className="group relative bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                              {/* Botões de ação - aparecem apenas no hover */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                  title="Editar tarefa"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity(activity.id);
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="mb-2 pr-8">
                                <h4 className="text-xs font-normal text-gray-900 mb-1">
                                  {activity.title}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {activity.description || 'Sem descrição'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  activity.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  activity.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  activity.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {activity.priority === 'urgent' ? 'Urgente' :
                                   activity.priority === 'high' ? 'Alta' :
                                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                              </div>
                            </div>
                          ))}
                        
                        {activities.filter(activity => {
                          if (!activity.due_date) return false;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const tomorrow = new Date(today);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const endOfWeek = new Date(today);
                          endOfWeek.setDate(today.getDate() + 7);
                          const dueDate = new Date(activity.due_date);
                          dueDate.setHours(0, 0, 0, 0);
                          return dueDate >= tomorrow && dueDate <= endOfWeek;
                        }).length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Nenhuma atividade esta semana
                          </div>
                        )}
                      </div>

                      {/* Botão para criar nova tarefa */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
                        onClick={handleOpenCreateModal}
                      >
                        + NOVA TAREFA
                      </Button>
                    </div>
                  </div>

                  {/* Coluna MAIS TARDE */}
                  <div className="w-full flex flex-col">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                            MAIS TARDE
                          </h3>
                          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                            {activities.filter(activity => {
                              if (!activity.due_date) return false;
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const endOfWeek = new Date(today);
                              endOfWeek.setDate(today.getDate() + 7);
                              const dueDate = new Date(activity.due_date);
                              dueDate.setHours(0, 0, 0, 0);
                              return dueDate > endOfWeek;
                            }).length}
                          </span>
                        </div>
                      </div>
                      
                      {/* Linha colorida discreta abaixo do título */}
                      <div className="w-full h-0.5 bg-gray-500 rounded mb-4"></div>

                      <div className="space-y-3 flex-1">
                        {activities
                          .filter(activity => {
                            if (!activity.due_date) return false;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const endOfWeek = new Date(today);
                            endOfWeek.setDate(today.getDate() + 7);
                            const dueDate = new Date(activity.due_date);
                            dueDate.setHours(0, 0, 0, 0);
                            return dueDate > endOfWeek;
                          })
                          .map(activity => (
                            <div key={activity.id} className="group relative bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                              {/* Botões de ação - aparecem apenas no hover */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                  title="Editar tarefa"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity(activity.id);
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Excluir tarefa"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="mb-2 pr-8">
                                <h4 className="text-xs font-normal text-gray-900 mb-1">
                                  {activity.title}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {activity.description || 'Sem descrição'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  activity.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                  activity.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                  activity.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {activity.priority === 'urgent' ? 'Urgente' :
                                   activity.priority === 'high' ? 'Alta' :
                                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                              </div>
                            </div>
                          ))}
                        
                        {activities.filter(activity => {
                          if (!activity.due_date) return false;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const endOfWeek = new Date(today);
                          endOfWeek.setDate(today.getDate() + 7);
                          const dueDate = new Date(activity.due_date);
                          dueDate.setHours(0, 0, 0, 0);
                          return dueDate > endOfWeek;
                        }).length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            Nenhuma atividade futura
                          </div>
                        )}
                      </div>

                      {/* Botão para criar nova tarefa */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
                        onClick={handleOpenCreateModal}
                      >
                        + NOVA TAREFA
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Lista por Prazo - Visualização em lista com espaçamento correto */
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Cabeçalho da Lista */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <div className="col-span-4">Tarefa</div>
                      <div className="col-span-2">Prioridade</div>
                      <div className="col-span-2">Prazo</div>
                      <div className="col-span-2">Responsável</div>
                      <div className="col-span-2">Ações</div>
                    </div>
                  </div>

                  {/* Lista de Atividades */}
                  <div className="divide-y divide-gray-200">
                    {activities
                      .filter(activity => activity.due_date) // Filtra apenas atividades com prazo
                      .sort((a, b) => {
                        // Ordena por prazo: vencidas primeiro, depois por data
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        const aDue = new Date(a.due_date);
                        const bDue = new Date(b.due_date);
                        
                        const aIsOverdue = aDue < today;
                        const bIsOverdue = bDue < today;
                        
                        if (aIsOverdue && !bIsOverdue) return -1;
                        if (!aIsOverdue && bIsOverdue) return 1;
                        
                        return aDue.getTime() - bDue.getTime();
                      })
                      .map(activity => {
                        const dueDate = new Date(activity.due_date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isOverdue = dueDate < today;
                        
                        return (
                          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Tarefa */}
                              <div className="col-span-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {activity.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 truncate mt-1">
                                      {activity.description || 'Sem descrição'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Prioridade */}
                              <div className="col-span-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  activity.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  activity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  activity.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {activity.priority === 'urgent' ? 'Urgente' :
                                   activity.priority === 'high' ? 'Alta' :
                                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>

                              {/* Prazo */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                    {dueDate.toLocaleDateString('pt-BR')}
                                  </span>
                                  {isOverdue && (
                                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                      Vencida
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Responsável */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {activity.responsible_id || 'Não atribuído'}
                                  </span>
                                </div>
                              </div>

                              {/* Ações */}
                              <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-200"
                                    onClick={() => handleEditActivity(activity)}
                                  >
                                    <Edit className="h-4 w-4 text-gray-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-200"
                                    onClick={() => handleActivityClick(activity.id)}
                                  >
                                    <Eye className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    
                    {activities.filter(activity => activity.due_date).length === 0 && (
                      <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
                        <p className="text-gray-600">Não há atividades com prazo definido no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'planejador' && (
          <div className="planejador-page bg-[#f5f7fb] min-h-screen pl-2 pr-6 py-6">

            {/* Planejamento Kanban */}
            <section className="kanban-section pl-2 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Kanban className="w-5 h-5 text-blue-400" />
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900/85">Planejamento Kanban</h2>
                    <span className="text-xs text-gray-600/85">{activities.length} tarefas</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                    variant="ghost"
                      size="sm"
                    onClick={handleDebugReload}
                    className="flex items-center text-xs px-2 py-1 h-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recarregar
                    </Button>
                    <Button 
                    variant="ghost"
                      size="sm"
                    onClick={handleDebugCheckSupabase}
                    className="flex items-center text-xs px-2 py-1 h-6 text-green-600 hover:text-green-800 hover:bg-green-50"
                    >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Verificar Supabase
                    </Button>
                    <Button 
                    variant="ghost"
                      size="sm"
                    onClick={handleOpenKanbanEditModal}
                    className="flex items-center text-xs px-2 py-1 h-6 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                    </Button>
                  <span className="text-sm text-gray-600">{activities.length} tarefas</span>
                  </div>
                </div>

              {/* Kanban por Status - Grid horizontal com largura proporcional */}
              {!kanbanLoaded ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-500">Carregando configurações do Kanban...</div>
                      </div>
              ) : (
                <div className={`grid gap-4 w-full overflow-hidden pb-6 items-start`} style={{ gridTemplateColumns: `repeat(${kanbanColumns.length}, 1fr)` }}>
                  {kanbanColumns.map((column, index) => {
                  const columnActivities = activities.filter(activity => {
                    // Debug: Log das atividades e status
                    console.log('🔍 [KANBAN] Verificando atividade:', {
                      activityId: activity.id,
                      activityTitle: activity.title,
                      activityStatus: activity.status,
                      columnStatus: column.status,
                      columnName: column.name
                    });
                    
                    // Lógica simplificada de filtragem - CORRIGIDA
                    let matches = false;
                    
                    // Mapeamento direto e correto dos status
                    if (column.status === 'todo') {
                      matches = activity.status === 'todo' || activity.status === 'pending' || activity.status === 'open';
                    } else if (column.status === 'doing') {
                      matches = activity.status === 'doing' || activity.status === 'in_progress';
                    } else if (column.status === 'done') {
                      matches = activity.status === 'done' || activity.status === 'completed';
                    } else {
                      // Para colunas customizadas, usar mapeamento direto
                      matches = activity.status === column.status;
                    }
                    
                    // Debug adicional para verificar o mapeamento
                    if (activity.status === 'todo' && column.status === 'todo') {
                      console.log(`🎯 [KANBAN] Match direto: "${activity.title}" (${activity.status}) → ${column.name} (${column.status})`);
                    }
                    
                    if (matches) {
                      console.log(`✅ [KANBAN] Atividade "${activity.title}" adicionada à coluna ${column.name}`);
                    }
                    
                    return matches;
                  });
                  
                  console.log(`📊 [KANBAN] Coluna ${column.name} (${column.status}): ${columnActivities.length} atividades`);
                  
                  // Debug adicional para verificar se as atividades estão sendo renderizadas
                  if (columnActivities.length > 0) {
                    console.log(`🎯 [KANBAN] Atividades na coluna ${column.name}:`, columnActivities.map(a => ({
                      id: a.id,
                      title: a.title,
                      status: a.status
                    })));
                  } else {
                    console.log(`⚠️ [KANBAN] Nenhuma atividade encontrada para coluna ${column.name} (${column.status})`);
                    console.log(`🔍 [KANBAN] Atividades disponíveis:`, activities.map(a => ({
                      id: a.id,
                      title: a.title,
                      status: a.status
                    })));
                  }

                  const getColumnStyles = (column: any) => {
                    // Todos os blocos com fundo branco e borda consistente
                    if (column.status === 'pending') {
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-gray-500' };
                    } else if (column.status === 'in_progress') {
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-orange-500' };
                    } else if (column.status === 'completed') {
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-green-500' };
                    } else if (column.status === 'archived') {
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-gray-400' };
                    } else {
                      // Para colunas customizadas, usar fundo branco e borda consistente
                      return { bg: 'bg-white', border: 'border-gray-200', line: 'bg-gray-500' };
                    }
                  };

                  const columnStyle = getColumnStyles(column);

                  return (
                    <div key={column.id} className="w-full flex flex-col">
                      <div className={`${columnStyle.bg} ${columnStyle.border} border rounded-lg p-3 flex flex-col ${
                        columnActivities.length === 0 
                          ? 'min-h-[200px]' 
                          : 'min-h-[150px]'
                      }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                              {column.name}
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {columnActivities.length}
                        </span>
                      </div>
                    </div>
                    
                    {/* Linha colorida discreta abaixo do título */}
                        <div className={`w-full h-0.5 ${columnStyle.line} rounded mb-4`}></div>

                    <div className="space-y-3 flex-1">
                          {columnActivities.length > 0 ? (
                            columnActivities.map(activity => {
                              console.log(`🎨 [KANBAN] Renderizando card para atividade:`, {
                                id: activity.id,
                                title: activity.title,
                                status: activity.status,
                                column: column.name
                              });
                              return (
                          <div key={activity.id} className="group relative bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                            {/* Botões de ação - aparecem apenas no hover */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditActivity(activity);
                                }}
                                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                                title="Editar tarefa"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteActivity(activity.id);
                                }}
                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                title="Excluir tarefa"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="mb-2 pr-8">
                              <h4 className="text-xs font-normal text-gray-900 mb-1">
                                {activity.title}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {activity.description || 'Sem descrição'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                activity.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                activity.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                activity.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {activity.priority === 'urgent' ? 'Urgente' :
                                 activity.priority === 'high' ? 'Alta' :
                                 activity.priority === 'medium' ? 'Média' : 'Baixa'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {activity.due_date ? new Date(activity.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                            </div>
                          </div>
                        );
                            })
                          ) : (
                            <div className="text-center py-4 text-gray-500 text-sm flex items-center justify-center flex-1">
                              Nenhuma atividade
                            </div>
                          )}
                    </div>

                    {/* Botão para criar nova tarefa */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
                      onClick={handleOpenCreateModal}
                    >
                      + NOVA TAREFA
                    </Button>
                  </div>
                </div>
                  );
                })}
                        </div>
                      )}
            </section>

            {/* Acompanhamento de Sprints */}
            <section className="sprints-section mt-12 mb-8">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900/90">Acompanhamento de Sprints</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {getSprintData().filter(s => s.status === 'completed').length} de {getSprintData().length} sprints finalizados • 
                      Sprint ativa: {getSprintData().find(s => s.status === 'in_progress')?.name || 'Nenhuma'} 
                      ({getSprintData().find(s => s.status === 'in_progress')?.completed || 0}/{getSprintData().find(s => s.status === 'in_progress')?.total || 0} concluídas)
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleToggleSprintsMinimized}
                      className="flex items-center text-xs px-2 py-1 h-6"
                    >
                      {sprintsMinimized ? (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                          Maximizar Visualização
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                          Minimizar Visualização
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {sprintsMinimized ? (
                  // Visualização minimizada - apenas nomes e informações básicas
                  <div className="space-y-2">
                    {getSprintData().map((sprint) => (
                      <div 
                        key={sprint.id} 
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900 text-sm">{sprint.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              sprint.status === 'completed' ? 'bg-green-100 text-green-800' :
                              sprint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sprint.status === 'completed' ? 'Finalizada' :
                             sprint.status === 'in_progress' ? 'Em Andamento' : 'Planejada'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>{sprint.completed}/{sprint.total}</span>
                          <span>{Math.round(sprint.progress)}%</span>
                          <span>{sprint.startDate} - {sprint.endDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Visualização completa - como estava antes
                <div className={`grid gap-4 ${sprintsViewMode === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
                  {getSprintData().map((sprint) => (
                    <div 
                      key={sprint.id} 
                      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                        expandedSprint === sprint.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{sprint.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{sprint.completed}/{sprint.total}</span>
                          <button
                            onClick={() => handleToggleSprintExpansion(sprint.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <ChevronDown 
                              className={`w-4 h-4 text-gray-500 transition-transform ${
                                expandedSprint === sprint.id ? 'rotate-180' : ''
                              }`} 
                            />
                          </button>
                    </div>
                  </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            sprint.status === 'completed' ? 'bg-green-500' :
                            sprint.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(sprint.progress, 100)}%` }}
                        ></div>
                    </div>
                      
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                        <Clock className="w-3 h-3 mr-1" />
                        {sprint.startDate} - {sprint.endDate}
                    </div>
                      
                    <div className="flex items-center justify-between">
                        <Badge 
                          variant="secondary" 
                          className={`${
                            sprint.status === 'completed' ? 'bg-green-100 text-green-800' :
                            sprint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {sprint.status === 'completed' ? 'Finalizada' :
                           sprint.status === 'in_progress' ? 'Em Andamento' : 'Planejada'}
                        </Badge>
                        
                        {sprint.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => handleFinishSprint(sprint.id)}
                          >
                            Finalizar Sprint
                          </Button>
                        )}
                        
                        {sprint.status === 'planned' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => handleStartSprint(sprint.id)}
                          >
                            Iniciar Sprint
                          </Button>
                        )}
                  </div>

                      {/* Detalhes expandidos */}
                      {expandedSprint === sprint.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Progresso:</span>
                              <span className="font-medium">{Math.round(sprint.progress)}%</span>
                    </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tarefas Concluídas:</span>
                              <span className="font-medium">{sprint.completed}</span>
                    </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total de Tarefas:</span>
                              <span className="font-medium">{sprint.total}</span>
                    </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Restantes:</span>
                              <span className="font-medium">{sprint.total - sprint.completed}</span>
                    </div>
                  </div>
                    </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
            </section>

            
          </div>
        )}

        {viewMode === 'calendario' && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Visualização Calendário</h3>
            <p className="text-gray-600">Implementar visualização calendário</p>
          </div>
        )}

        {viewMode === 'dashboard' && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Visualização Dashboard</h3>
            <p className="text-gray-600">Implementar visualização dashboard</p>
          </div>
        )}
      </div>

      {/* Botão flutuante de nova atividade com posição exata da referência */}
      <Button
        onClick={handleOpenCreateModal}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
        style={{
          backgroundColor: '#021529',
          borderColor: '#021529'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#001122';
          e.currentTarget.style.borderColor = '#001122';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#021529';
          e.currentTarget.style.borderColor = '#021529';
        }}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* Modal de edição do Kanban */}
      {isKanbanEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseKanbanEditModal}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Kanban className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Personalizar Planejamento Kanban</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure as etapas do seu fluxo de trabalho
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseKanbanEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Instruções */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Como personalizar</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Edite os nomes das etapas, escolha cores e reorganize a ordem. Você pode adicionar novas etapas ou remover as existentes.
                      </p>
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        💾 Suas configurações são salvas automaticamente e persistem entre sessões
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de Colunas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-900">Etapas do Fluxo</h3>
                    <Button
                      onClick={handleAddKanbanColumn}
                      size="sm"
                      className="flex items-center gap-2 text-white hover:opacity-90"
                      style={{ backgroundColor: '#4A5477' }}
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {kanbanColumns.map((column, index) => (
                      <div key={column.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          {/* Drag Handle */}
                          <div className="p-1 text-gray-400 cursor-move">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          {/* Color Picker */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Cor:</span>
                            <div className="flex gap-1">
                              {['gray', 'blue', 'green', 'orange', 'red', 'purple'].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateKanbanColumn(column.id, { color })}
                                  className={`w-6 h-6 rounded-full border-2 ${
                                    column.color === color ? 'border-gray-400' : 'border-gray-200'
                                  } ${
                                    color === 'gray' ? 'bg-gray-500' :
                                    color === 'blue' ? 'bg-blue-500' :
                                    color === 'green' ? 'bg-green-500' :
                                    color === 'orange' ? 'bg-orange-500' :
                                    color === 'red' ? 'bg-red-500' :
                                    'bg-purple-500'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Nome da Coluna */}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={column.name}
                              onChange={(e) => handleUpdateKanbanColumn(column.id, { name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nome da etapa"
                            />
                          </div>

                          {/* Status */}
                          <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            {activities.filter(activity => {
                              if (column.status === 'pending') return activity.status === 'pending' || activity.status === 'open';
                              if (column.status === 'in_progress') return activity.status === 'in_progress';
                              if (column.status === 'completed') return activity.status === 'completed';
                              if (column.status === 'archived') return activity.status === 'archived' || activity.status === 'cancelled';
                              return activity.status === column.status;
                            }).length} atividades
                          </div>

                          {/* Remove Button */}
                          {kanbanColumns.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveKanbanColumn(column.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-gray-900">Preview</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex gap-2">
                      {kanbanColumns.map((column) => {
                        const columnStyle = {
                          gray: 'bg-gray-200 border-gray-300',
                          blue: 'bg-blue-200 border-blue-300',
                          green: 'bg-green-200 border-green-300',
                          orange: 'bg-orange-200 border-orange-300',
                          red: 'bg-red-200 border-red-300',
                          purple: 'bg-purple-200 border-purple-300'
                        }[column.color] || 'bg-gray-200 border-gray-300';

                        return (
                          <div key={column.id} className={`flex-1 p-3 rounded border ${columnStyle}`}>
                            <div className="text-xs font-medium text-gray-700 mb-2">{column.name}</div>
                            <div className="text-xs text-gray-500">0 atividades</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Configurações salvas automaticamente
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCloseKanbanEditModal}
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: '#4A5477' }}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação de atividade */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Criar Nova Atividade</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Preencha os dados para criar uma nova atividade
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-6 py-4">
            <BitrixActivityForm
              onSubmit={handleCreateActivity}
              companies={companies}
              employees={employees}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de atividade */}
      {isEditModalOpen && editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingActivity(null);
            }}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Editar Atividade</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Edite os dados da atividade selecionada
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingActivity(null);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-6 py-4">
                <BitrixActivityForm
                  onSubmit={handleUpdateActivity}
                  companies={companies}
                  employees={employees}
                  onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingActivity(null);
                  }}
                  initialData={{
                    title: editingActivity.title,
                    description: editingActivity.description || '',
                    date: editingActivity.due_date ? new Date(editingActivity.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    priority: editingActivity.priority,
                    status: editingActivity.status,
                    responsibleId: editingActivity.responsible_id || '',
                    companyId: editingActivity.company_id || '',
                    projectId: editingActivity.project_id || '',
                    workGroup: editingActivity.work_group || '',
                    department: editingActivity.department || '',
                    type: editingActivity.type
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Automações */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAutomationModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Automatize</h2>
                <button
                  onClick={() => setIsAutomationModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 py-6">
              <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <span className="text-gray-500 text-sm">Espaço para futuras automações</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Activities;
