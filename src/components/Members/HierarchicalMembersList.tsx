import React, { useState, useMemo } from 'react';
import { Users, Crown, Shield, Calendar, MessageSquare, BookOpen, DollarSign, User, ChevronDown, ChevronRight, Eye, EyeOff, Edit, UserCheck, UserX, Phone, Mail, Hash, CreditCard } from 'lucide-react';
import { User as UserType } from '../../types';

interface HierarchicalMembersListProps {
  users: UserType[];
  onEditMember: (user: UserType) => void;
  canManageMembers: boolean;
}

const HierarchicalMembersList: React.FC<HierarchicalMembersListProps> = ({ 
  users, 
  onEditMember, 
  canManageMembers 
}) => {
  const [showInactiveMembers, setShowInactiveMembers] = useState(false);

  const getRoleIcon = (role: string) => {
    const icons = {
      'President': Crown,
      'Vice-President': Shield,
      'Director of Events': Calendar,
      'Director of Communications': MessageSquare,
      'Scientific Director': BookOpen,
      'Treasurer': DollarSign,
      'Member': User
    };
    return icons[role as keyof typeof icons] || User;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'President': 'bg-purple-100 text-purple-800 border-purple-200',
      'Vice-President': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Director of Events': 'bg-blue-100 text-blue-800 border-blue-200',
      'Director of Communications': 'bg-green-100 text-green-800 border-green-200',
      'Scientific Director': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Treasurer': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Member': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRoleOrder = (role: string): number => {
    const order = {
      'President': 1,
      'Vice-President': 2,
      'Treasurer': 3,
      'Director of Events': 4,
      'Director of Communications': 5,
      'Scientific Director': 6,
      'Member': 7
    };
    return order[role as keyof typeof order] || 8;
  };

  const { activeMembers, inactiveMembers } = useMemo(() => {
    const active = users.filter(user => user.isActive);
    const inactive = users.filter(user => !user.isActive);
    
    // Sort both groups by role hierarchy, then by name
    const sortUsers = (userList: UserType[]) => 
      userList.sort((a, b) => {
        const roleOrderA = getRoleOrder(a.role);
        const roleOrderB = getRoleOrder(b.role);
        
        if (roleOrderA !== roleOrderB) {
          return roleOrderA - roleOrderB;
        }
        
        return a.name.localeCompare(b.name);
      });

    return {
      activeMembers: sortUsers(active),
      inactiveMembers: sortUsers(inactive)
    };
  }, [users]);

  const formatCPF = (cpf: string) => {
    if (!cpf) return 'Não informado';
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Não informado';
    return phone;
  };

  const MemberCard: React.FC<{ user: UserType; isInactive?: boolean }> = ({ user, isInactive = false }) => {
    const [showDetails, setShowDetails] = useState(false);
    const RoleIcon = getRoleIcon(user.role);

    return (
      <div className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
        isInactive ? 'opacity-75 border-gray-300' : 'border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{user.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                    <RoleIcon className="w-4 h-4 mr-1" />
                    {user.role}
                  </span>
                  {user.isActive ? (
                    <UserCheck className="w-4 h-4 text-green-500" title="Ativo" />
                  ) : (
                    <UserX className="w-4 h-4 text-red-500" title="Inativo" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
              >
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {canManageMembers && (
                <button
                  onClick={() => onEditMember(user)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Editar membro"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>{formatPhone(user.contactInfo)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Membro desde: {new Date(user.joinDate).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Detailed Info (Collapsible) */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">CPF:</span>
                    <span className="font-medium">{formatCPF(user.cpf || '')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Matrícula:</span>
                    <span className="font-medium">{user.studentId || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Nascimento:</span>
                    <span className="font-medium">
                      {user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Instituição:</span>
                    <span className="font-medium">{user.institution || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Período:</span>
                    <span className="font-medium">{user.period || 'Não informado'}</span>
                  </div>
                  {user.twoFAEnabled && (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">2FA Ativo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Active Members */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <Users className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Membros Ativos ({activeMembers.length})
          </h2>
        </div>
        
        {activeMembers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum membro ativo encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeMembers.map(user => (
              <MemberCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* Inactive Members (Collapsible) */}
      {inactiveMembers.length > 0 && (
        <div>
          <button
            onClick={() => setShowInactiveMembers(!showInactiveMembers)}
            className="flex items-center space-x-3 mb-4 p-3 w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {showInactiveMembers ? (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            )}
            <UserX className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Membros Inativos ({inactiveMembers.length})
            </h2>
          </button>
          
          {showInactiveMembers && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {inactiveMembers.map(user => (
                <MemberCard key={user.id} user={user} isInactive />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HierarchicalMembersList;