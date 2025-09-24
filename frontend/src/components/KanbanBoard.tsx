'use client';

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Activity } from '@/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Calendar, MessageCircle, Paperclip, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
}

interface KanbanBoardProps {
  activities: Activity[];
  onMoveActivity: (activityId: string, newColumn: string, newPosition: number) => Promise<{ data: any; error: string | null }>;
  onReindexColumn: (column: string) => Promise<{ data: any; error: string | null }>;
  onAddActivity?: (columnId: string) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => void;
  className?: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'todo', title: 'PENDENTE', color: '#6B7280' },
  { id: 'doing', title: 'EM PROGRESSO', color: '#F97316' },
  { id: 'done', title: 'CONCLUÍDA', color: '#22C55E' }
];

const ActivityCard: React.FC<{
  activity: Activity;
  index: number;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activityId: string) => void;
}> = ({ activity, index, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className="group bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status bar no topo */}
      <div className={`h-1 w-full rounded-t-lg`} style={{ 
        backgroundColor: activity.status === 'todo' || activity.status === 'pending' || activity.status === 'open' ? '#6B7280' :
        activity.status === 'doing' || activity.status === 'in_progress' ? '#F97316' :
        activity.status === 'done' || activity.status === 'completed' ? '#22C55E' : '#6B7280'
      }} />
      
      <div className="p-3 pb-2">
        {/* Header com título e ações */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 leading-tight flex-1">
            {activity.title}
          </h4>
          
          {/* Ações visíveis no hover */}
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(activity);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreHorizontal size={14} />
              </button>
            )}
            <div className="text-gray-400 cursor-move">
              <GripVertical size={14} />
                </div>
                </div>
              </div>

        {/* Descrição se existir */}
        {activity.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Tags se existirem */}
        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {activity.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {activity.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{activity.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer com metadados */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-gray-400">
            {/* Data de vencimento */}
            {activity.due_date && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span className="text-xs">
                  {formatDate(activity.due_date)}
                </span>
              </div>
            )}

            {/* Comentários */}
            {activity.comments && activity.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle size={12} />
                <span className="text-xs">{activity.comments}</span>
              </div>
            )}

            {/* Anexos */}
            {activity.attachments && activity.attachments > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip size={12} />
                <span className="text-xs">{activity.attachments}</span>
                        </div>
            )}
                      </div>

          {/* Indicador de prioridade */}
          <div className="flex items-center gap-1">
            {activity.priority && activity.priority !== 'low' && (
              <div 
                className={`w-2 h-2 rounded-full ${getPriorityColor(activity.priority)}`}
                title={`Prioridade: ${activity.priority}`}
              />
            )}
          </div>
        </div>
      </div>
                      </div>
  );
};

const KanbanColumn: React.FC<{
  column: KanbanColumn;
  activities: Activity[];
  onAddActivity?: (columnId: string) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => void;
}> = ({ column, activities, onAddActivity, onEditActivity, onDeleteActivity }) => {
  return (
    <div className="flex-shrink-0" style={{ width: '280px' }}>
      {/* Header da coluna */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            {column.title}
          </h3>
          <span 
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: column.color + '20',
              color: column.color
            }}
          >
            {activities.length}
          </span>
                      </div>
                    </div>

      {/* Lista de tarefas */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
            }`}
          >
            {activities.map((activity, index) => (
              <Draggable
                key={activity.id}
                draggableId={activity.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${snapshot.isDragging ? 'opacity-50 scale-95 shadow-xl' : ''}`}
                  >
                    <ActivityCard
                      activity={activity}
                      index={index}
                      onEdit={onEditActivity}
                      onDelete={onDeleteActivity}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Botão adicionar tarefa */}
            {onAddActivity && (
              <Button 
                variant="ghost"
                className="w-full h-10 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg"
                onClick={() => onAddActivity(column.id)}
              >
                <Plus size={16} className="mr-2" />
                Adicionar Tarefa
              </Button>
            )}

            {/* Estado vazio */}
            {activities.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-sm">Nenhuma tarefa</div>
            </div>
            )}
      </div>
        )}
      </Droppable>
    </div>
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  activities,
  onMoveActivity,
  onReindexColumn,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  className
}) => {
  // Agrupar atividades por coluna baseado no status
  const groupedActivities = React.useMemo(() => {
    const grouped: Record<string, Activity[]> = {};
    
    KANBAN_COLUMNS.forEach(column => {
      grouped[column.id] = activities
        .filter(activity => {
          // Mapear status para colunas
          if (column.id === 'todo') {
            return activity.status === 'todo' || activity.status === 'pending' || activity.status === 'open';
          } else if (column.id === 'doing') {
            return activity.status === 'doing' || activity.status === 'in_progress';
          } else if (column.id === 'done') {
            return activity.status === 'done' || activity.status === 'completed';
          }
          return false;
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    
    return grouped;
  }, [activities]);

  // Função simplificada para drag and drop
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Se não há destino, cancelar
    if (!destination) {
      return;
    }
    
    const sourceColumn = source.droppableId;
    const destinationColumn = destination.droppableId;
    
    // Se não mudou de coluna, cancelar
    if (sourceColumn === destinationColumn) {
      return;
    }
    
    try {
      // Mover atividade para nova coluna
      const result = await onMoveActivity(draggableId, destinationColumn, 0);
      
      if (result.error) {
        console.error('Erro ao mover atividade:', result.error);
        // Não fazer nada aqui, o erro já foi tratado no componente pai
      }
    } catch (error) {
      console.error('Erro inesperado ao mover atividade:', error);
      // Não fazer nada aqui, o erro já foi tratado no componente pai
    }
  }, [onMoveActivity]);


  return (
    <div className={cn("w-full h-full", className)}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              activities={groupedActivities[column.id] || []}
              onAddActivity={onAddActivity}
              onEditActivity={onEditActivity}
              onDeleteActivity={onDeleteActivity}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;