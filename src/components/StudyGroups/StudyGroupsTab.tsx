import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  User,
  MapPin,
  Monitor,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StudyGroup } from '../../types';

const StudyGroupsTab: React.FC = () => {
  const { studyGroups, addStudyGroup, updateStudyGroup, users } = useData();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);

  const getStatusColor = (status: string) => {
    const colors = {
      Done: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
      Scheduled: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done':
        return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getMaterialStatusColor = (status: string) => {
    return status === 'Finished'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const StudyGroupModal: React.FC<{
    studyGroup?: StudyGroup | null;
    onSave: (groupData: any) => void;
    onClose: () => void;
    currentUserId?: string;
  }> = ({ studyGroup, onSave, onClose, currentUserId }) => {
    const [formData, setFormData] = useState({
      theme: studyGroup?.theme || '',
      presenter: studyGroup?.presenter || '',
      mode: studyGroup?.mode || ('Presencial' as 'Presencial' | 'Online'),
      date: studyGroup?.date || '',
      time: studyGroup?.time || '',
      materialStatus:
        studyGroup?.materialStatus ||
        ('Unfinished' as 'Finished' | 'Unfinished'),
      sessionStatus:
        studyGroup?.sessionStatus ||
        ('Scheduled' as 'Done' | 'Cancelled' | 'Scheduled'),
      researchAssignedTo: studyGroup?.researchAssignedTo || '',
      materialAssignedTo: studyGroup?.materialAssignedTo || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        attendance: studyGroup?.attendance || [],
        materials: studyGroup?.materials || [],
        createdBy: studyGroup?.createdBy || currentUserId,
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {studyGroup ? 'Editar Grupo de Estudo' : 'Criar Grupo de Estudo'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  Informações Básicas
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tema
                    </label>
                    <input
                      type="text"
                      value={formData.theme}
                      onChange={(e) =>
                        setFormData({ ...formData, theme: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="Ex: Farmacologia Cardiovascular"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ministrante
                    </label>
                    <input
                      type="text"
                      value={formData.presenter}
                      onChange={(e) =>
                        setFormData({ ...formData, presenter: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      placeholder="Nome do ministrante"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modo
                      </label>
                      <select
                        value={formData.mode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mode: e.target.value as 'Presencial' | 'Online',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Presencial">Presencial</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status da Sessão
                      </label>
                      <select
                        value={formData.sessionStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sessionStatus: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Scheduled">Agendado</option>
                        <option value="Done">Concluído</option>
                        <option value="Cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horário
                      </label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Assignments */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">
                  Atribuições de Tarefas
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📊 Responsável pela Pesquisa/PowerPoint *
                    </label>
                    <select
                      value={formData.researchAssignedTo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          researchAssignedTo: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecionar membro</option>
                      {users
                        .filter((u) => u.isActive)
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📝 Responsável pelos Quizzes/Material *
                    </label>
                    <select
                      value={formData.materialAssignedTo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          materialAssignedTo: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecionar membro</option>
                      {users
                        .filter((u) => u.isActive)
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status do Material
                    </label>
                    <select
                      value={formData.materialStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          materialStatus: e.target.value as
                            | 'Finished'
                            | 'Unfinished',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Unfinished">Não Finalizado</option>
                      <option value="Finished">Finalizado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {studyGroup ? 'Atualizar' : 'Criar'} Grupo de Estudo
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
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Grupos de Estudo</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Grupo de Estudo
        </button>
      </div>

      {/* Study Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {studyGroups.map((group) => {
          const isPast = new Date(`${group.date}T${group.time}`) < new Date();
          const researchUser = group.researchAssignedTo
            ? users.find((u) => u.id === group.researchAssignedTo)
            : null;
          const materialUser = group.materialAssignedTo
            ? users.find((u) => u.id === group.materialAssignedTo)
            : null;

          return (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {group.theme}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        group.sessionStatus
                      )}`}
                    >
                      {getStatusIcon(group.sessionStatus)}
                      <span className="ml-1">{group.sessionStatus}</span>
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMaterialStatusColor(
                        group.materialStatus
                      )}`}
                    >
                      📝 {group.materialStatus}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingGroup(group)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>

              {/* Presenter */}
              <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>
                  <strong>Ministrante:</strong> {group.presenter}
                </span>
              </div>

              {/* Mode */}
              <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                {group.mode === 'Online' ? (
                  <Monitor className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                <span>
                  <strong>Modo:</strong> {group.mode}
                </span>
              </div>

              {/* Date and Time */}
              <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(group.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{group.time} (GMT-3)</span>
                </div>
              </div>

              {/* Task Assignments */}
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Atribuições:
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">📊 Pesquisa/PowerPoint</span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {researchUser ? researchUser.name : 'Não atribuído'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">📝 Quizzes/Material</span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {materialUser ? materialUser.name : 'Não atribuído'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Materiais:
                </h4>
                {group.materials.length > 0 ? (
                  <div className="space-y-1">
                    {group.materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          {material.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({material.type})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Nenhum material enviado ainda
                  </p>
                )}
              </div>

              {/* Attendance (if session is done) */}
              {group.sessionStatus === 'Done' &&
                group.attendance.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Presença:
                    </h4>
                    <div className="text-sm text-gray-600">
                      {group.attendance.filter((a) => a.present).length} de{' '}
                      {group.attendance.length} membros presentes
                    </div>
                  </div>
                )}

              {/* Past session indicator */}
              {isPast && group.sessionStatus === 'Scheduled' && (
                <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Esta sessão já passou e pode precisar de atualização de
                    status.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {studyGroups.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum grupo de estudo ainda
          </h3>
          <p className="text-gray-500">
            Crie seu primeiro grupo de estudo para começar.
          </p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <StudyGroupModal
          currentUserId={user?.id}
          onSave={(groupData) => {
            addStudyGroup(groupData);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingGroup && (
        <StudyGroupModal
          studyGroup={editingGroup}
          currentUserId={user?.id}
          onSave={(groupData) => {
            updateStudyGroup(editingGroup.id, groupData);
            setEditingGroup(null);
          }}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
};

export default StudyGroupsTab;
