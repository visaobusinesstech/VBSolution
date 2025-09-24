import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { QrCode, CheckCircle, AlertCircle, RefreshCw, X, Clock, Smartphone, MessageSquare } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  qrValue: string | null;
  state: 'idle' | 'qr' | 'connected' | 'error';
  error?: string | null;
  expiresIn?: number;
  onRetry?: () => void;
  connectionName?: string;
};

export default function BeautifulQRModal({ 
  open, 
  onClose, 
  qrValue, 
  state, 
  error, 
  expiresIn = 90, 
  onRetry,
  connectionName = 'WhatsApp'
}: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!open) return null;

  const seconds = Math.max(0, Math.floor(expiresIn));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Conectar {connectionName}</h3>
                <p className="text-green-100 text-sm">Escaneie o QR Code para conectar</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {state === 'qr' && (
            <div className="text-center space-y-6">
              {/* QR Code Section */}
              <div className="space-y-4">
                {!qrValue && (
                  <div className="flex flex-col items-center gap-3 text-gray-600">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <RefreshCw className="h-8 w-8 animate-spin text-green-500" />
                    </div>
                    <p className="text-sm font-medium">Gerando QR Code...</p>
                    <p className="text-xs text-gray-500">Aguarde alguns segundos</p>
                  </div>
                )}
                
                {qrValue && isClient && (
                  <div className="space-y-4">
                    <div className="flex justify-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <QRCodeSVG 
                        value={qrValue} 
                        size={240} 
                        includeMargin 
                        level="M"
                      />
                    </div>
                    
                    {/* Instructions */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Smartphone className="h-4 w-4" />
                        <span>1. Abra o WhatsApp no seu celular</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <QrCode className="h-4 w-4" />
                        <span>2. Toque em "Configurações" (⚙️)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <QrCode className="h-4 w-4" />
                        <span>3. Toque em "WhatsApp Web"</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>4. Aponte a câmera para este QR Code</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm">
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
                  <MessageSquare className="h-4 w-4" />
                  <span>Conectando via WhatsApp Web - Versão 2.2412.11</span>
                </div>
              </div>
            </div>
          )}

          {state === 'connected' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-semibold text-green-700">
                  Conectado com sucesso!
                </h4>
                <p className="text-gray-600">
                  {connectionName} foi conectado e está pronto para uso.
                </p>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertCircle className="h-16 w-16 text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-semibold text-red-700">
                  Erro na conexão
                </h4>
                <p className="text-gray-600">
                  {error ?? 'Algo deu errado. Tente novamente.'}
                </p>
              </div>
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="w-full"
              disabled={state === 'connected'}
            >
              {state === 'connected' ? 'Fechar' : 'Cancelar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
