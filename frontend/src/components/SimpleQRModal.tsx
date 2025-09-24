import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { QrCode, CheckCircle, AlertCircle, RefreshCw, X, Clock, Smartphone, Settings as SettingsIcon } from 'lucide-react';
import { useConnections } from '@/contexts/ConnectionsContext';
import { ProgressBar } from '@/components/ProgressBar';

type Props = {
  open: boolean;
  onClose: () => void;
  qrValue: string | null;
  state: 'idle' | 'qr' | 'connected' | 'error' | 'duplicate';
  error?: string | null;
  expiresIn?: number;
  onRetry?: () => void;
  connectionName?: string;
  connectionId?: string;
  onSuccess?: () => void;
};

export default function SimpleQRModal({ 
  open, 
  onClose, 
  qrValue, 
  state, 
  error, 
  expiresIn = 90, 
  onRetry,
  connectionName = 'WhatsApp',
  connectionId,
  onSuccess
}: Props) {
  const [isClient, setIsClient] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProgressRunning, setIsProgressRunning] = useState(false);
  const { loadConnections, setActiveConnection, connections } = useConnections();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get progress for this connection
  const progressPercent = progress;
  const progressPhase = 'creating';

  // Handle connection finalization
  const handleConclude = async () => {
    if (!connectionId || !onSuccess) return;
    
    console.log('Finalizing connection for:', connectionId);
    
    try {
      // Finalize connection
      onSuccess();
      
      // Refresh connections list
      await loadConnections();
      console.log('Connections list refreshed');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error('Error finalizing connection:', error);
    }
  };

  // Handle duplicate modal auto-close
  useEffect(() => {
    if (state === 'duplicate') {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 seconds for duplicate

      return () => clearTimeout(timer);
    }
  }, [state, onClose]);

  if (!open) return null;

  const seconds = Math.max(0, Math.floor(expiresIn));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all duration-500 scale-100 opacity-100 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <QrCode className="h-7 w-7 text-green-600" />
            </div>
            Conectar WhatsApp: <span className="text-green-700">{connectionName}</span>
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* QR Code Section */}
          {state === 'qr' && (
            <div className="text-center space-y-5">
              {!qrValue && (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-600 bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-lg font-medium">Gerando QR Code...</p>
                  <p className="text-sm text-gray-500">Aguarde alguns segundos</p>
                </div>
              )}

              {qrValue && isClient && (
                <div className="space-y-4">
                  {/* QR Code Display - WhatsApp Style */}
                  <div className="flex justify-center p-6 bg-white rounded-xl border-2 border-gray-200">
                    <div className="bg-white p-2 rounded-lg">
                      <QRCodeSVG 
                        value={qrValue} 
                        size={280} 
                        includeMargin={false}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        imageSettings={{
                          src: "",
                          height: 0,
                          width: 0,
                          excavate: false,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm">Aguardando conexão...</span>
                  </div>

                  {/* Instructions */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      Escaneie o QR Code com seu WhatsApp
                    </p>
                    <p className="text-xs text-gray-500">
                      Abra o WhatsApp &gt;&gt; Configurações &gt;&gt; WhatsApp Web
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {state === 'connected' && (
            <div className="text-center space-y-8">
              {/* Success Animation */}
              <div className="relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-400 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-300 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              {/* Success Message */}
              <div className="space-y-3">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Conectado com sucesso!
                </h3>
                <p className="text-gray-600 text-lg">
                  Sua conexão WhatsApp está ativa e pronta para uso
                </p>
              </div>
              
              {/* Conclude Button */}
              <div className="mt-8">
                <button
                  onClick={handleConclude}
                  className="w-full bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out relative overflow-hidden group"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                  
                  {/* Button content */}
                  <div className="relative flex items-center justify-center gap-3">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-lg">Concluído</span>
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-green-400/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <p className="mt-3 text-center text-sm text-gray-500">
                  Clique para finalizar e adicionar à lista de conexões
                </p>
              </div>
            </div>
          )}

          {state === 'duplicate' && (
            <div className="text-center space-y-8">
              {/* Warning Animation */}
              <div className="relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <AlertCircle className="h-12 w-12 text-white" />
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-orange-400 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-orange-300 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              {/* Warning Message */}
              <div className="space-y-3">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                  Conexão já existe!
                </h3>
                <p className="text-gray-600 text-lg">
                  A conexão <strong className="text-orange-600">"{connectionName}"</strong> já está configurada no sistema.
                </p>
              </div>
              
              {/* Progress Bar - Duplicate */}
              <div className="mt-6">
                <div className="w-full h-3 rounded-full bg-gray-100/80 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 rounded-full transition-all duration-300 ease-out relative"
                    style={{ width: '100%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-sm"></div>
                  </div>
                </div>
                <div className="mt-2 text-center text-xs text-gray-500">
                  Conexão duplicada — fechando modal
                </div>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center space-y-8">
              {/* Error Animation */}
              <div className="relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <AlertCircle className="h-12 w-12 text-white" />
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-red-400 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-red-300 rounded-full animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
              </div>
              
              {/* Error Message */}
              <div className="space-y-3">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  Ops! Algo deu errado
                </h3>
                <p className="text-gray-600 text-lg">
                  {error ?? 'Não foi possível conectar. Tente novamente.'}
                </p>
              </div>
              
              {/* Retry Button */}
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          {/* How to Connect Instructions */}
          {state === 'qr' && qrValue && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 text-center">
                Como conectar:
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                  <span>Abra o WhatsApp no seu celular</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                  <div className="flex items-center gap-2">
                    <span>Toque em</span>
                    <SettingsIcon className="h-4 w-4 text-gray-500" />
                    <span>Configurações</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                  <span>Toque em WhatsApp Web</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                  <span>Aponte a câmera para o QR Code</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">5</span>
                  <span>Aguarde a confirmação</span>
                </div>
              </div>
            </div>
          )}

          {/* Timer and Info */}
          {state === 'qr' && (
            <div className="space-y-4">
              {/* Timer */}
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600">Expira em</span>
                <span className="font-bold text-orange-600 text-lg">{mm}:{ss}</span>
              </div>

              {/* Auto-refresh info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <RefreshCw className="h-4 w-4" />
                  <span>O QR Code renova automaticamente a cada 20 segundos</span>
                </div>
              </div>

              {/* WhatsApp Web info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <Smartphone className="h-4 w-4" />
                  <span>Conectando via WhatsApp Web - Versão 2.2412.11</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Só aparece quando não está conectado ou duplicado */}
          {state !== 'connected' && state !== 'duplicate' && (
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}