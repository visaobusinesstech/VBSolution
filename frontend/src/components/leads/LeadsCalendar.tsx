import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Video,
  Phone,
  FileText,
  AlertCircle
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  product?: string;
  negotiated_price: number;
  expected_close_date?: string;
  pipeline_stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'won' | 'lost';
  assigned_to?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  type: 'meeting' | 'call' | 'demo' | 'proposal' | 'follow_up' | 'deadline' | 'other';
  lead_id?: string;
  lead?: Lead;
  location?: string;
  attendees?: string[];
  is_all_day?: boolean;
  reminder_minutes?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
}

interface LeadsCalendarProps {
  leads: Lead[];
  onLeadUpdate: (leads: Lead[]) => void;
}

type ViewMode = 'month' | 'week' | 'day';

const LeadsCalendar: React.FC<LeadsCalendarProps> = ({ leads, onLeadUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  // Gerar eventos baseados nos leads
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    leads.forEach(lead => {
      if (lead.expected_close_date) {
        calendarEvents.push({
          id: `deadline-${lead.id}`,
          title: `Prazo: ${lead.name}`,
          description: `Prazo para fechamento - ${lead.company}`,
          start: new Date(lead.expected_close_date),
          type: 'deadline',
          lead_id: lead.id,
          lead,
          status: 'scheduled'
        });
      }

      // Adicionar eventos de demo se estiver no estágio demo_scheduled
      if (lead.pipeline_stage === 'demo_scheduled') {
        calendarEvents.push({
          id: `demo-${lead.id}`,
          title: `Demo: ${lead.name}`,
          description: `Demonstração do produto para ${lead.company}`,
          start: new Date(lead.expected_close_date || lead.created_at),
          end: new Date(new Date(lead.expected_close_date || lead.created_at).getTime() + 60 * 60 * 1000), // 1 hora
          type: 'demo',
          lead_id: lead.id,
          lead,
          location: 'Online',
          status: 'scheduled'
        });
      }

      // Adicionar follow-up se necessário
      if (lead.pipeline_stage === 'contact_made' && lead.created_at) {
        const followUpDate = new Date(lead.created_at);
        followUpDate.setDate(followUpDate.getDate() + 7); // Follow-up em 7 dias
        
        calendarEvents.push({
          id: `followup-${lead.id}`,
          title: `Follow-up: ${lead.name}`,
          description: `Ligar para ${lead.company}`,
          start: followUpDate,
          type: 'follow_up',
          lead_id: lead.id,
          lead,
          status: 'scheduled'
        });
      }
    });

    return calendarEvents;
  }, [leads]);

  // Função para obter cor do evento baseado no tipo
  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'call': return 'bg-green-100 text-green-800 border-green-200';
      case 'demo': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'proposal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'follow_up': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'deadline': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Função para obter ícone do evento
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <CalendarIcon className="w-3 h-3" />;
      case 'call': return <Phone className="w-3 h-3" />;
      case 'demo': return <Video className="w-3 h-3" />;
      case 'proposal': return <FileText className="w-3 h-3" />;
      case 'follow_up': return <AlertCircle className="w-3 h-3" />;
      case 'deadline': return <Clock className="w-3 h-3" />;
      default: return <CalendarIcon className="w-3 h-3" />;
    }
  };

  // Função para navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Função para obter eventos de uma data específica
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Gerar dias do mês
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 semanas
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Renderizar visualização mensal
  const renderMonthView = () => {
    const days = generateCalendarDays();
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Dias do calendário */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDate(day);
            
            return (
              <div
                key={index}
                className={`
                  min-h-32 border-r border-b border-gray-200 p-2
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isToday ? 'bg-blue-50' : ''}
                `}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'text-blue-600 font-bold' : ''}
                `}>
                  {day.getDate()}
                </div>
                
                {/* Eventos do dia */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`
                        text-xs p-1 rounded border truncate cursor-pointer
                        ${getEventColor(event.type)}
                      `}
                      title={`${event.title} - ${event.description || ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {getEventIcon(event.type)}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar visualização semanal
  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-8 border-b bg-gray-50">
          <div className="p-3 text-center text-sm font-medium text-gray-600">
            Hora
          </div>
          {weekDays.map(day => (
            <div key={day.toDateString()} className="p-3 text-center text-sm font-medium text-gray-600">
              <div>{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
              <div className={`
                text-lg font-bold
                ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'}
              `}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-8">
          <div className="border-r border-gray-200">
            {/* Horários */}
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="h-12 border-b border-gray-100 p-2 text-xs text-gray-500">
                {i.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          {weekDays.map(day => (
            <div key={day.toDateString()} className="border-r border-gray-200">
              {Array.from({ length: 24 }, (_, i) => {
                const dayEvents = getEventsForDate(day).filter(event => {
                  const eventHour = new Date(event.start).getHours();
                  return eventHour === i;
                });
                
                return (
                  <div key={i} className="h-12 border-b border-gray-100 relative">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`
                          absolute inset-1 rounded text-xs p-1 cursor-pointer
                          ${getEventColor(event.type)}
                        `}
                        title={`${event.title} - ${event.description || ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {getEventIcon(event.type)}
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar visualização diária
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    
    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        <div className="p-4">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum evento agendado para hoje
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className={`
                    p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow
                    ${getEventColor(event.type)}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getEventIcon(event.type)}
                        <h4 className="font-medium">{event.title}</h4>
                      </div>
                      {event.description && (
                        <p className="text-sm opacity-75 mb-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.start.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                        {event.lead && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.lead.company}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={`
                      ${event.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'}
                    `}>
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="text-xl font-semibold min-w-48 text-center">
              {currentDate.toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Mês
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Dia
            </Button>
          </div>
          
          <Button
            onClick={() => setIsCreateEventModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Conteúdo do calendário */}
      <div>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* Modal de criação de evento (será implementado) */}
      {isCreateEventModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Criar Novo Evento</h2>
            <p className="text-gray-600 mb-4">
              Modal de criação de evento será implementado aqui
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateEventModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsCreateEventModalOpen(false)}>
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes do evento (será implementado) */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Eventos de {selectedDate.toLocaleDateString('pt-BR')}
            </h2>
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map(event => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {event.start.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setSelectedDate(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsCalendar;
