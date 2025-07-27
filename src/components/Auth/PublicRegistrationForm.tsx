import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Calendar, Hash, CreditCard, Building, GraduationCap, FileText, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface RegistrationFormData {
  fullName: string;
  email: string;
  birthDate: string;
  studentId: string;
  cpf: string;
  institution: string;
  period: string;
  motivationLetter: string;
}

interface PublicRegistrationFormProps {
  onBack: () => void;
}

export const PublicRegistrationForm: React.FC<PublicRegistrationFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    birthDate: '',
    studentId: '',
    cpf: '',
    institution: '',
    period: '',
    motivationLetter: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Nome completo é obrigatório';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      if (!formData.birthDate) {
        newErrors.birthDate = 'Data de nascimento é obrigatória';
      }
    }

    if (step === 2) {
      if (!formData.studentId.trim()) {
        newErrors.studentId = 'Matrícula é obrigatória';
      }
      if (!formData.cpf.trim()) {
        newErrors.cpf = 'CPF é obrigatório';
      } else if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      }
      if (!formData.institution.trim()) {
        newErrors.institution = 'Instituição é obrigatória';
      }
      if (!formData.period.trim()) {
        newErrors.period = 'Período é obrigatório';
      }
    }

    if (step === 3) {
      if (!formData.motivationLetter.trim()) {
        newErrors.motivationLetter = 'Carta de motivação é obrigatória';
      } else if (formData.motivationLetter.length < 100) {
        newErrors.motivationLetter = 'Carta de motivação deve ter pelo menos 100 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          birth_date: formData.birthDate,
          student_id: formData.studentId,
          cpf: formData.cpf.replace(/\D/g, ''),
          institution: formData.institution,
          period: formData.period,
          motivation_letter: formData.motivationLetter,
          status: 'Pending'
        });

      if (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error('Erro ao enviar inscrição. Tente novamente.');
        }
        return;
      }

      toast.success('Inscrição enviada com sucesso! Aguarde o contato da nossa equipe.');
      onBack();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
                  placeholder="Seu nome completo"
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
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
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
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.birthDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.birthDate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
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
                Instituição de Ensino *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.institution ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nome da universidade/faculdade"
                />
              </div>
              {errors.institution && (
                <p className="mt-1 text-sm text-red-600">{errors.institution}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período Atual *
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.period}
                  onChange={(e) => handleInputChange('period', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.period ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione o período</option>
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
              {errors.period && (
                <p className="mt-1 text-sm text-red-600">{errors.period}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carta de Motivação *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.motivationLetter}
                  onChange={(e) => handleInputChange('motivationLetter', e.target.value)}
                  rows={8}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.motivationLetter ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Conte-nos por que você quer fazer parte da LAFAC. Descreva suas motivações, experiências relevantes e como você pode contribuir para a liga acadêmica..."
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.motivationLetter ? (
                  <p className="text-sm text-red-600">{errors.motivationLetter}</p>
                ) : (
                  <p className="text-sm text-gray-500">Mínimo de 100 caracteres</p>
                )}
                <p className="text-sm text-gray-500">
                  {formData.motivationLetter.length}/100
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sua inscrição será analisada pela nossa equipe</li>
                <li>• Você será contatado assim que as inscrições terminarem</li>
                <li>• O processo inclui teste e entrevista</li>
                <li>• Os dados pessoais coletados durante o processo seletivo são tratados em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Processo Seletivo LAFAC</h1>
          <p className="text-gray-600">Inscreva-se para fazer parte da nossa liga acadêmica</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Etapa {currentStep} de {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% concluído
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit}>
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={currentStep === 1 ? onBack : handlePrevious}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{currentStep === 1 ? 'Voltar ao Login' : 'Anterior'}</span>
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all"
                >
                  <span>Próximo</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Inscrição</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Dúvidas? Entre em contato conosco através do email{' '}
            <a href="mailto:contato@lafac.org" className="text-blue-600 hover:text-blue-700">
              contato@lafac.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};