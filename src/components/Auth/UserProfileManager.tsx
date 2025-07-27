import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Lock, Eye, EyeOff, Save, Upload, Camera, AlertTriangle, CheckCircle, Smartphone, Monitor, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import TwoFactorSetup from './TwoFactorSetup';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  contactInfo: string;
  birthDate?: string;
  studentId?: string;
  cpf?: string;
  institution?: string;
  period?: string;
  profilePicture?: string;
  twoFAEnabled: boolean;
  isActive: boolean;
  joinDate: string;
  lastLogin?: string;
  loginCount?: number;
}

interface SecuritySettings {
  passwordChangeRequired: boolean;
  sessionTimeout: number;
  ipRestrictions: string[];
  allowedDevices: string[];
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

const UserProfileManager: React.FC = () => {
  const { user, logout, setup2FA, verify2FA, disable2FA, changePassword, getTrustedDevices, trustDevice, revokeTrustedDevice } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile states
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [originalProfileData, setOriginalProfileData] = useState<UserProfile | null>(null);
  
  // Security states
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordChangeRequired: false,
    sessionTimeout: 30,
    ipRestrictions: [],
    allowedDevices: []
  });
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Activity states
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadSecuritySettings();
      loadActivityLogs();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const profile: UserProfile = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        contactInfo: data.contact_info || '',
        birthDate: data.birth_date,
        studentId: data.student_id,
        cpf: data.cpf,
        institution: data.institution,
        period: data.period,
        profilePicture: data.profile_picture,
        twoFAEnabled: data.two_fa_enabled || false,
        isActive: data.is_active,
        joinDate: data.join_date,
        lastLogin: data.last_login,
        loginCount: data.login_count || 0
      };

      setProfileData(profile);
      setOriginalProfileData(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erro ao carregar perfil');
    }
  };

  const loadSecuritySettings = async () => {
    // Mock security settings - in production, load from database
    setSecuritySettings({
      passwordChangeRequired: false,
      sessionTimeout: 30,
      ipRestrictions: [],
      allowedDevices: ['Current Device']
    });
  };

  const loadActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_attempts')
        .select('*')
        .eq('user_id', user?.id)
        .order('attempted_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const logs: ActivityLog[] = (data || []).map(attempt => ({
        id: attempt.id,
        action: attempt.success ? 'Login' : 'Failed Login',
        timestamp: attempt.attempted_at,
        ipAddress: attempt.ip_address,
        userAgent: attempt.user_agent || 'Unknown',
        success: attempt.success
      }));

      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    }
  };

  const handleProfileSave = async () => {
    if (!profileData || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          contact_info: profileData.contactInfo,
          birth_date: profileData.birthDate,
          student_id: profileData.studentId,
          cpf: profileData.cpf,
          institution: profileData.institution,
          period: profileData.period,
          profile_picture: profileData.profilePicture,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setOriginalProfileData(profileData);
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Nova senha e confirmação não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Nova senha deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        toast.success('Senha alterada com sucesso!');
        setShowPasswordChange(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      toast.error('Erro interno do servidor');
    }
  };

  const filteredActivityLogs = activityLogs.filter(log => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'success') return log.success;
    if (activityFilter === 'failed') return !log.success;
    return true;
  });

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h atrás`;
    return `${Math.floor(diffInHours / 24)}d atrás`;
  };

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
            {profileData.profilePicture ? (
              <img src={profileData.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-xl">
                {profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
            <p className="text-gray-600">{profileData.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {profileData.role}
              </span>
              {profileData.twoFAEnabled && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  2FA Ativo
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', name: 'Perfil', icon: User },
              { id: 'security', name: 'Segurança', icon: Shield },
              { id: 'activity', name: 'Atividade', icon: Clock }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Informações do Perfil</h3>
                <div className="space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setProfileData(originalProfileData);
                          setIsEditing(false);
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleProfileSave}
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Editar Perfil
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={profileData.contactInfo}
                    onChange={(e) => setProfileData({ ...profileData, contactInfo: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                  <input
                    type="date"
                    value={profileData.birthDate || ''}
                    onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Matrícula</label>
                  <input
                    type="text"
                    value={profileData.studentId || ''}
                    onChange={(e) => setProfileData({ ...profileData, studentId: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                  <input
                    type="text"
                    value={profileData.cpf || ''}
                    onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instituição</label>
                  <input
                    type="text"
                    value={profileData.institution || ''}
                    onChange={(e) => setProfileData({ ...profileData, institution: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                  <input
                    type="text"
                    value={profileData.period || ''}
                    onChange={(e) => setProfileData({ ...profileData, period: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Account Info */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Informações da Conta</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Membro desde:</span>
                    <p className="font-medium">{new Date(profileData.joinDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Último login:</span>
                    <p className="font-medium">
                      {profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total de logins:</span>
                    <p className="font-medium">{profileData.loginCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Configurações de Segurança</h3>

              {/* Password Change */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Senha</h4>
                    <p className="text-sm text-gray-600">Altere sua senha regularmente para manter sua conta segura</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Alterar Senha
                  </button>
                </div>

                {showPasswordChange && (
                  <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handlePasswordChange}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirmar Alteração
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Two-Factor Authentication */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Autenticação em Duas Etapas
                    </h4>
                    <p className="text-sm text-gray-600">
                      {profileData.twoFAEnabled 
                        ? 'Sua conta está protegida com 2FA' 
                        : 'Adicione uma camada extra de segurança à sua conta'
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {profileData.twoFAEnabled && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ativo
                      </span>
                    )}
                    <button
                      onClick={() => profileData.twoFAEnabled ? disable2FA('') : setShow2FASetup(true)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        profileData.twoFAEnabled
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {profileData.twoFAEnabled ? 'Desabilitar' : 'Configurar'} 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Atividade da Conta</h3>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as atividades</option>
                  <option value="success">Sucessos</option>
                  <option value="failed">Falhas</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredActivityLogs.map(log => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium text-gray-900">{log.action}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{log.ipAddress}</p>
                        <p className="truncate max-w-xs">{log.userAgent}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredActivityLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma atividade encontrada</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <TwoFactorSetup
          onComplete={() => {
            setShow2FASetup(false);
            loadUserProfile();
          }}
          onCancel={() => setShow2FASetup(false)}
        />
      )}
    </div>
  );
};

export default UserProfileManager;