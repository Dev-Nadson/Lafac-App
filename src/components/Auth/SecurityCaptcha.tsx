import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Shield } from 'lucide-react';

interface SecurityCaptchaProps {
  onVerify: (token: string) => void;
  onError: (error: string) => void;
}

const SecurityCaptcha: React.FC<SecurityCaptchaProps> = ({ onVerify, onError }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setIsVerified(false);
    drawCaptcha(result);
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw text
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = 30 + i * 25;
      const y = 30 + Math.random() * 10 - 5;
      const angle = (Math.random() - 0.5) * 0.4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`;
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  };

  const handleVerify = () => {
    if (userInput.toLowerCase() === captchaText.toLowerCase()) {
      setIsVerified(true);
      onVerify('captcha-verified-' + Date.now());
    } else {
      onError('Código de verificação incorreto');
      generateCaptcha();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);
    
    // Auto-verify when user types 6 characters
    if (value.length === 6) {
      setTimeout(() => {
        if (value.toLowerCase() === captchaText.toLowerCase()) {
          setIsVerified(true);
          onVerify('captcha-verified-' + Date.now());
        } else {
          onError('Código de verificação incorreto');
          generateCaptcha();
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-2">
        <Shield className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Verificação de Segurança</span>
      </div>
      
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={180}
              height={60}
              className="border border-gray-200 rounded bg-white"
            />
            {isVerified && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded flex items-center justify-center">
                <div className="bg-green-500 text-white rounded-full p-1">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={generateCaptcha}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            title="Gerar novo código"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-3">
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Digite o código acima"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isVerified ? 'border-green-300 bg-green-50' : 'border-gray-300'
            }`}
            maxLength={6}
            disabled={isVerified}
          />
        </div>
        
        {!isVerified && userInput.length === 6 && (
          <button
            type="button"
            onClick={handleVerify}
            className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Verificar
          </button>
        )}
        
        {isVerified && (
          <div className="mt-2 flex items-center space-x-2 text-green-600 text-sm">
            <Shield className="w-4 h-4" />
            <span>Verificação concluída com sucesso</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityCaptcha;