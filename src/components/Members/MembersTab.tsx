import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, Mail, Phone, Plus, Edit, UserCheck, UserX } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { User, UserRole } from '../../types';

const MembersTab: React.FC = () => {
  const { users, addUser, updateUser } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && user.isActive) ||
                          (statusFilter === 'Inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const getRoleColor = (role: UserRole) => {
    const colors = {
      'President': 'bg-purple-100 text-purple-800',
      'Vice-President': 'bg-indigo-100 text-indigo-800',
      'Director of Events': 'bg-blue-100 text-blue-800',
      'Director of Communications': 'bg-green-100 text-green-800',
      'Scientific Director': 'bg-emerald-100 text-emerald-800',
      'Treasurer': 'bg-yellow-100 text-yellow-800',
      'Member': 'bg-gray-100 text-gray-800'
    };
    return colors[role];
  };

  const handleAddUser = (userData: Omit<User, 'id'>) => {
    addUser(userData);
    setShowAddModal(false);
  };

  const handleUpdateUser = (userData: Partial<User>) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
      setEditingUser(null);
    }
  };

  const UserModal: React.FC<{ 
    user?: User | null; 
    onSave: (userData: any) => void; 
    onClose: () => void; 
  }> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'Member' as UserRole,
      contactInfo: user?.contactInfo || '',
      isActive: user?.isActive ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        joinDate: user?.joinDate || new Date().toISOString().split('T')[0],
        participationHistory: user?.participationHistory || []
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {user ? 'Editar Membro' : 'Adicionar Novo Membro'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Member">Membro</option>
                  <option value="Treasurer">Tesoureiro</option>
                  <option value="Scientific Director">Diretor Científico</option>
                  <option value="Director of Communications">Diretor de Comunicações</option>
                  <option value="Director of Events">Diretor de Eventos</option>
                  <option value="Vice-President">Vice-Presidente</option>
                  <option value="President">Presidente</option>
                  <option value="InterviwerMember">Entrevistador</option>

                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Informações de Contato</label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+55 11 99999-9999"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Membro Ativo
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {user ? 'Atualizar' : 'Adicionar'} Membro
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
          <Users className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Membros</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Membro
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar membros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'All')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Todas as Funções</option>
              <option value="President">Presidente</option>
              <option value="Vice-President">Vice-Presidente</option>
              <option value="Director of Events">Diretor de Eventos</option>
              <option value="Director of Communications">Diretor de Comunicações</option>
              <option value="Scientific Director">Diretor Científico</option>
              <option value="Treasurer">Tesoureiro</option>
              <option value="Member">Membro</option>
              <option value="InterviwerMember">Entrevistador</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:w-32">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Todos</option>
              <option value="Active">Ativos</option>
              <option value="Inactive">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    {user.isActive ? (
                      <UserCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <UserX className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(user)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>{user.contactInfo}</span>
              </div>
              <div className="pt-2">
                <span className="text-xs text-gray-500">
                  Ingressou: {new Date(user.joinDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

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
        <UserModal
          onSave={handleAddUser}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingUser && (
        <UserModal
          user={editingUser}
          onSave={handleUpdateUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};

export default MembersTab;