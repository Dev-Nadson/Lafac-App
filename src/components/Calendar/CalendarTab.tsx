import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CalendarEvent } from '../../types';

type ViewMode = 'weekly' | 'monthly';

const CalendarTab: React.FC = () => {
  const { getCalendarEvents, events, studyGroups, posts } = useData();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  const calendarEvents = getCalendarEvents();

  const formatDateForDisplay = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTimeForBrazil = (time: string) => {
    return `${time} (GMT-3)`;
  };

  const getEventDetails = (event: CalendarEvent) => {
    if (event.type === 'Event') {
      return events.find(e => e.id === event.relatedId);
    } else if (event.type === 'Study Group') {
      return studyGroups.find(sg => sg.id === event.relatedId);
    } else if (event.type === 'Post Deadline') {
      return posts.find(p => p.id === event.relatedId);
    }
    return null;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.date === dateString);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderMonthlyView = () => {
    const days = getDaysInMonth(selectedDate);
    const today = new Date();
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-24 border-r border-b border-gray-200 last:border-r-0"></div>;
            }
            
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === today.toDateString();
            
            return (
              <div key={day.getDate()} className="h-24 border-r border-b border-gray-200 last:border-r-0 p-1">
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left text-xs px-1 py-0.5 rounded truncate hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: event.color, color: 'white' }}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 2} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeeklyView = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setSelectedDate(prev => {
              const newDate = new Date(prev);
              newDate.setDate(prev.getDate() - 7);
              return newDate;
            })}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - {weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setSelectedDate(prev => {
              const newDate = new Date(prev);
              newDate.setDate(prev.getDate() + 7);
              return newDate;
            })}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {weekDays.map(day => {
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div key={day.toISOString()} className="border-r border-gray-200 last:border-r-0">
                <div className={`p-3 text-center border-b border-gray-200 ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="p-2 space-y-1 min-h-[200px]">
                  {dayEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: event.color, color: 'white' }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.time && <div className="opacity-80">{formatTimeForBrazil(event.time)}</div>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
          </div>
        </div>
      </div>

      {/* Timezone Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Fuso Horário: Brasil (GMT-3) • Hora atual: {new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </span>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'monthly' ? renderMonthlyView() : renderWeeklyView()}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedEvent.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {selectedEvent.time && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeForBrazil(selectedEvent.time)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Event Details */}
              {(() => {
                const details = getEventDetails(selectedEvent);
                if (!details) return null;

                if (selectedEvent.type === 'Event') {
                  const event = details as any;
                  return (
                    <div className="space-y-4">
                      <p className="text-gray-700">{event.description}</p>
                      {event.location && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.assignedMembers && event.assignedMembers.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{event.assignedMembers.length} membros atribuídos</span>
                        </div>
                      )}
                    </div>
                  );
                } else if (selectedEvent.type === 'Study Group') {
                  const studyGroup = details as any;
                  return (
                    <div className="space-y-2">
                      <p><strong>Apresentador:</strong> {studyGroup.presenter}</p>
                      <p><strong>Modo:</strong> {studyGroup.mode}</p>
                      <p><strong>Status do Material:</strong> {studyGroup.materialStatus}</p>
                      <p><strong>Status da Sessão:</strong> {studyGroup.sessionStatus}</p>
                    </div>
                  );
                } else if (selectedEvent.type === 'Post Deadline') {
                  const post = details as any;
                  return (
                    <div className="space-y-2">
                      <p className="text-gray-700">{post.description}</p>
                      <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${
                        post.status === 'Done' ? 'bg-green-100 text-green-800' :
                        post.status === 'Posted' ? 'bg-blue-100 text-blue-800' :
                        post.status === 'In Production' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{post.status}</span></p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarTab;