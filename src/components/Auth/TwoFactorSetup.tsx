import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Copy, CheckCircle, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
  const { setup2FA, verify2FA, user } = useAuth();
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    initializeSetup();
  }, []);

  const initializeSetup = async () => {
    try {
      const { secret: generatedSecret, qrCode } = await setup2FA();
      setSecret(generatedSecret);
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error('Erro ao configurar 2FA');
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Código copiado!');
  };

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Digite um código de 6 dígitos');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verify2FA(verificationCode, secret);
      
      if (result.success) {
        toast.success('2FA configurado com sucesso!');
        onComplete();
      } else {
        toast.error(result.error || 'Código inválido');
        setVerificationCode('');
      }
    } catch (error) {
      toast.error('Erro na verificação');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Configurar Autenticação em Duas Etapas
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Adicione uma camada extra de segurança à sua conta
            </p>
          </div>

          {step === 'setup' ? (
            /* Setup Step */
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Instale um aplicativo autenticador (Google Authenticator, Authy, etc.)</li>
                  <li>Escaneie o QR Code abaixo ou digite o código manualmente</li>
                  <li>Digite o código de 6 dígitos gerado pelo aplicativo</li>
                </ol>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Entry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou digite este código manualmente:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={secret}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={copySecret}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copiar código"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={() => setStep('verify')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continuar para Verificação
              </button>
            </div>
          ) : (
            /* Verification Step */
            <div className="space-y-6">
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Verificar Configuração</h4>
                <p className="text-sm text-gray-600">
                  Digite o código de 6 dígitos do seu aplicativo autenticador
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000000"
                  disabled={isVerifying}
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleVerification}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Verificar e Ativar</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setStep('setup')}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  disabled={isVerifying}
                >
                  Voltar
                </button>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Cancelar Configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;