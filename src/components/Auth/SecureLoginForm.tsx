import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Lock, Mail, AlertTriangle, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PublicRegistrationForm } from './PublicRegistrationForm';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const SecureLoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectionProcessOpen, setSelectionProcessOpen] = useState(true); // Default to true for better UX
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Check if selection process is open
  useEffect(() => {
    checkSelectionProcessStatus();
    
    // Listen for selection process status changes from other components
    const handleStatusChange = (event: CustomEvent) => {
      setSelectionProcessOpen(event.detail.isOpen);
    };
    
    window.addEventListener('selectionProcessStatusChanged', handleStatusChange as EventListener);
    
    return () => {
      window.removeEventListener('selectionProcessStatusChanged', handleStatusChange as EventListener);
    };
  }, []);

  const checkSelectionProcessStatus = async () => {
    try {
      setIsLoadingSettings(true);
      
      // First check localStorage for immediate response
      const cachedStatus = localStorage.getItem('lafac_selection_process_open');
      if (cachedStatus !== null) {
        const cached = JSON.parse(cachedStatus);
        setSelectionProcessOpen(cached);
        setIsLoadingSettings(false);
      } else {
        // If no cached status, default to open for better UX
        setSelectionProcessOpen(true);
        setIsLoadingSettings(false);
      }

      // Then try to fetch from database with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 3000)
      );

      const dbPromise = supabase
        .from('site_settings')
        .select('selection_process_open')
        .maybeSingle();

      try {
        const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

        if (error) {
          console.warn('Database error, using cached/default status:', error);
          // If database fails, keep current status (cached or default true)
          return;
        }

        const dbStatus = data?.selection_process_open;
        if (dbStatus !== undefined && dbStatus !== null) {
          setSelectionProcessOpen(dbStatus);
          
          // Update localStorage with database value
          localStorage.setItem('lafac_selection_process_open', JSON.stringify(dbStatus));
          
          // Also update global localStorage for other components
          window.dispatchEvent(new CustomEvent('selectionProcessStatusChanged', { 
            detail: { isOpen: dbStatus } 
          }));
        }
        
      } catch (dbError) {
        console.warn('Database connection failed, using cached/default status:', dbError);
        // Keep using cached status or default true if database fails
      }
    } catch (error) {
      console.error('Error checking selection process status:', error);
      // Default to true if everything fails - better for user experience
      setSelectionProcessOpen(true);
      localStorage.setItem('lafac_selection_process_open', 'true');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await login(
        formData.email, 
        formData.password, 
        formData.rememberMe
      );

      if (result.success) {
        toast.success('Login realizado com sucesso!');
      } else {
        toast.error(result.error || 'Erro no login');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro interno do servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Show registration form if requested
  if (showRegistration) {
    return <PublicRegistrationForm onBack={() => setShowRegistration(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden">
            <img 
              src="/WhatsApp Image 2025-07-02 at 21.30.21.jpeg" 
              alt="LAFAC Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LAFAC</h1>
          <p className="text-gray-600">Sistema de Gestão</p>
        </div>

        {/* Selection Process Notice - Always show if not loading */}
        {!isLoadingSettings && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg">
            <div className="text-center">
              <UserPlus className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">
                🎓 Quer fazer parte da LAFAC?
              </h3>
              <p className="text-sm text-emerald-700 mb-3">
                {selectionProcessOpen 
                  ? "Nosso processo seletivo está aberto! Inscreva-se agora e faça parte da nossa liga acadêmica."
                  : "Fique atento! Em breve abriremos um novo processo seletivo. Cadastre-se para ser notificado."
                }
              </p>
              <button
                onClick={() => setShowRegistration(true)}
                className={`w-full text-white py-2 px-4 rounded-lg font-medium transition-all ${
                  selectionProcessOpen 
                    ? 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                }`}
              >
                {selectionProcessOpen ? 'Inscrever-se Agora' : 'Manifestar Interesse'}
              </button>
            </div>
          </div>
        )}

        {/* Loading state for settings */}
        {isLoadingSettings && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">Verificando processo seletivo...</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Acesso ao Sistema</h2>
            <p className="text-sm text-gray-600 mt-1">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="seu.email@exemplo.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Liga Acadêmica de Farmácia Clínica
          </p>
          <div className="mt-2 text-xs text-gray-400">
            <p>Processo seletivo: {selectionProcessOpen ? '🟢 Aberto' : '🔴 Fechado'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureLoginForm;