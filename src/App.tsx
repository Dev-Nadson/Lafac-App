import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Header from './components/common/Header';
import TabNavigation, { TabType } from './components/Navigation/TabNavigation';
import CalendarTab from './components/Calendar/CalendarTab';
import EnhancedMembersTab from './components/Members/EnhancedMembersTab';
import PostsTab from './components/Posts/PostsTab';
import StudyGroupsTab from './components/StudyGroups/StudyGroupsTab';
import EventsTab from './components/Events/EventsTab';
import SelectionProcessTab from './components/SelectionProcess/SelectionProcessTab';
import ActivityTracker from './components/ActivityTracker/ActivityTracker';
import UserProfileManager from './components/Auth/UserProfileManager';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'calendar':
        return <CalendarTab />;
      case 'activities':
        return <ActivityTracker />;
      case 'members':
        return (
          <ProtectedRoute requiredPermissions={['users:read']}>
            <EnhancedMembersTab />
          </ProtectedRoute>
        );
      case 'posts':
        return (
          <ProtectedRoute requiredPermissions={['posts:read']}>
            <PostsTab />
          </ProtectedRoute>
        );
      case 'studyGroups':
        return (
          <ProtectedRoute requiredPermissions={['study_groups:read']}>
            <StudyGroupsTab />
          </ProtectedRoute>
        );
      case 'events':
        return (
          <ProtectedRoute requiredPermissions={['events:read']}>
            <EventsTab />
          </ProtectedRoute>
        );
      case 'selectionProcess':
        return (
          <ProtectedRoute requiredRole="President">
            <SelectionProcessTab />
          </ProtectedRoute>
        );
      case 'profile':
        return <UserProfileManager />;
      default:
        return <CalendarTab />;
    }
  };

  return (
    <AuthProvider>
      <DataProvider>
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderActiveTab()}
            </main>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ProtectedRoute>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;