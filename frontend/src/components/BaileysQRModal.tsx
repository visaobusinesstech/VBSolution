import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, X, Settings, Smartphone, CheckCircle } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  connectionId: string;
  connectionName: string;
};

export default function BaileysQRModal({ 
  open, 
  onClose, 
  connectionId,
  connectionName
}: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch QR code from Baileys backend
  const fetchQRCode = async () => {
    if (!connectionId) {
      setError('Erro ao conectar com Baileys');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/baileys-simple/connections/${connectionId}/qr`);
      const data = await response.json();
      
      if (data.success) {
        if (data.data.qrCode) {
          setQrCode(data.data.qrCode);
          setIsConnected(false);
        } else if (data.data.isConnected) {
          setIsConnected(true);
          setQrCode(null);
        } else {
          setError('Aguardando QR Code...');
        }
      } else {
        setError(data.error || 'Erro ao obter QR Code');
      }
    } catch (err) {
      console.error('Erro ao buscar QR Code:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Check connection status
  const checkConnectionStatus = async () => {
    if (!connectionId) return;
    
    try {
      const response = await fetch(`/api/baileys-simple/connections/${connectionId}/info`);
      const data = await response.json();
      
      if (data.success && data.data.isConnected) {
        setIsConnected(true);
        setQrCode(null);
        setError(null);
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  };

  // Auto-refresh QR code every 20 seconds
  useEffect(() => {
    if (!open || !connectionId) return;

    // Initial fetch
    fetchQRCode();

    // Set up interval for QR refresh
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchQRCode();
      }
    }, 20000);

    // Set up interval for connection status check
    const statusInterval = setInterval(() => {
      checkConnectionStatus();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [open, connectionId, isConnected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all duration-300 scale-100 opacity-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Conectar WhatsApp
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
          <div className="text-center space-y-4">
            {isLoading && !qrCode && (
              <div className="flex flex-col items-center justify-center gap-3 text-gray-600 bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-200">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-lg font-medium">Gerando QR Code...</p>
                <p className="text-sm text-gray-500">Aguarde alguns segundos</p>
              </div>
            )}

            {qrCode && !isConnected && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm">Aguardando conexão...</span>
                </div>

                {/* QR Code */}
                <div className="flex justify-center p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <img 
                    src={qrCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 bg-white rounded-lg p-2"
                  />
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

            {isConnected && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <p className="text-xl font-semibold text-green-700">
                  Conectado com sucesso!
                </p>
                <p className="text-gray-600">
                  WhatsApp conectado para: {connectionName}
                </p>
              </div>
            )}

            {error && !isLoading && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <X className="h-16 w-16 text-red-500" />
                </div>
                <p className="text-lg font-semibold text-red-600">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* How to Connect Instructions */}
          {qrCode && !isConnected && (
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
                    <Settings className="h-4 w-4 text-gray-500" />
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

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            {qrCode && !isConnected && (
              <Button 
                onClick={fetchQRCode}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
