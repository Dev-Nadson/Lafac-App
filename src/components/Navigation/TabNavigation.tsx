import React from 'react';
import { Calendar, Users, MessageSquare, BookOpen, CalendarDays, UserCheck, Target, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type TabType = 'calendar' | 'members' | 'posts' | 'studyGroups' | 'events' | 'selectionProcess' | 'activities' | 'profile';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const { user, checkPermission } = useAuth();

  const tabs = [
    { id: 'calendar' as TabType, name: 'Calendário', icon: Calendar, permission: null },
    { id: 'activities' as TabType, name: 'Atividades', icon: Target, permission: null },
    { id: 'members' as TabType, name: 'Membros', icon: Users, permission: 'users:read' },
    { id: 'posts' as TabType, name: 'Postagens', icon: MessageSquare, permission: 'posts:read' },
    { id: 'studyGroups' as TabType, name: 'Grupos de Estudo', icon: BookOpen, permission: 'study_groups:read' },
    { id: 'events' as TabType, name: 'Eventos', icon: CalendarDays, permission: 'events:read' },
    { id: 'selectionProcess' as TabType, name: 'Processo Seletivo', icon: UserCheck, requiredRole: 'President', allowInterviewers: true },
    { id: 'profile' as TabType, name: 'Perfil', icon: User, permission: null }
  ];

  const visibleTabs = tabs.filter(tab => {
    // Always show tabs without permission requirements
    if (!tab.permission && !tab.requiredRole) return true;
    
    // Check role-based access for selection process
    if (tab.requiredRole) {
      // Allow if user has the required role or is Superadmin
      const hasRequiredRole = user?.role === tab.requiredRole || user?.role === 'Superadmin' || user?.role === 'Vice-President';
      
      // For selection process, also allow if user has interviewer permissions
      if (tab.allowInterviewers && tab.id === 'selectionProcess') {
        const hasInterviewerPermission = checkPermission('candidates', 'interview');
        return hasRequiredRole || hasInterviewerPermission;
      }
      
      return hasRequiredRole;
    }
    
    // Check permission-based access
    if (tab.permission) {
      const [resource, action] = tab.permission.split(':');
      return checkPermission(resource, action);
    }
    
    return true;
  });

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;