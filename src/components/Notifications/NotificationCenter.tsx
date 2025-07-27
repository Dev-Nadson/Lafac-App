import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, AlertTriangle, CheckCircle, Users, MessageSquare, Calendar, Target, Send, User } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types';
import toast from 'react-hot-toast';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { users, notifications, addNotification, markNotificationAsRead, deleteNotification } = useData();
  const { user } = useAuth();
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [nudgeMessage, setNudgeMessage] = useState('');

  // Filter notifications for current user
  const userNotifications = notifications.filter(n => n.userId === user?.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Task': return <Target className="w-5 h-5 text-orange-500" />;
      case 'Event': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'Deadline': return <Clock className="w-5 h-5 text-red-500" />;
      case 'System': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Birthday': return <span className="text-lg">🎂</span>;
      case 'Budget': return <span className="text-lg">💰</span>;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      toast.success('Notificação marcada como lida');
    } catch (error) {
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      toast.success('Notificação removida');
    } catch (error) {
      toast.error('Erro ao remover notificação');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = userNotifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification.id);
      }
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const sendNudge = async () => {
    if (!selectedUser || !nudgeMessage.trim()) {
      toast.error('Selecione um usuário e digite uma mensagem');
      return;
    }

    const targetUser = users.find(u => u.id === selectedUser);
    if (!targetUser) return;

    try {
      await addNotification({
        userId: selectedUser,
        title: 'Lembrete',
        message: nudgeMessage,
        type: 'Task',
        read: false,
        createdAt: new Date().toISOString()
      });

      toast.success(`Lembrete enviado para ${targetUser.name}! 📨`);
      setShowNudgeModal(false);
      setSelectedUser('');
      setNudgeMessage('');
    } catch (error) {
      toast.error('Erro ao enviar lembrete');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[100]" onClick={onClose}>
        <div 
          className="fixed right-4 top-16 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[80vh] overflow-hidden z-[110]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowNudgeModal(true)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Enviar lembrete"
                >
                  <Send className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {userNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {userNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              <div className="flex items-center space-x-2">
                                {!notification.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                  >
                                    Marcar como lida
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowNudgeModal(true)}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Lembrete</span>
              </button>
              <button
                onClick={() => {
                  // Simulate creating automatic reminder
                  toast.success('Lembretes automáticos ativados! 🔔');
                }}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Auto-Lembretes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nudge Modal */}
      {showNudgeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Send className="w-5 h-5 mr-2 text-blue-600" />
              Enviar Lembrete
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enviar para:
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um membro</option>
                  {users.filter(u => u.isActive).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem:
                </label>
                <textarea
                  value={nudgeMessage}
                  onChange={(e) => setNudgeMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Olá! Só lembrando que você tem uma tarefa pendente..."
                />
              </div>

              {/* Pre-defined messages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou escolha uma mensagem rápida:
                </label>
                <div className="space-y-2">
                  {[
                    "Oi! Só lembrando da sua tarefa pendente 😊",
                    "Prazo se aproximando! Precisa de ajuda? 🤝",
                    "Sua contribuição é importante para o projeto! 💪",
                    "Lembrete amigável: temos uma atividade esperando você! ⏰",
                    "Ei! Que tal darmos uma olhada naquela tarefa? 👀"
                  ].map((msg, index) => (
                    <button
                      key={index}
                      onClick={() => setNudgeMessage(msg)}
                      className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={sendNudge}
                disabled={!selectedUser || !nudgeMessage.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Enviar Lembrete
              </button>
              <button
                onClick={() => setShowNudgeModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationCenter;