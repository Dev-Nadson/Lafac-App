import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, FileText, Star, MessageSquare, Calculator, Settings, Users, Power, PowerOff, Calendar, User, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Candidate, CandidateStatus, ScoreWeights } from '../../types';
import toast from 'react-hot-toast';

interface Registration {
  id: string;
  fullName: string;
  email: string;
  birthDate: string;
  studentId: string;
  cpf: string;
  institution: string;
  period: string;
  motivationLetter?: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  interviewDate?: string;
  interviewer1Id?: string;
  interviewer2Id?: string;
  testScore?: number;
  interview1Score?: number;
  interview2Score?: number;
  finalScore?: number;
  assignedRole?: string;
  notes?: string;
  createdAt: string;
}

interface InterviewerPermission {
  userId: string;
  userName: string;
  hasPermission: boolean;
  expiresAt?: string;
}

const SelectionProcessTab: React.FC = () => {
  const { candidates, addCandidate, updateCandidate, scoreWeights, updateScoreWeights, users, addNotification } = useData();
  const { user, checkPermission } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [showInterviewersModal, setShowInterviewersModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectionProcessOpen, setSelectionProcessOpen] = useState(false);
  const [interviewerPermissions, setInterviewerPermissions] = useState<InterviewerPermission[]>([]);
  const [isTogglingProcess, setIsTogglingProcess] = useState(false);
  const [newWeights, setNewWeights] = useState<ScoreWeights>({ testWeight: 40, interviewWeight: 60 });
  const [hasInterviewerPermission, setHasInterviewerPermission] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Check if user can manage selection process
  const canManageProcess = user?.role === 'President' || user?.role === 'Vice-President' || user?.role === 'Superadmin';
  const canInterview = hasInterviewerPermission || canManageProcess;

  // Load selection process status and registrations
  useEffect(() => {
    checkAccess();
  }, [user]);

  useEffect(() => {
    if (hasAccess) {
      loadSelectionProcessStatus();
      loadRegistrations();
      loadInterviewerPermissions();
      checkUserInterviewerPermission();
      setNewWeights(scoreWeights);
    }
  }, [scoreWeights, user, hasAccess]);

  const checkAccess = async () => {
    if (!user) {
      setHasAccess(false);
      return;
    }

    // Always allow executives
    if (canManageProcess) {
      setHasAccess(true);
      return;
    }

    // Check if user has interviewer permission
    try {
      const { data } = await supabase
        .rpc('has_interviewer_permission', { user_id: user.id });
      
      const hasPermission = data || false;
      setHasInterviewerPermission(hasPermission);
      setHasAccess(hasPermission);
    } catch (error) {
      console.error('Error checking interviewer permission:', error);
      setHasAccess(false);
    }
  };

  const checkUserInterviewerPermission = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .rpc('has_interviewer_permission', { user_id: user.id });
      
      setHasInterviewerPermission(data || false);
    } catch (error) {
      console.error('Error checking interviewer permission:', error);
      setHasInterviewerPermission(false);
    }
  };

  // Show access denied if user doesn't have permission
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar o processo seletivo. Apenas Presidente, Vice-Presidente e entrevistadores autorizados podem acessar esta área.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const loadSelectionProcessStatus = async () => {
    try {
      // First check localStorage for immediate response
      const cachedStatus = localStorage.getItem('lafac_selection_process_open');
      if (cachedStatus !== null) {
        const cached = JSON.parse(cachedStatus);
        setSelectionProcessOpen(cached);
        
        // Also update global localStorage for login form
        window.dispatchEvent(new CustomEvent('selectionProcessStatusChanged', { 
          detail: { isOpen: cached } 
        }));
      }

      // Then try to fetch from database with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      );

      const dbPromise = supabase
        .from('site_settings')
        .select('selection_process_open')
        .maybeSingle();

      try {
        const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

        if (error) {
          console.warn('Database error, using cached status:', error);
          return;
        }

        const dbStatus = data?.selection_process_open;
        if (dbStatus !== undefined && dbStatus !== null) {
          setSelectionProcessOpen(dbStatus);
          
          // Update localStorage and notify other components
          localStorage.setItem('lafac_selection_process_open', JSON.stringify(dbStatus));
          window.dispatchEvent(new CustomEvent('selectionProcessStatusChanged', { 
            detail: { isOpen: dbStatus } 
          }));
        }
        
      } catch (dbError) {
        console.warn('Database connection failed, using cached status:', dbError);
        // Keep using cached status if database fails
      }
    } catch (error) {
      console.error('Error loading selection process status:', error);
      // Default to false if everything fails
      setSelectionProcessOpen(false);
      localStorage.setItem('lafac_selection_process_open', 'false');
    }
  };

  const loadRegistrations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading registrations:', error);
        toast.error('Erro ao carregar inscrições');
        return;
      }

      const formattedRegistrations: Registration[] = (data || []).map(reg => ({
        id: reg.id,
        fullName: reg.full_name,
        email: reg.email,
        birthDate: reg.birth_date,
        studentId: reg.student_id,
        cpf: reg.cpf,
        institution: reg.institution,
        period: reg.period,
        motivationLetter: reg.motivation_letter,
        status: reg.status,
        interviewDate: reg.interview_date,
        interviewer1Id: reg.interviewer_1_id,
        interviewer2Id: reg.interviewer_2_id,
        testScore: reg.test_score,
        interview1Score: reg.interview_1_score,
        interview2Score: reg.interview_2_score,
        finalScore: reg.final_score,
        assignedRole: reg.assigned_role,
        notes: reg.notes,
        createdAt: reg.created_at
      }));

      setRegistrations(formattedRegistrations);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Erro ao carregar inscrições');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInterviewerPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select(`
          user_id,
          expires_at,
          is_active,
          users:user_id (name)
        `)
        .eq('permission_name', 'interview_access')
        .eq('resource', 'candidates');

      if (error) {
        console.error('Error loading interviewer permissions:', error);
        return;
      }

      const permissions: InterviewerPermission[] = users.map(u => {
        const permission = data?.find(p => p.user_id === u.id);
        return {
          userId: u.id,
          userName: u.name,
          hasPermission: permission?.is_active || false,
          expiresAt: permission?.expires_at
        };
      });

      setInterviewerPermissions(permissions);
    } catch (error) {
      console.error('Error loading interviewer permissions:', error);
    }
  };

  const toggleSelectionProcess = async () => {
    if (!canManageProcess) {
      toast.error('Apenas Presidente e Vice-Presidente podem gerenciar o processo seletivo');
      return;
    }

    setIsTogglingProcess(true);
    const newStatus = !selectionProcessOpen;
    
    try {
      // Update local state immediately for better UX
      setSelectionProcessOpen(newStatus);
      localStorage.setItem('lafac_selection_process_open', JSON.stringify(newStatus));
      
      // Notify other components immediately
      window.dispatchEvent(new CustomEvent('selectionProcessStatusChanged', { 
        detail: { isOpen: newStatus } 
      }));

      // Then try to update database
      const { data: currentSettings, error: fetchError } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching site settings:', fetchError);
        toast.warning('Status atualizado localmente. Erro ao sincronizar com servidor.');
        return;
      }

      let updateError;
      if (currentSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            selection_process_open: newStatus,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSettings.id);
        updateError = error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({
            selection_process_open: newStatus,
            updated_by: user?.id,
            updated_at: new Date().toISOString()
          });
        updateError = error;
      }

      if (updateError) {
        console.error('Error updating selection process status:', updateError);
        toast.warning('Status atualizado localmente. Erro ao sincronizar com servidor.');
        return;
      }

      // Log security event (optional, don't fail if this fails)
      try {
        await supabase
          .from('security_logs')
          .insert({
            user_id: user?.id,
            action: 'selection_process_toggled',
            resource: 'site_settings',
            details: {
              new_status: newStatus,
              previous_status: !newStatus
            },
            risk_level: 'medium'
          });
      } catch (logError) {
        console.warn('Failed to log security event:', logError);
      }

      toast.success(`Processo seletivo ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Error toggling selection process:', error);
      // Revert local state if database update failed
      setSelectionProcessOpen(!newStatus);
      localStorage.setItem('lafac_selection_process_open', JSON.stringify(!newStatus));
      window.dispatchEvent(new CustomEvent('selectionProcessStatusChanged', { 
        detail: { isOpen: !newStatus } 
      }));
      toast.error('Erro ao alterar status do processo seletivo');
    } finally {
      setIsTogglingProcess(false);
    }
  };

  const handleUpdateScoreWeights = async () => {
    if (!canManageProcess) {
      toast.error('Apenas Presidente e Vice-Presidente podem alterar os pesos');
      return;
    }

    if (newWeights.testWeight + newWeights.interviewWeight !== 100) {
      toast.error('A soma dos pesos deve ser igual a 100%');
      return;
    }

    try {
      await updateScoreWeights(newWeights);
      toast.success('Pesos atualizados com sucesso!');
      setShowWeightsModal(false);
    } catch (error) {
      console.error('Error updating score weights:', error);
      toast.error('Erro ao atualizar pesos');
    }
  };

  const grantInterviewerPermission = async (userId: string, expiresAt?: string) => {
    if (!canManageProcess) {
      toast.error('Apenas Presidente e Vice-Presidente podem gerenciar permissões');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('grant_interviewer_permission', {
          target_user_id: userId,
          granted_by_user_id: user?.id,
          expires_at: expiresAt
        });

      if (error) {
        console.error('Error granting permission:', error);
        toast.error('Erro ao conceder permissão');
        return;
      }

      if (!data) {
        toast.error('Você não tem permissão para conceder acesso de entrevistador');
        return;
      }

      await loadInterviewerPermissions();
      
      // Send notification to user
      const targetUser = users.find(u => u.id === userId);
      if (targetUser) {
        await addNotification({
          userId: userId,
          title: 'Permissão de Entrevistador Concedida',
          message: 'Você foi designado como entrevistador para o processo seletivo.',
          type: 'System',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Permissão de entrevistador concedida com sucesso!');
    } catch (error) {
      console.error('Error granting permission:', error);
      toast.error('Erro ao conceder permissão');
    }
  };

  const revokeInterviewerPermission = async (userId: string) => {
    if (!canManageProcess) {
      toast.error('Apenas Presidente e Vice-Presidente podem gerenciar permissões');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('revoke_interviewer_permission', {
          target_user_id: userId,
          revoked_by_user_id: user?.id
        });

      if (error) {
        console.error('Error revoking permission:', error);
        toast.error('Erro ao revogar permissão');
        return;
      }

      if (!data) {
        toast.error('Você não tem permissão para revogar acesso de entrevistador');
        return;
      }

      await loadInterviewerPermissions();
      toast.success('Permissão de entrevistador revogada com sucesso!');
    } catch (error) {
      console.error('Error revoking permission:', error);
      toast.error('Erro ao revogar permissão');
    }
  };

  const updateRegistrationStatus = async (registrationId: string, newStatus: Registration['status']) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', registrationId);

      if (error) throw error;

      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: newStatus } : reg
      ));

      // Send notification to applicant
      const registration = registrations.find(r => r.id === registrationId);
      if (registration) {
        const statusMessages = {
          'Pending': 'Sua inscrição está sendo analisada.',
          'Under Review': 'Sua inscrição está em análise detalhada.',
          'Approved': 'Parabéns! Sua inscrição foi aprovada.',
          'Rejected': 'Infelizmente sua inscrição não foi aprovada desta vez.'
        };

        // Note: In a real app, you'd need to create a user account for the applicant first
        // For now, we'll just log this action
        console.log(`Would send notification to ${registration.email}: ${statusMessages[newStatus]}`);
      }

      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const scheduleInterview = async (registrationId: string, interviewData: any) => {
    try {
      // Ensure interviewData is properly structured
      if (!interviewData || !interviewData.date) {
        toast.error('Data da entrevista é obrigatória');
        return;
      }

      const { error } = await supabase
        .from('registrations')
        .update({
          interview_date: interviewData.date,
          interviewer_1_id: interviewData.interviewer1 || null,
          interviewer_2_id: interviewData.interviewer2 || null,
          test_score: interviewData.testScore || null,
          interview_1_score: interviewData.interview1Score || null,
          interview_2_score: interviewData.interview2Score || null,
          notes: interviewData.notes || null,
          status: 'Under Review'
        })
        .eq('id', registrationId);

      if (error) throw error;

      await loadRegistrations();
      
      // Notifications will be sent automatically via the database trigger
      toast.success('Entrevista agendada com sucesso!');
      setShowScheduleModal(false);
      setSelectedRegistration(null);
    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast.error('Erro ao agendar entrevista');
    }
  };

  const getStatusColor = (status: CandidateStatus | Registration['status']) => {
    const colors = {
      'Under Evaluation': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Under Review': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Pending Documents': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: Registration['status']) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      case 'Under Review': return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const calculateFinalScore = (candidate: Candidate) => {
    if (!candidate.testScore || candidate.interviewScores.length === 0) return null;
    
    const avgInterviewScore = candidate.interviewScores.reduce((sum, score) => sum + score.score, 0) / candidate.interviewScores.length;
    
    return (candidate.testScore * scoreWeights.testWeight / 100) + (avgInterviewScore * scoreWeights.interviewWeight / 100);
  };

  const filteredCandidates = candidates.filter(candidate => 
    statusFilter === 'All' || candidate.status === statusFilter
  );

  // Component for managing score weights
  const ScoreWeightsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Configurar Pesos das Notas
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso do Teste (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={newWeights.testWeight}
                onChange={(e) => setNewWeights({
                  ...newWeights,
                  testWeight: parseInt(e.target.value) || 0,
                  interviewWeight: 100 - (parseInt(e.target.value) || 0)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso da Entrevista (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={newWeights.interviewWeight}
                onChange={(e) => setNewWeights({
                  ...newWeights,
                  interviewWeight: parseInt(e.target.value) || 0,
                  testWeight: 100 - (parseInt(e.target.value) || 0)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Fórmula:</strong> Nota Final = (Teste × {newWeights.testWeight}%) + (Entrevista × {newWeights.interviewWeight}%)
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Total: {newWeights.testWeight + newWeights.interviewWeight}% 
                {newWeights.testWeight + newWeights.interviewWeight !== 100 && (
                  <span className="text-red-600 ml-1">(deve ser 100%)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleUpdateScoreWeights}
              disabled={newWeights.testWeight + newWeights.interviewWeight !== 100}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Salvar Pesos
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Component for adding candidates
  const CandidateModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      positionApplied: '',
      testScore: '',
      status: 'Under Evaluation' as CandidateStatus
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        await addCandidate({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          positionApplied: formData.positionApplied,
          documents: [],
          testScore: formData.testScore ? parseInt(formData.testScore) : undefined,
          interviewScores: [],
          status: formData.status,
          comments: [],
          createdAt: new Date().toISOString()
        });
        
        toast.success('Candidato adicionado com sucesso!');
        onClose();
      } catch (error) {
        console.error('Error adding candidate:', error);
        toast.error('Erro ao adicionar candidato');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Adicionar Candidato
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posição Aplicada</label>
              <input
                type="text"
                value={formData.positionApplied}
                onChange={(e) => setFormData({...formData, positionApplied: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota do Teste</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.testScore}
                onChange={(e) => setFormData({...formData, testScore: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as CandidateStatus})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Under Evaluation">Em Avaliação</option>
                <option value="Approved">Aprovado</option>
                <option value="Rejected">Rejeitado</option>
                <option value="Pending Documents">Documentos Pendentes</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Adicionar Candidato
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
    );
  };

  // Component for managing interviewers
  const ManageInterviewersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [expirationDate, setExpirationDate] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gerenciar Entrevistadores
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Expiração (Opcional)
                </label>
                <input
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Usuários e Permissões
                </label>
                {interviewerPermissions.map(permission => (
                  <div key={permission.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{permission.userName}</span>
                      {permission.expiresAt && (
                        <span className="text-sm text-gray-500 ml-2">
                          Expira: {new Date(permission.expiresAt).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        permission.hasPermission ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {permission.hasPermission ? 'Ativo' : 'Inativo'}
                      </span>
                      {permission.hasPermission ? (
                        <button
                          onClick={() => revokeInterviewerPermission(permission.userId)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Revogar
                        </button>
                      ) : (
                        <button
                          onClick={() => grantInterviewerPermission(permission.userId, expirationDate || undefined)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Conceder
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Component for scheduling interviews
  const ScheduleInterviewModal: React.FC<{ 
    registration: Registration; 
    onSchedule: (data: any) => void; 
    onClose: () => void; 
  }> = ({ registration, onSchedule, onClose }) => {
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewer1, setInterviewer1] = useState('');
    const [interviewer2, setInterviewer2] = useState('');
    const [testScore, setTestScore] = useState(registration.testScore?.toString() || '');
    const [interview1Score, setInterview1Score] = useState(registration.interview1Score?.toString() || '');
    const [interview2Score, setInterview2Score] = useState(registration.interview2Score?.toString() || '');
    const [notes, setNotes] = useState(registration.notes || '');

    const availableInterviewers = users.filter(u => 
      u.isActive && (
        canManageProcess || 
        interviewerPermissions.find(p => p.userId === u.id)?.hasPermission
      )
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate required fields
      if (!interviewDate) {
        toast.error('Data da entrevista é obrigatória');
        return;
      }

      if (!interviewer1) {
        toast.error('Pelo menos um entrevistador deve ser selecionado');
        return;
      }

      // Prepare data with proper null handling
      const interviewData = {
        date: interviewDate,
        interviewer1: interviewer1 || null,
        interviewer2: interviewer2 || null,
        testScore: testScore ? Number(testScore) : null,
        interview1Score: interview1Score ? Number(interview1Score) : null,
        interview2Score: interview2Score ? Number(interview2Score) : null,
        notes: notes || null
      };

      onSchedule(interviewData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Agendar Entrevista - {registration.fullName}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora da Entrevista *</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entrevistador 1 *</label>
                  <select
                    value={interviewer1}
                    onChange={(e) => setInterviewer1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecionar entrevistador</option>
                    {availableInterviewers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entrevistador 2</label>
                  <select
                    value={interviewer2}
                    onChange={(e) => setInterviewer2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecionar entrevistador</option>
                    {availableInterviewers.filter(u => u.id !== interviewer1).map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {canInterview && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota do Teste</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={testScore}
                        onChange={(e) => setTestScore(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!canManageProcess}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota Entrevista 1</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={interview1Score}
                        onChange={(e) => setInterview1Score(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota Entrevista 2</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={interview2Score}
                        onChange={(e) => setInterview2Score(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Observações sobre o candidato..."
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Agendar Entrevista
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
          <UserCheck className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Processo Seletivo</h1>
          {hasInterviewerPermission && !canManageProcess && (
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
              Entrevistador
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          {canManageProcess && (
            <>
              <button
                onClick={() => setShowInterviewersModal(true)}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Entrevistadores
              </button>
              <button
                onClick={toggleSelectionProcess}
                disabled={isTogglingProcess}
                className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectionProcessOpen 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isTogglingProcess ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    {selectionProcessOpen ? <PowerOff className="w-4 h-4 mr-2" /> : <Power className="w-4 h-4 mr-2" />}
                    {selectionProcessOpen ? 'Desativar' : 'Ativar'} Processo
                  </>
                )}
              </button>
            </>
          )}
          <button
            onClick={() => setShowWeightsModal(true)}
            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Pesos
          </button>
          {canManageProcess && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Candidato
            </button>
          )}
        </div>
      </div>

      {/* Selection Process Status */}
      <div className={`border rounded-lg p-4 ${
        selectionProcessOpen 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          {selectionProcessOpen ? (
            <Power className="w-5 h-5 text-green-600" />
          ) : (
            <PowerOff className="w-5 h-5 text-red-600" />
          )}
          <h3 className={`font-medium ${
            selectionProcessOpen ? 'text-green-900' : 'text-red-900'
          }`}>
            Processo Seletivo {selectionProcessOpen ? 'ATIVO' : 'INATIVO'}
          </h3>
        </div>
        <p className={`text-sm ${
          selectionProcessOpen ? 'text-green-800' : 'text-red-800'
        }`}>
          {selectionProcessOpen 
            ? 'O processo seletivo está aberto para inscrições públicas.'
            : 'O processo seletivo está fechado. Nenhuma nova inscrição será aceita.'
          }
        </p>
      </div>

      {/* Score Weights Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Pesos Atuais das Notas</h3>
        </div>
        <div className="text-sm text-blue-800">
          Teste: {scoreWeights.testWeight}% • Entrevista: {scoreWeights.interviewWeight}%
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Nota Final = (Teste × {scoreWeights.testWeight}%) + (Média Entrevista × {scoreWeights.interviewWeight}%)
        </div>
      </div>

      {/* Registrations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando inscrições...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma inscrição encontrada</h3>
            <p className="text-gray-500">As inscrições aparecerão aqui quando os usuários se registrarem.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {registrations.map(registration => (
              <div key={registration.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{registration.fullName}</h3>
                    <p className="text-sm text-gray-600">{registration.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                        {getStatusIcon(registration.status)}
                        <span className="ml-1">{registration.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div><strong>Instituição:</strong> {registration.institution}</div>
                  <div><strong>Período:</strong> {registration.period}</div>
                  <div><strong>Matrícula:</strong> {registration.studentId}</div>
                  <div><strong>Data de Nascimento:</strong> {new Date(registration.birthDate).toLocaleDateString('pt-BR')}</div>
                  
                  {registration.interviewDate && (
                    <div><strong>Entrevista:</strong> {new Date(registration.interviewDate).toLocaleString('pt-BR')}</div>
                  )}
                  
                  {registration.testScore && (
                    <div><strong>Nota do Teste:</strong> {registration.testScore}/100</div>
                  )}
                  
                  {(registration.interview1Score || registration.interview2Score) && (
                    <div>
                      <strong>Notas da Entrevista:</strong> 
                      {registration.interview1Score && ` E1: ${registration.interview1Score}/100`}
                      {registration.interview2Score && ` E2: ${registration.interview2Score}/100`}
                    </div>
                  )}
                  
                  {registration.finalScore && (
                    <div><strong>Nota Final:</strong> {registration.finalScore}/100</div>
                  )}
                </div>

                {registration.motivationLetter && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Carta de Motivação:</h4>
                    <p className="text-sm text-gray-600">{registration.motivationLetter}</p>
                  </div>
                )}

                {registration.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Observações:</h4>
                    <p className="text-sm text-yellow-700">{registration.notes}</p>
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  {canManageProcess && (
                    <select
                      value={registration.status}
                      onChange={(e) => updateRegistrationStatus(registration.id, e.target.value as Registration['status'])}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="Pending">Pendente</option>
                      <option value="Under Review">Em Análise</option>
                      <option value="Approved">Aprovado</option>
                      <option value="Rejected">Rejeitado</option>
                    </select>
                  )}
                  {(canManageProcess || canInterview) && (
                    <button
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowScheduleModal(true);
                      }}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Entrevista
                    </button>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Inscrito em: {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showWeightsModal && (
        <ScoreWeightsModal onClose={() => setShowWeightsModal(false)} />
      )}

      {showInterviewersModal && (
        <ManageInterviewersModal onClose={() => setShowInterviewersModal(false)} />
      )}
      
      {showScheduleModal && selectedRegistration && (
        <ScheduleInterviewModal
          registration={selectedRegistration}
          onSchedule={(data) => scheduleInterview(selectedRegistration.id, data)}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedRegistration(null);
          }}
        />
      )}

      {showAddModal && (
        <CandidateModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
};

export default SelectionProcessTab;