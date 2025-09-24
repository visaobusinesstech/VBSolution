import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkGroup } from '@/contexts/WorkGroupContext';
import { useVB } from '@/contexts/VBContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { toast } from '@/hooks/use-toast';
import { useFilters } from '@/hooks/useFilters';
import FilterBar from '@/components/FilterBar';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkGroupCreateModal from '@/components/WorkGroupCreateModal';
import WorkGroupDetailModal from '@/components/WorkGroupDetailModal';

import { 
  Search,
  Plus,
  Users,
  List,
  Target,
  User,
  BarChart3,
  Kanban,
  Clock,
  Zap,
  Edit,
  Trash2,
  AlignJustify,
  MoreHorizontal,
  Building2,
  ArrowUpDown,
  Eye,
  Share,
  ChevronDown
} from 'lucide-react';

const WorkGroups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useVB();
  const { companies, employees } = state;
  const { workGroups, addWorkGroup, updateWorkGroup, deleteWorkGroup } = useWorkGroup();
  const { topBarColor } = useTheme();
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  
  // Estados para controle da interface
  const [viewMode, setViewMode] = useState<'board' | 'lista' | 'dashboard'>('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  
  // Estados para filtros
  const {
    filters,
    updateFilter,
    clearFilters,
    applyFilters
  } = useFilters({
    search: '',
    sector: '',
    status: '',
    member: '',
    dateRange: null
  });

  // Detectar estado do sidebar
  useEffect(() => {
    const handleSidebarChange = () => {
      const sidebar = document.querySelector('[data-expanded]');
      if (sidebar) {
        setIsSidebarExpanded(sidebar.getAttribute('data-expanded') === 'true');
      }
    };

    // Observer para mudanças no sidebar
    const observer = new MutationObserver(handleSidebarChange);
    const sidebarElement = document.querySelector('.fixed.left-0.top-\\[38px\\]');
    
    if (sidebarElement) {
      observer.observe(sidebarElement, { attributes: true, attributeFilter: ['class'] });
      // Check inicial
      setIsSidebarExpanded(sidebarElement.classList.contains('w-\\[240px\\]') || !sidebarElement.classList.contains('w-\\[64px\\]'));
    }

    return () => observer.disconnect();
  }, []);

  // Funções de controle
  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleCreateWorkGroup = (workGroupData: any) => {
    const newWorkGroup = {
      name: workGroupData.name,
      description: workGroupData.description,
      color: workGroupData.color,
      photo: workGroupData.photo,
      sector: workGroupData.department || "Não definido",
      members: workGroupData.collaborators.map((name: string) => ({
        id: Date.now().toString() + Math.random(),
        name,
        initials: name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2),
        email: `${name.toLowerCase().replace(' ', '.')}@exemplo.com`,
        position: "Membro"
      })),
      tasksCount: Math.floor(Math.random() * 20) + 1,
      completedTasks: Math.floor(Math.random() * 10),
      activeProjects: Math.floor(Math.random() * 5) + 1,
      status: 'active'
    };

    addWorkGroup(newWorkGroup);
    toast({
      title: "Grupo criado",
      description: `Grupo "${workGroupData.name}" foi criado com sucesso`
    });
  };

  const handleWorkGroupClick = (workGroup: any) => {
    setSelectedWorkGroup(workGroup);
    setIsDetailModalOpen(true);
  };

  const handleDeleteWorkGroup = (workGroupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo de trabalho?')) return;
    
    deleteWorkGroup(workGroupId);
    toast({
      title: "Grupo excluído",
      description: "Grupo foi excluído com sucesso"
    });
  };

  const handleUpdateWorkGroup = (workGroupId: string, updates: any) => {
    updateWorkGroup(workGroupId, updates);
    toast({
      title: "Grupo atualizado",
      description: "Grupo foi atualizado com sucesso"
    });
  };

  const handleFilterApply = () => {
    // Aplicar filtros
    applyFilters();
    toast({
      title: "Filtros aplicados",
      description: "Os filtros foram aplicados com sucesso"
    });
  };

  const handleViewModeChange = (mode: 'board' | 'lista' | 'grid' | 'dashboard' | 'calendario') => {
    setViewMode(mode);
  };

  // Filtrar grupos de trabalho baseado nos filtros ativos
  const filteredWorkGroups = workGroups.filter(workGroup => {
    if (filters.search && !workGroup.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !workGroup.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.sector && workGroup.sector !== filters.sector) {
      return false;
    }
    if (filters.status && workGroup.status !== filters.status) {
      return false;
    }
    if (filters.member && !workGroup.members.some((member: any) => 
        member.name.toLowerCase().includes(filters.member.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // Botões de visualização
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
      id: 'dashboard', 
      label: 'Dashboard',
      icon: BarChart3,
      active: viewMode === 'dashboard'
    }
  ];

  // Renderizar card de grupo de trabalho
  const renderWorkGroupCard = (workGroup: any, isCompact = false) => (
    <Card 
      key={workGroup.id} 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
      onClick={() => handleWorkGroupClick(workGroup)}
    >
      {/* Botões de ação */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedWorkGroup(workGroup);
            setIsDetailModalOpen(true);
          }}
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
          title="Editar grupo"
        >
          <Edit className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteWorkGroup(workGroup.id);
          }}
          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
          title="Excluir grupo"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <CardHeader className={isCompact ? "pb-2" : "pb-3"}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
              className={`${isCompact ? 'w-8 h-8 text-sm' : 'w-12 h-12'} rounded-lg flex items-center justify-center text-white font-bold`}
                      style={{ backgroundColor: workGroup.color }}
                    >
                      {workGroup.photo ? (
                <Avatar className={isCompact ? "w-8 h-8" : "w-12 h-12"}>
                          <AvatarImage src={workGroup.photo} />
                          <AvatarFallback>{workGroup.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        workGroup.name.charAt(0)
                      )}
                    </div>
                    <div>
              <CardTitle className={isCompact ? "text-sm" : "text-lg"}>{workGroup.name}</CardTitle>
              <CardDescription className={isCompact ? "text-xs" : "text-sm"}>{workGroup.sector}</CardDescription>
                    </div>
                  </div>
          <Badge 
            variant={workGroup.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {workGroup.status === 'active' ? 'Ativo' : 'Inativo'}
          </Badge>
                </div>
              </CardHeader>
              
      <CardContent className={isCompact ? "pt-0 pb-3" : ""}>
        {!isCompact && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{workGroup.description}</p>
        )}
                
                {/* Members */}
        <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{workGroup.members?.length || 0} membros</span>
                </div>
                
                {/* Progress */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium">{workGroup.completedTasks || 0}/{workGroup.tasksCount || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: workGroup.color,
                width: `${getProgressPercentage(workGroup.completedTasks || 0, workGroup.tasksCount || 0)}%`
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{workGroup.activeProjects || 0} projetos</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
            {getProgressPercentage(workGroup.completedTasks || 0, workGroup.tasksCount || 0)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando grupos de trabalho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação e filtros */}
      <div className="bg-white -mt-6 -mx-6">
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
          departments={state.settings?.departments || []}
          searchPlaceholder="Filtrar por nome do grupo..."
          customFilters={[
            {
              key: 'sector',
              label: 'Setor',
              type: 'select',
              options: [...new Set(workGroups.map(wg => wg.sector))].map(sector => ({
                value: sector,
                label: sector
              }))
            },
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { value: 'active', label: 'Ativo' },
                { value: 'inactive', label: 'Inativo' }
              ]
            }
          ]}
        />
      </div>

      {/* Container principal com altura total */}
      <div className={`pt-2 h-full ${isSidebarExpanded ? 'px-1' : 'px-2'}`}
           style={{height: 'calc(100vh - 72px)'}}>

        {/* Conteúdo baseado na visualização selecionada */}
        {viewMode === 'board' && (
          <div className="w-full p-6">
            {/* Quadro Kanban de grupos por status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Grupos Ativos */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Grupos Ativos ({filteredWorkGroups.filter(wg => wg.status === 'active').length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredWorkGroups.filter(wg => wg.status === 'active').map(workGroup => 
                    renderWorkGroupCard(workGroup, true)
                  )}
                </div>
              </div>

              {/* Grupos em Planejamento */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Em Planejamento ({filteredWorkGroups.filter(wg => wg.status === 'planning').length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredWorkGroups.filter(wg => wg.status === 'planning').map(workGroup => 
                    renderWorkGroupCard(workGroup, true)
                  )}
                </div>
              </div>

              {/* Grupos Inativos */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    Inativos ({filteredWorkGroups.filter(wg => wg.status === 'inactive').length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {filteredWorkGroups.filter(wg => wg.status === 'inactive').map(workGroup => 
                    renderWorkGroupCard(workGroup, true)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {viewMode === 'lista' && (
          <div className="p-6 space-y-4">
            {filteredWorkGroups.map((workGroup) => (
            <Card 
              key={workGroup.id} 
                className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleWorkGroupClick(workGroup)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: workGroup.color }}
                    >
                      {workGroup.photo ? (
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={workGroup.photo} />
                          <AvatarFallback>{workGroup.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ) : (
                        workGroup.name.charAt(0)
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold">{workGroup.name}</h3>
                        <p className="text-gray-600 mb-2">{workGroup.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{workGroup.sector}</span>
                        <span>•</span>
                          <span>{workGroup.members?.length || 0} membros</span>
                        <span>•</span>
                          <span>{workGroup.activeProjects || 0} projetos ativos</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                        {getProgressPercentage(workGroup.completedTasks || 0, workGroup.tasksCount || 0)}%
                    </div>
                    <div className="text-sm text-gray-600">
                        {workGroup.completedTasks || 0}/{workGroup.tasksCount || 0} tarefas
                      </div>
                      <Badge 
                        variant={workGroup.status === 'active' ? 'default' : 'secondary'}
                        className="mt-2"
                      >
                        {workGroup.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {/* Botões de ação para lista */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkGroup(workGroup);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorkGroup(workGroup.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        {viewMode === 'dashboard' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Card de estatísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Grupos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{workGroups.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Grupos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {workGroups.filter(wg => wg.status === 'active').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">Total de Membros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {workGroups.reduce((total, wg) => total + (wg.members?.length || 0), 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de grupos com métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkGroups.map(workGroup => renderWorkGroupCard(workGroup))}
            </div>
          </div>
        )}


      {/* Empty State */}
        {filteredWorkGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {workGroups.length === 0 ? 'Nenhum grupo de trabalho' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-600 mb-6">
              {workGroups.length === 0 
                ? 'Comece criando seu primeiro grupo de trabalho para organizar sua equipe.'
                : 'Tente ajustar os filtros para encontrar os grupos que procura.'
              }
            </p>
        </div>
      )}
      </div>

      {/* Botão flutuante para criar novo grupo */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
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
        title="Criar novo grupo"
      >
        <Plus className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-200" />
      </button>

      {/* Modals */}
      <WorkGroupCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateWorkGroup}
      />
      
      <WorkGroupDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        workGroup={selectedWorkGroup}
        onDelete={handleDeleteWorkGroup}
        onUpdate={handleUpdateWorkGroup}
      />
    </div>
  );
};

export default WorkGroups;