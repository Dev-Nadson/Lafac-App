import React, { useState } from 'react';
import { Calendar, Plus, MapPin, Users, Clock, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Event, EventType } from '../../types';

const EventsTab: React.FC = () => {
  const { events, addEvent, updateEvent, users } = useData();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [typeFilter, setTypeFilter] = useState<EventType | 'All'>('All');

  const getStatusColor = (status: string) => {
    const colors = {
      'Scheduled': 'bg-blue-100 text-blue-800',
      'Confirmed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Completed': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getConfirmationStats = (event: Event) => {
    const confirmed = event.confirmations.filter(c => c.status === 'Confirmed').length;
    const declined = event.confirmations.filter(c => c.status === 'Declined').length;
    const pending = event.confirmations.filter(c => c.status === 'Invited').length;
    return { confirmed, declined, pending };
  };

  const filteredEvents = events.filter(event => 
    typeFilter === 'All' || event.type === typeFilter
  );

  const EventModal: React.FC<{ 
    event?: Event | null; 
    onSave: (eventData: any) => void; 
    onClose: () => void;
    currentUserId?: string;
  }> = ({ event, onSave, onClose, currentUserId }) => {
    const [formData, setFormData] = useState({
      title: event?.title || '',
      description: event?.description || '',
      date: event?.date || '',
      time: event?.time || '',
      type: event?.type || 'Palestra' as EventType,
      location: event?.location || '',
      onlineLink: event?.onlineLink || '',
      status: event?.status || 'Scheduled' as Event['status'],
      assignedMembers: event?.assignedMembers || [] as string[]
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        confirmations: event?.confirmations || [],
        attendance: event?.attendance || [],
        createdBy: event?.createdBy || currentUserId
      });
    };

    const toggleMemberAssignment = (userId: string) => {
      setFormData(prev => ({
        ...prev,
        assignedMembers: prev.assignedMembers.includes(userId)
          ? prev.assignedMembers.filter(id => id !== userId)
          : [...prev.assignedMembers, userId]
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {event ? 'Editar Evento' : 'Criar Novo Evento'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as EventType})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Simpósio">Simpósio</option>
                    <option value="Palestra">Palestra</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Ação">Ação</option>
                    <option value="Minicurso">Minicurso</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as Event['status']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Scheduled">Agendado</option>
                    <option value="Confirmed">Confirmado</option>
                    <option value="Cancelled">Cancelado</option>
                    <option value="Completed">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Auditório Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Online (Opcional)</label>
                <input
                  type="url"
                  value={formData.onlineLink}
                  onChange={(e) => setFormData({...formData, onlineLink: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://meet.google.com/..."
                />
              </div>

              {/* Assigned Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Membros Atribuídos</label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                  {users.filter(u => u.isActive).map(user => (
                    <label key={user.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.assignedMembers.includes(user.id)}
                        onChange={() => toggleMemberAssignment(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>{user.name} ({user.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {event ? 'Atualizar' : 'Criar'} Evento
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Evento
        </button>
      </div>

      {/* Type Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filtrar por Tipo:</span>
          <div className="flex flex-wrap gap-2">
            {(['All', 'Simpósio', 'Palestra', 'Workshop', 'Ação', 'Minicurso', 'Outro'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  typeFilter === type
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'All' ? 'Todos' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map(event => {
          const { confirmed, declined, pending } = getConfirmationStats(event);
          const isPast = new Date(`${event.date}T${event.time}`) < new Date();
          
          return (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                      {event.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      <span className="ml-1">{event.status}</span>
                    </span>
                    {isPast && event.status === 'Scheduled' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Passou do prazo
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingEvent(event)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-4">{event.description}</p>

              {/* Date and Time */}
              <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{event.time} (GMT-3)</span>
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              )}

              {/* Online Link */}
              {event.onlineLink && (
                <div className="mb-3">
                  <a
                    href={event.onlineLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Participar Online</span>
                  </a>
                </div>
              )}

              {/* Assigned Members */}
              {event.assignedMembers.length > 0 && (
                <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{event.assignedMembers.length} membros atribuídos</span>
                </div>
              )}

              {/* Confirmation Stats */}
              {event.confirmations.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Status de Confirmação:</h4>
                  <div className="flex space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{confirmed} Confirmados</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>{declined} Recusaram</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>{pending} Pendentes</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance (if completed) */}
              {event.status === 'Completed' && event.attendance.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Presença:</h4>
                  <div className="text-xs text-gray-600">
                    {event.attendance.filter(a => a.status === 'Present').length} de {event.attendance.length} compareceram
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento encontrado</h3>
          <p className="text-gray-500">
            {typeFilter === 'All' 
              ? 'Crie seu primeiro evento para começar.' 
              : `Nenhum evento do tipo "${typeFilter}".`
            }
          </p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <EventModal
          currentUserId={user?.id}
          onSave={(eventData) => {
            addEvent(eventData);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingEvent && (
        <EventModal
          event={editingEvent}
          currentUserId={user?.id}
          onSave={(eventData) => {
            updateEvent(editingEvent.id, eventData);
            setEditingEvent(null);
          }}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};

export default EventsTab;