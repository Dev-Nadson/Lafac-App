import React, { useState } from 'react';
import { Users, Plus, Search, Filter, Shield, UserPlus } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types';
import SecureMemberForm from './SecureMemberForm';
import HierarchicalMembersList from './HierarchicalMembersList';
import toast from 'react-hot-toast';

const EnhancedMembersTab: React.FC = () => {
  const { users, refreshData } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Check if user has permission to manage members
  const canManageMembers = user?.role === 'President' || user?.role === 'Vice-President' || user?.role === 'Superadmin';

  const filteredUsers = users.filter(userItem => {
    const matchesSearch = userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userItem.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || userItem.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || 
                         (statusFilter === 'Active' && userItem.isActive) ||
                         (statusFilter === 'Inactive' && !userItem.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddMember = () => {
    if (!canManageMembers) {
      toast.error('Apenas Presidente e Vice-Presidente podem adicionar membros');
      return;
    }
    setShowAddModal(true);
  };

  const handleEditMember = (userToEdit: User) => {
    if (!canManageMembers) {
      toast.error('Apenas Presidente e Vice-Presidente podem editar membros');
      return;
    }
    setEditingUser(userToEdit);
  };

  const handleFormSuccess = async () => {
    await refreshData();
    toast.success('Dados atualizados com sucesso!');
  };

  const getActiveCount = () => users.filter(u => u.isActive).length;
  const getInactiveCount = () => users.filter(u => !u.isActive).length;
  const getRoleCount = (role: UserRole) => users.filter(u => u.role === role && u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Membros</h1>
              <p className="text-gray-600">Sistema seguro de gerenciamento de membros</p>
            </div>
          </div>
          {canManageMembers && (
            <button
              onClick={handleAddMember}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Membro
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Membros Ativos</p>
              <p className="text-2xl font-bold text-green-600">{getActiveCount()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Membros Inativos</p>
              <p className="text-2xl font-bold text-red-600">{getInactiveCount()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Diretoria</p>
              <p className="text-2xl font-bold text-purple-600">
                {getRoleCount('President') + getRoleCount('Vice-President') + 
                 getRoleCount('Director of Events') + getRoleCount('Director of Communications') + 
                 getRoleCount('Scientific Director') + getRoleCount('Treasurer')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Membros</p>
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'All')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Todas as Funções</option>
              <option value="President">Presidente</option>
              <option value="Vice-President">Vice-Presidente</option>
              <option value="Treasurer">Tesoureiro</option>
              <option value="Director of Events">Diretor de Eventos</option>
              <option value="Director of Communications">Diretor de Comunicações</option>
              <option value="Scientific Director">Diretor Científico</option>
              <option value="Member">Membro</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:w-32">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Todos</option>
              <option value="Active">Ativos</option>
              <option value="Inactive">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Access Control Notice */}
      {!canManageMembers && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <strong>Acesso Limitado:</strong> Apenas Presidente e Vice-Presidente podem adicionar ou editar membros.
            </p>
          </div>
        </div>
      )}

      {/* Members List */}
      <HierarchicalMembersList 
        users={filteredUsers}
        onEditMember={handleEditMember}
        canManageMembers={canManageMembers}
      />

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro encontrado</h3>
          <p className="text-gray-500">Tente ajustar os filtros de busca.</p>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <SecureMemberForm
          onClose={() => setShowAddModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}
      {editingUser && (
        <SecureMemberForm
          editingMember={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default EnhancedMembersTab;