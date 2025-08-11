import React, { useState, useEffect } from 'react';
import { Clock, Target, AlertTriangle, CheckCircle, Send, Users, Calendar } from 'lucide-react';
import { useData } from '../../context/DataContext';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase.ts'

interface Activity {
  id: string;
  type: 'post' | 'event' | 'study';
  title: string;
  assignedTo: string[];
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  createdAt: string;
  completedAt?: string;
  remindersSent: number;
  lastReminderAt?: string;
}

const ActivityTracker: React.FC = () => {
  const { users, posts, events, studyGroups, addNotification } = useData();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    // Convert posts, events and study groups to activities
    const allActivities: Activity[] = [
      // Posts
      ...posts.map(post => ({
        id: `post-${post.id}`,
        type: 'post' as const,
        title: post.title,
        assignedTo: post.assignedRoles.map(role => role.assignedTo).filter(Boolean) as string[],
        deadline: post.deadline,
        status: getActivityStatus(post.deadline, post.status === 'Done'),
        priority: getPriorityFromDeadline(post.deadline),
        description: post.description,
        createdAt: post.date,
        remindersSent: 0,
        lastReminderAt: undefined
      })),
      // Events
      ...events.map(event => ({
        id: `event-${event.id}`,
        type: 'event' as const,
        title: event.title,
        assignedTo: event.assignedMembers,
        deadline: `${event.date}T${event.time}`,
        status: getActivityStatus(`${event.date}T${event.time}`, event.status === 'Completed'),
        priority: getPriorityFromDeadline(`${event.date}T${event.time}`),
        description: event.description,
        createdAt: event.date,
        remindersSent: 0,
        lastReminderAt: undefined
      })),
      // Study groups
      ...studyGroups.map(group => ({
        id: `study-${group.id}`,
        type: 'study' as const,
        title: `Grupo de Estudo: ${group.theme}`,
        assignedTo: [group.createdBy],
        deadline: `${group.date}T${group.time}`,
        status: getActivityStatus(`${group.date}T${group.time}`, group.sessionStatus === 'Done'),
        priority: getPriorityFromDeadline(`${group.date}T${group.time}`),
        description: `Apresentador: ${group.presenter} | Modo: ${group.mode}`,
        createdAt: group.date,
        remindersSent: 0,
        lastReminderAt: undefined
      }))
    ];

    setActivities(allActivities);
  }, [posts, events, studyGroups]);

  const getActivityStatus = (deadline: string, isCompleted: boolean): Activity['status'] => {
    if (isCompleted) return 'completed';
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    
    if (deadlineDate < now) return 'overdue';
    
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDeadline >= 24) return 'in_progress';
    
    return 'pending';
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      // Remove prefixo "event-" caso exista
      const cleanId = activityId.replace(/^event-/, "");
  
      const { error } = await supabase
        .from("events") // ou o nome da sua tabela
        .update({ status: "Completed" })
        .eq("id", cleanId);
  
      if (error) {
        console.error("Error completing activity:", error);
        return;
      }
      
      setActivities((prevActivities) =>
        prevActivities.map((act) =>
          act.id === activityId ? { ...act, status: "completed" } : act
        )
      );
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };  

  const getPriorityFromDeadline = (deadline: string): Activity['priority'] => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const hoursUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline <= 6) return 'urgent';
    if (hoursUntilDeadline <= 24) return 'high';
    if (hoursUntilDeadline <= 72) return 'medium';
    return 'low';
  };

  const getStatusColor = (status: Activity['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Activity['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const sendReminder = async (activity: Activity, customMessage?: string) => {
    const assignedUsers = users.filter(u => activity.assignedTo.includes(u.id));
    
    if (assignedUsers.length === 0) {
      toast.error('Nenhum usuário atribuído a esta atividade');
      return;
    }

    const message = customMessage || `Lembrete: Você tem a atividade "${activity.title}" com prazo para ${new Date(activity.deadline).toLocaleDateString('pt-BR')}`;
    
    try {
      // Send notification to each assigned user

      for (const user of assignedUsers) {
        const rawId = activity.id
        const cleanId = rawId.replace(/^post-/, '')
        console.log(activity.id)
        console.log(rawId)
        console.log(cleanId)
        await addNotification({
          userId: user.id,
          title: 'Lembrete de Atividade',
          message: message,
          type: 'Task',
          read: false,
          actionUrl: `#activity-${cleanId}`, 
          relatedId: cleanId,
          createdAt: new Date().toISOString()
        });
      }

      // Update reminder counter
      setActivities(prev => prev.map(a => 
        a.id === activity.id 
          ? { 
              ...a, 
              remindersSent: a.remindersSent + 1,
              lastReminderAt: new Date().toISOString()
            }
          : a
      ));

      toast.success(`Lembrete enviado para ${assignedUsers.length} pessoa(s)! 📨`);
      setShowReminderModal(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Erro ao enviar lembrete');
    }
  };

  const sendBulkReminders = async () => {
    const overdueActivities = activities.filter(a => a.status === 'overdue' || a.status === 'in_progress');
    
    if (overdueActivities.length === 0) {
      toast('Não há atividades urgentes para lembrar');
      return;
    }

    try {
      for (const activity of overdueActivities) {
        await sendReminder(activity);
      }
      toast.success(`Lembretes enviados para ${overdueActivities.length} atividades urgentes! 🚨`);
    } catch (error) {
      toast.error('Erro ao enviar lembretes em lote');
    }
  };

  const formatTimeUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffInHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) {
      const hoursOverdue = Math.abs(diffInHours);
      if (hoursOverdue < 24) return `${Math.floor(hoursOverdue)}h atrasado`;
      return `${Math.floor(hoursOverdue / 24)}d atrasado`;
    }
    
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h restantes`;
    return `${Math.floor(diffInHours / 24)}d restantes`;
  };

  const overdueCount = activities.filter(a => a.status === 'overdue').length;
  const urgentCount = activities.filter(a => a.priority === 'urgent' && a.status !== 'completed').length;
  const inProgressCount = activities.filter(a => a.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            Rastreamento de Atividades
          </h2>
          <button
            onClick={sendBulkReminders}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Lembrar Urgentes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Atrasadas</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Urgentes</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-1">{urgentCount}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Em Andamento</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{inProgressCount}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Concluídas</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {activities.filter(a => a.status === 'completed').length}
            </p>
          </div>
        </div>
      </div>

      {/* Activities list */}
      <div className="space-y-4">
        {activities
          .sort((a, b) => {
            // Sort by priority and status
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const statusOrder = { overdue: 4, in_progress: 3, pending: 2, completed: 1 };
            
            if (a.status !== b.status) {
              return statusOrder[b.status] - statusOrder[a.status];
            }
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          })
          .map(activity => {
            const assignedUsers = users.filter(u => activity.assignedTo.includes(u.id));
            
            return (
              <div
                key={activity.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 p-6 hover:shadow-md transition-shadow ${
                  activity.status === 'overdue' ? 'border-l-red-500' :
                  activity.priority === 'urgent' ? 'border-l-orange-500' :
                  activity.status === 'completed' ? 'border-l-green-500' :
                  'border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {getStatusIcon(activity.status)}
                        <span className="ml-1 capitalize">{activity.status}</span>
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                        {activity.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatTimeUntilDeadline(activity.deadline)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{assignedUsers.length} atribuído(s)</span>
                      </div>
                      
                      {activity.remindersSent > 0 && (
                        <div className="flex items-center space-x-1">
                          <Send className="w-4 h-4" />
                          <span>{activity.remindersSent} lembrete(s) enviado(s)</span>
                        </div>
                      )}
                    </div>
                    
                    {assignedUsers.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Atribuído para:</span>
                        <div className="flex -space-x-2">
                          {assignedUsers.slice(0, 3).map(user => (
                            <div
                              key={user.id}
                              className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                              title={user.name}
                            >
                              {user.name.charAt(0)}
                            </div>
                          ))}
                          {assignedUsers.length > 3 && (
                            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                              +{assignedUsers.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {activity.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => handleCompleteActivity(activity.id)}
                          className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Concluir</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowReminderModal(true);
                          }}
                          className="flex items-center space-x-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          <span>Lembrar</span>
                        </button>
                      </>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
      </div>

      {/* Custom reminder modal */}
      {showReminderModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enviar Lembrete Personalizado
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Atividade:</strong> {selectedActivity.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Prazo:</strong> {new Date(selectedActivity.deadline).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => sendReminder(selectedActivity)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enviar Lembrete Padrão
              </button>
              
              <button
                onClick={() => sendReminder(selectedActivity, "Oi! Só um lembrete amigável sobre sua atividade. Precisa de ajuda? 😊")}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Lembrete Amigável
              </button>
              
              <button
                onClick={() => sendReminder(selectedActivity, "⚠️ URGENTE: Prazo se aproximando! Por favor, verifique sua atividade.")}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Lembrete Urgente
              </button>
            </div>

            <button
              onClick={() => {
                setShowReminderModal(false);
                setSelectedActivity(null);
              }}
              className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTracker;