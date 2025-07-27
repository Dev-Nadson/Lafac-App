import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  twoFAEnabled: boolean;
  requirePasswordChange: boolean;
  lastLogin?: string;
  contactInfo?: string;
  institution?: string;
  birthDate?: string;
  studentId?: string;
  cpf?: string;
  period?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Authentication methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; requires2FA?: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  
  // Password management
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Two-factor authentication
  setup2FA: () => Promise<{ secret: string; qrCode: string }>;
  verify2FA: (token: string, secret?: string) => Promise<{ success: boolean; error?: string }>;
  disable2FA: (password: string) => Promise<{ success: boolean; error?: string }>;
  
  // Session management
  refreshSession: () => Promise<void>;
  checkPermission: (resource: string, action: string) => boolean;
  
  // Security
  getTrustedDevices: () => Promise<any[]>;
  trustDevice: (deviceName: string) => Promise<void>;
  revokeTrustedDevice: (deviceId: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  contactInfo?: string;
  institution?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setUser(null);
        return;
      }

      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        throw error;
      }

      if (data) {
        const userData: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          isActive: data.is_active,
          twoFAEnabled: data.two_fa_enabled || false,
          requirePasswordChange: data.require_password_change || false,
          lastLogin: data.last_login,
          contactInfo: data.contact_info,
          institution: data.institution,
          birthDate: data.birth_date,
          studentId: data.student_id,
          cpf: data.cpf,
          period: data.period,
          profilePicture: data.profile_picture
        };

        setUser(userData);
        
        // Update last login
        await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            login_count: (data.login_count || 0) + 1
          })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // If user doesn't exist in our users table, sign them out
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const login = async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<{ success: boolean; requires2FA?: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Use Supabase authentication for all users
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase auth error:', error);
        
        // Log failed attempt
        await supabase
          .from('auth_attempts')
          .insert({
            email,
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent,
            success: false,
            failure_reason: error.message
          });
        
        return { success: false, error: 'Email ou senha incorretos' };
      }

      if (data.user) {
        // Log successful attempt
        await supabase
          .from('auth_attempts')
          .insert({
            email,
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent,
            success: true,
            user_id: data.user.id
          });

        await loadUserData(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'Erro inesperado durante o login' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Logout realizado com sucesso');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro durante logout');
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'Member'
          }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create user record in our users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            name: userData.name,
            email: userData.email,
            role: userData.role || 'Member',
            contact_info: userData.contactInfo || '',
            institution: userData.institution || '',
            is_active: true,
            join_date: new Date().toISOString().split('T')[0],
            password_changed_at: new Date().toISOString(),
            two_fa_enabled: false,
            require_password_change: false
          });

        if (insertError) {
          console.error('Error creating user record:', insertError);
          return { success: false, error: 'Erro ao criar registro do usuário' };
        }

        toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
        return { success: true };
      }

      return { success: false, error: 'Erro inesperado durante o registro' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const changePassword = async (
    currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Usuário não autenticado' };

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        return { success: false, error: 'Erro ao alterar senha' };
      }

      // Update password change timestamp in our users table
      await supabase
        .from('users')
        .update({ 
          password_changed_at: new Date().toISOString(),
          require_password_change: false
        })
        .eq('id', user.id);

      toast.success('Senha alterada com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        return { success: false, error: 'Erro ao enviar email de recuperação' };
      }

      toast.success('Email de recuperação enviado!');
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const setup2FA = async (): Promise<{ secret: string; qrCode: string }> => {
    // Mock implementation - in production, use a proper 2FA library
    const secret = 'JBSWY3DPEHPK3PXP';
    const qrCode = `otpauth://totp/LAFAC:${user?.email}?secret=${secret}&issuer=LAFAC`;
    return { secret, qrCode };
  };

  const verify2FA = async (token: string, secret?: string): Promise<{ success: boolean; error?: string }> => {
    // Mock implementation - in production, implement proper TOTP verification
    if (token === '123456') {
      if (user && secret) {
        await supabase
          .from('users')
          .update({ 
            two_fa_enabled: true,
            two_fa_secret: secret
          })
          .eq('id', user.id);
        
        setUser({ ...user, twoFAEnabled: true });
      }
      return { success: true };
    }
    return { success: false, error: 'Código inválido' };
  };

  const disable2FA = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Usuário não autenticado' };

      await supabase
        .from('users')
        .update({ 
          two_fa_enabled: false,
          two_fa_secret: null
        })
        .eq('id', user.id);

      setUser({ ...user, twoFAEnabled: false });
      toast.success('2FA desabilitado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('2FA disable error:', error);
      return { success: false, error: 'Erro ao desabilitar 2FA' };
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        return;
      }

      // Session is still valid, refresh user data if needed
      if (session.user && user) {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Superadmin has all permissions
    if (user.role === 'Superadmin') return true;
    
    // Special case for interviewer permissions
    if (resource === 'candidates' && action === 'interview') {
      // This will be checked against the database in the component
      // For now, return true for roles that could potentially be interviewers
      return ['President', 'Vice-President', 'Superadmin', 'Director of Events', 'Director of Communications', 'Scientific Director', 'Treasurer', 'Member'].includes(user.role);
    }
    
    // Role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'President': ['users', 'events', 'posts', 'statistics', 'budget_requests', 'candidates', 'study_groups'],
      'Vice-President': ['users', 'events', 'posts', 'statistics', 'budget_requests', 'candidates', 'study_groups'],
      'Director of Events': ['events'],
      'Director of Communications': ['posts'],
      'Scientific Director': ['study_groups'],
      'Treasurer': ['budget_requests'],
      'Member': []
    };
    
    const allowedResources = rolePermissions[user.role] || [];
    return allowedResources.includes(resource);
  };

  const getTrustedDevices = async (): Promise<any[]> => {
    if (!user) return [];
    
    try {
      const { data } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Error loading trusted devices:', error);
      return [];
    }
  };

  const trustDevice = async (deviceName: string) => {
    if (!user) return;
    
    try {
      const deviceFingerprint = `device-${Date.now()}-${Math.random()}`;
      
      await supabase
        .from('trusted_devices')
        .insert({
          user_id: user.id,
          device_name: deviceName,
          device_fingerprint: deviceFingerprint,
          ip_address: '127.0.0.1', // In production, get real IP
          user_agent: navigator.userAgent,
          is_trusted: true,
          trusted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        });
      
      toast.success('Dispositivo adicionado como confiável!');
    } catch (error) {
      console.error('Error trusting device:', error);
      toast.error('Erro ao adicionar dispositivo');
    }
  };

  const revokeTrustedDevice = async (deviceId: string) => {
    try {
      await supabase
        .from('trusted_devices')
        .delete()
        .eq('id', deviceId);
      
      toast.success('Dispositivo removido!');
    } catch (error) {
      console.error('Error revoking device:', error);
      toast.error('Erro ao remover dispositivo');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      register,
      changePassword,
      resetPassword,
      setup2FA,
      verify2FA,
      disable2FA,
      refreshSession,
      checkPermission,
      getTrustedDevices,
      trustDevice,
      revokeTrustedDevice
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};