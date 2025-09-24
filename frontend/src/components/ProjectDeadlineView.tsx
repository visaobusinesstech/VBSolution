import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Archive, Clock, AlertTriangle, Calendar, User, Edit, Eye, Plus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  responsible_id?: string;
  company_id?: string;
  due_date?: string;
  tags?: string[];
  archived: boolean;
  priority?: string;
}

interface ProjectDeadlineViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onCompleteProject: (projectId: string) => void;
  onArchiveProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onOpenCreateModal: () => void;
  searchTerm: string;
  selectedResponsibles: string[];
  selectedWorkGroup: string;
  selectedDepartment: string;
}

const ProjectDeadlineView: React.FC<ProjectDeadlineViewProps> = ({
  projects,
  onProjectClick,
  onCompleteProject,
  onArchiveProject,
  onEditProject,
  onOpenCreateModal,
  searchTerm,
  selectedResponsibles,
  selectedWorkGroup,
  selectedDepartment
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_hold': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (due_date?: string) => {
    if (!due_date) return 'text-gray-500';
    
    const today = new Date();
    const due = new Date(due_date);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600'; // Atrasado
    if (diffDays <= 3) return 'text-orange-600'; // Crítico
    if (diffDays <= 7) return 'text-yellow-600'; // Atenção
    return 'text-green-600'; // OK
  };

  const getPriorityIcon = (due_date?: string) => {
    if (!due_date) return <Clock className="h-4 w-4" />;
    
    const today = new Date();
    const due = new Date(due_date);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <AlertTriangle className="h-4 w-4" />; // Atrasado
    if (diffDays <= 3) return <AlertTriangle className="h-4 w-4" />; // Crítico
    if (diffDays <= 7) return <Clock className="h-4 w-4" />; // Atenção
    return <Clock className="h-4 w-4" />; // OK
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesResponsible = selectedResponsibles.length === 0 || 
      selectedResponsibles.includes(project.responsible_id || '');
    
    return matchesSearch && matchesResponsible;
  });

  // Ordenar por prazo
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return 1;
    
    const dateA = new Date(a.due_date);
    const dateB = new Date(b.due_date);
    return dateA.getTime() - dateB.getTime();
  });

  const getProjectsByDeadline = (deadlineType: 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'future') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return sortedProjects.filter(project => {
      if (!project.due_date) return false;
      
      const dueDate = new Date(project.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      switch (deadlineType) {
        case 'overdue':
          return dueDate < today;
        case 'today':
          return dueDate.toDateString() === today.toDateString();
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return dueDate.toDateString() === tomorrow.toDateString();
        case 'thisWeek':
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + 7);
          return dueDate > today && dueDate <= endOfWeek;
        case 'future':
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          return dueDate > nextWeek;
        default:
          return false;
      }
    });
  };

  const renderKanbanView = () => (
    <div className="grid grid-cols-5 gap-4 w-full overflow-hidden pb-6 items-start">
      {/* Coluna VENCIDOS */}
      <div className="w-full flex flex-col">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                VENCIDOS
              </h3>
              <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                {getProjectsByDeadline('overdue').length}
              </span>
            </div>
          </div>
          
          <div className="w-full h-0.5 bg-red-500 rounded mb-4"></div>

          <div className="space-y-3 flex-1">
            {getProjectsByDeadline('overdue').map(project => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="mb-2">
                  <h4 className="text-xs font-normal text-gray-900 mb-1">
                    {project.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {project.description || 'Sem descrição'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    project.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    project.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    project.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {project.priority === 'urgent' ? 'Urgente' :
                     project.priority === 'high' ? 'Alta' :
                     project.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>

                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                </div>
              </div>
            ))}
            
            {getProjectsByDeadline('overdue').length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum projeto vencido
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
            onClick={onOpenCreateModal}
          >
            + NOVO PROJETO
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
                {getProjectsByDeadline('today').length}
              </span>
            </div>
          </div>
          
          <div className="w-full h-0.5 bg-yellow-500 rounded mb-4"></div>

          <div className="space-y-3 flex-1">
            {getProjectsByDeadline('today').map(project => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="mb-2">
                  <h4 className="text-xs font-normal text-gray-900 mb-1">
                    {project.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {project.description || 'Sem descrição'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    project.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    project.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    project.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {project.priority === 'urgent' ? 'Urgente' :
                     project.priority === 'high' ? 'Alta' :
                     project.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </div>
              </div>
            ))}
            
            {getProjectsByDeadline('today').length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum projeto para hoje
              </div>
                  )}
                </div>
                
          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
            onClick={onOpenCreateModal}
          >
            + NOVO PROJETO
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
                {getProjectsByDeadline('tomorrow').length}
              </span>
            </div>
          </div>
          
          <div className="w-full h-0.5 bg-blue-500 rounded mb-4"></div>

          <div className="space-y-3 flex-1">
            {getProjectsByDeadline('tomorrow').map(project => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="mb-2">
                  <h4 className="text-xs font-normal text-gray-900 mb-1">
                    {project.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {project.description || 'Sem descrição'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    project.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    project.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    project.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {project.priority === 'urgent' ? 'Urgente' :
                     project.priority === 'high' ? 'Alta' :
                     project.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </div>
              </div>
            ))}
            
            {getProjectsByDeadline('tomorrow').length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum projeto para amanhã
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
            onClick={onOpenCreateModal}
          >
            + NOVO PROJETO
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
                {getProjectsByDeadline('thisWeek').length}
                    </span>
                  </div>
                </div>
                
          <div className="w-full h-0.5 bg-green-500 rounded mb-4"></div>

          <div className="space-y-3 flex-1">
            {getProjectsByDeadline('thisWeek').map(project => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="mb-2">
                  <h4 className="text-xs font-normal text-gray-900 mb-1">
                    {project.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {project.description || 'Sem descrição'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    project.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    project.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    project.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {project.priority === 'urgent' ? 'Urgente' :
                     project.priority === 'high' ? 'Alta' :
                     project.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </div>
              </div>
            ))}
            
            {getProjectsByDeadline('thisWeek').length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum projeto esta semana
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
            onClick={onOpenCreateModal}
          >
            + NOVO PROJETO
          </Button>
        </div>
      </div>

      {/* Coluna FUTUROS */}
      <div className="w-full flex flex-col">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                FUTUROS
              </h3>
              <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                {getProjectsByDeadline('future').length}
              </span>
                </div>
              </div>
              
          <div className="w-full h-0.5 bg-purple-500 rounded mb-4"></div>

          <div className="space-y-3 flex-1">
            {getProjectsByDeadline('future').map(project => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-2 px-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="mb-2">
                  <h4 className="text-xs font-normal text-gray-900 mb-1">
                    {project.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {project.description || 'Sem descrição'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    project.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    project.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    project.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {project.priority === 'urgent' ? 'Urgente' :
                     project.priority === 'high' ? 'Alta' :
                     project.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </div>
              </div>
            ))}
            
            {getProjectsByDeadline('future').length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum projeto futuro
              </div>
            )}
          </div>

                      <Button
            variant="outline" 
                        size="sm"
            className="w-full mt-3 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 bg-white text-xs py-1 mt-auto"
            onClick={onOpenCreateModal}
          >
            + NOVO PROJETO
                      </Button>
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Cabeçalho da Lista */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 uppercase tracking-wider">
          <div className="col-span-4">Projeto</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Prazo</div>
          <div className="col-span-2">Responsável</div>
          <div className="col-span-2">Ações</div>
        </div>
      </div>

      {/* Lista de Projetos */}
      <div className="divide-y divide-gray-200">
        {sortedProjects
          .filter(project => project.due_date) // Filtra apenas projetos com prazo
          .map(project => {
            const dueDate = new Date(project.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = dueDate < today;
            
            return (
              <div key={project.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Projeto */}
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </h4>
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {project.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                                      <Badge className={getStatusColor(project.status)}>
                    {project.status === 'active' ? 'Ativo' :
                     project.status === 'completed' ? 'Concluído' :
                     project.status === 'planning' ? 'Planejamento' :
                     project.status === 'on_hold' ? 'Pausado' :
                     project.status === 'cancelled' ? 'Cancelado' :
                     project.status}
                  </Badge>
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
                          Vencido
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {project.responsible_id || 'Não atribuído'}
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
                        onClick={() => onEditProject(project)}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                    </Button>
                  <Button
                        variant="ghost"
                    size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-200"
                        onClick={() => onProjectClick(project)}
                  >
                        <Eye className="h-4 w-4 text-gray-600" />
                  </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        
        {sortedProjects.filter(project => project.due_date).length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
            <p className="text-gray-600">Não há projetos com prazo definido no momento.</p>
          </div>
                )}
              </div>
            </div>
  );

  return (
    <div className="space-y-4">
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
            variant="outline"
            size="sm"
            className={`h-7 px-2.5 text-xs font-medium ${
              viewMode === 'lista' 
                ? 'border-blue-800 text-black bg-transparent hover:bg-blue-50' 
                : 'border-gray-300 text-black bg-transparent hover:bg-gray-50'
            }`}
            onClick={() => setViewMode('lista')}
          >
            Lista
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`h-7 px-2.5 text-xs font-medium ${
              viewMode === 'kanban' 
                ? 'border-blue-800 text-black bg-transparent hover:bg-blue-50' 
                : 'border-gray-300 text-black bg-transparent hover:bg-gray-50'
            }`}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
        </div>
      </div>

      {/* Conteúdo baseado no modo de visualização selecionado */}
      {viewMode === 'kanban' ? renderKanbanView() : renderListView()}
    </div>
  );
};

export default ProjectDeadlineView;
