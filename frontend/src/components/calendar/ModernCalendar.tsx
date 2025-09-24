import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertCircle,
  Globe,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCalendar, CalendarEvent, ViewMode } from '@/hooks/useCalendar';
import { useLeads } from '@/hooks/useLeads';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { EventModal } from './EventModal';
import { EventDetailsModal } from './EventDetailsModal';

interface ModernCalendarProps {
  className?: string;
}

export function ModernCalendar({ className }: ModernCalendarProps) {
  const {
    events,
    loading,
    error,
    currentDate,
    viewMode,
    setViewMode,
    setCurrentDate,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForDateRange,
    navigateDate,
    goToToday,
    isGoogleConnected,
  } = useCalendar();

  const { leads, getLeadById } = useLeads();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);
  const [showGoogleEvents, setShowGoogleEvents] = useState(true);

  // Filtrar eventos baseado na preferência do usuário
  const filteredEvents = useMemo(() => {
    if (showGoogleEvents) return events;
    return events.filter(event => !event.google_event_id);
  }, [events, showGoogleEvents]);

  // Eventos de hoje
  const todayEvents = useMemo(() => {
    return getEventsForDate(new Date());
  }, [getEventsForDate]);

  // Próximos eventos (próximos 7 dias)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    
    return getEventsForDateRange(today, weekFromNow)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [getEventsForDateRange]);

  // Estatísticas
  const stats = useMemo(() => {
    const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const monthEvents = getEventsForDateRange(thisMonth, nextMonth);
    
    return {
      total: monthEvents.length,
      completed: monthEvents.filter(e => e.status === 'completed').length,
      pending: monthEvents.filter(e => e.status === 'scheduled').length,
      cancelled: monthEvents.filter(e => e.status === 'cancelled').length,
    };
  }, [currentDate, getEventsForDateRange]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    const colors = {
      meeting: 'bg-blue-500',
      call: 'bg-green-500',
      demo: 'bg-purple-500',
      proposal: 'bg-orange-500',
      follow_up: 'bg-yellow-500',
      deadline: 'bg-red-500',
      other: 'bg-gray-500',
    };
    return colors[type] || colors.other;
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    const icons = {
      meeting: Users,
      call: Phone,
      demo: Video,
      proposal: FileText,
      follow_up: Clock,
      deadline: AlertCircle,
      other: CalendarIcon,
    };
    return icons[type] || CalendarIcon;
  };

  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date);
    setIsEventModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsModalOpen(true);
  };

  const handleEventCreate = async (eventData: any) => {
    const success = await createEvent(eventData);
    if (success) {
      setIsEventModalOpen(false);
      setSelectedDate(null);
    }
  };

  const handleEventUpdate = async (eventId: string, eventData: any) => {
    const success = await updateEvent(eventId, eventData);
    if (success) {
      setIsEventDetailsModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleEventDelete = async (eventId: string) => {
    const success = await deleteEvent(eventId);
    if (success) {
      setIsEventDetailsModalOpen(false);
      setSelectedEvent(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            Calendário
            {isGoogleConnected && (
              <Badge variant="outline" className="ml-2">
                <Globe className="h-3 w-3 mr-1" />
                Google Calendar
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus compromissos e reuniões de forma integrada
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isGoogleConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGoogleEvents(!showGoogleEvents)}
            >
              {showGoogleEvents ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showGoogleEvents ? 'Ocultar Google' : 'Mostrar Google'}
            </Button>
          )}
          <Button 
            className="vb-button-primary"
            onClick={() => setIsEventModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendário principal */}
        <div className="lg:col-span-3">
          <Card className="vb-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <CardTitle className="text-xl">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                  >
                    Hoje
                  </Button>
                </div>

                <div className="flex gap-2">
                  {(['month', 'week', 'day'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode(mode)}
                    >
                      {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-96 text-red-600">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  {error}
                </div>
              ) : (
                <>
                  {viewMode === 'month' && (
                    <CalendarMonthView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onDateClick={setSelectedDate}
                      onEventClick={handleEventClick}
                      onCreateEvent={handleCreateEvent}
                      getEventTypeColor={getEventTypeColor}
                      getEventTypeIcon={getEventTypeIcon}
                    />
                  )}
                  
                  {viewMode === 'week' && (
                    <CalendarWeekView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onDateClick={setSelectedDate}
                      onEventClick={handleEventClick}
                      onCreateEvent={handleCreateEvent}
                      getEventTypeColor={getEventTypeColor}
                      getEventTypeIcon={getEventTypeIcon}
                    />
                  )}
                  
                  {viewMode === 'day' && (
                    <CalendarDayView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventClick={handleEventClick}
                      onCreateEvent={handleCreateEvent}
                      getEventTypeColor={getEventTypeColor}
                      getEventTypeIcon={getEventTypeIcon}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Eventos de hoje */}
          <Card className="vb-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayEvents.length > 0 ? (
                todayEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="space-y-2 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm leading-tight">{event.title}</h4>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {event.type === 'meeting' ? 'Reunião' : 
                           event.type === 'call' ? 'Ligação' : 
                           event.type === 'demo' ? 'Demo' : 
                           event.type === 'proposal' ? 'Proposta' : 
                           event.type === 'follow_up' ? 'Follow-up' : 
                           event.type === 'deadline' ? 'Prazo' : 'Outro'}
                        </Badge>
                        {event.google_event_id && (
                          <Globe className="h-3 w-3 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {event.is_all_day 
                            ? 'Dia todo' 
                            : new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          }
                        </span>
                      </div>
                      {event.lead && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{event.lead.name}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento para hoje
                </p>
              )}
            </CardContent>
          </Card>

          {/* Próximos eventos */}
          <Card className="vb-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="space-y-2 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm leading-tight">{event.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {event.type === 'meeting' ? 'Reunião' : 
                         event.type === 'call' ? 'Ligação' : 
                         event.type === 'demo' ? 'Demo' : 
                         event.type === 'proposal' ? 'Proposta' : 
                         event.type === 'follow_up' ? 'Follow-up' : 
                         event.type === 'deadline' ? 'Prazo' : 'Outro'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{new Date(event.start).toLocaleDateString('pt-BR')}</span>
                        {!event.is_all_day && (
                          <>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        )}
                      </div>
                      {event.lead && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{event.lead.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento próximo
                </p>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="vb-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total este mês</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <span className="font-medium text-yellow-600">{stats.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Concluídos</span>
                <span className="font-medium text-green-600">{stats.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cancelados</span>
                <span className="font-medium text-red-600">{stats.cancelled}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedDate(null);
        }}
        onSave={handleEventCreate}
        selectedDate={selectedDate}
        leads={leads}
        isGoogleConnected={isGoogleConnected}
      />

      <EventDetailsModal
        isOpen={isEventDetailsModalOpen}
        onClose={() => {
          setIsEventDetailsModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onUpdate={handleEventUpdate}
        onDelete={handleEventDelete}
        leads={leads}
        isGoogleConnected={isGoogleConnected}
      />
    </div>
  );
}
