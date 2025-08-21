import React, { useState } from 'react';
import { User, Mail, Phone, CreditCard, Hash, Calendar, GraduationCap, Shield, Eye, EyeOff, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SecureMemberFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  cpf: string;
  studentId: string;
  dateOfBirth: string;
  currentSemester: string;
  status: 'Active' | 'Inactive';
  role: string;
}

interface SecureMemberFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingMember?: any;
}

const SecureMemberForm: React.FC<SecureMemberFormProps> = ({ onClose, onSuccess, editingMember }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SecureMemberFormData>({
    fullName: editingMember?.name || '',
    email: editingMember?.email || '',
    phoneNumber: editingMember?.contactInfo || '',
    cpf: editingMember?.cpf || '',
    studentId: editingMember?.studentId || '',
    dateOfBirth: editingMember?.birthDate || '',
    currentSemester: editingMember?.period || '',
    status: editingMember?.isActive ? 'Active' : 'Inactive' || 'Active',
    role: editingMember?.role || 'Member'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user has permission to add members
  const canAddMembers = user?.role === 'President' || user?.role === 'Vice-President' || user?.role === 'Superadmin';

  if (!canAddMembers) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
            <p className="text-gray-600 mb-4">
              Apenas Presidente e Vice-Presidente podem gerenciar membros.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefone é obrigatório';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Telefone inválido';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Matrícula é obrigatória';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Data de nascimento é obrigatória';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 100) {
        newErrors.dateOfBirth = 'Data de nascimento inválida';
      }
    }

    if (!formData.currentSemester.trim()) {
      newErrors.currentSemester = 'Semestre atual é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleInputChange = (field: keyof SecureMemberFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const defaultPassword = 'lafac2025!';
      
      if (editingMember) {
        // Update existing member
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.fullName,
            email: formData.email,
            contact_info: formData.phoneNumber,
            cpf: formData.cpf.replace(/\D/g, ''),
            student_id: formData.studentId,
            birth_date: formData.dateOfBirth,
            period: formData.currentSemester,
            is_active: formData.status === 'Active',
            role: formData.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id);

        if (error) throw error;
        toast.success('Membro atualizado com sucesso!');
      } else {
        // Create new member with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: defaultPassword,
          options: {
            data: {
              name: formData.fullName,
              role: formData.role
            }
          }
        });

        if (authError) {
          console.error('Auth error:', authError);
          toast.error('Erro ao criar conta de usuário');
          return;
        }

        if (authData.user) {
          // Create user profile in our users table
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              name: formData.fullName,
              email: formData.email,
              role: formData.role,
              contact_info: formData.phoneNumber,
              cpf: formData.cpf.replace(/\D/g, ''),
              student_id: formData.studentId,
              birth_date: formData.dateOfBirth,
              period: formData.currentSemester,
              is_active: formData.status === 'Active',
              join_date: new Date().toISOString().split('T')[0],
              require_password_change: false, // Changed to false - no password change required
              two_fa_enabled: false,
              password_changed_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            toast.error('Erro ao criar perfil do usuário');
            return;
          }

          // Log security event
          await supabase
            .from('security_logs')
            .insert({
              user_id: authData.user.id,
              action: 'member_created',
              resource: 'users',
              details: {
                created_by: user?.id,
                member_role: formData.role,
                default_password_set: true,
                password_change_required: false // Changed to false
              },
              risk_level: 'low'
            });

          toast.success(`Membro criado com sucesso! Senha padrão: ${defaultPassword}`);
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Erro ao salvar membro');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-600" />
              {editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Informações Pessoais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Nome completo do membro"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Informações Acadêmicas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formatCPF(formData.cpf)}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.cpf ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>
                  {errors.cpf && (
                    <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matrícula *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.studentId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Número da matrícula"
                    />
                  </div>
                  {errors.studentId && (
                    <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semestre Atual *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.currentSemester}
                      onChange={(e) => handleInputChange('currentSemester', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.currentSemester ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione o semestre</option>
                      <option value="1º período">1º período</option>
                      <option value="2º período">2º período</option>
                      <option value="3º período">3º período</option>
                      <option value="4º período">4º período</option>
                      <option value="5º período">5º período</option>
                      <option value="6º período">6º período</option>
                      <option value="7º período">7º período</option>
                      <option value="8º período">8º período</option>
                      <option value="9º período">9º período</option>
                      <option value="10º período">10º período</option>
                    </select>
                  </div>
                  {errors.currentSemester && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentSemester}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Função/Cargo *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </div>
            </div>

            {/* Status and Security */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Status e Segurança</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status do Membro
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as 'Active' | 'Inactive')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Ativo</option>
                    <option value="Inactive">Inativo</option>
                  </select>
                </div>

                {!editingMember && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha Padrão
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value="lafac2025!"
                        readOnly
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      O membro pode usar esta senha para fazer login
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {editingMember ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {editingMember ? 'Atualizar Membro' : 'Criar Membro'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
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

export default SecureMemberForm;