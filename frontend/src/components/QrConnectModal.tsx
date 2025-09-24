import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  qrValue: string | null;
  state: 'idle' | 'qr' | 'connected' | 'error';
  error?: string | null;
  expiresIn?: number;
  onRetry?: () => void;
};

export default function QrConnectModal({ 
  open, 
  onClose, 
  qrValue, 
  state, 
  error, 
  expiresIn = 90, 
  onRetry 
}: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log('QrConnectModal: Setting isClient to true');
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    console.log('QrConnectModal: qrValue changed:', qrValue);
    console.log('QrConnectModal: isClient:', isClient);
  }, [qrValue, isClient]);

  if (!open) return null;

  const seconds = Math.max(0, Math.floor(expiresIn));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {state === 'qr' && (
            <div className="text-center space-y-4">
              {!qrValue && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p>Gerando/renovando QR Code… aguarde alguns segundos.</p>
                </div>
              )}
              
              {qrValue && isClient && (
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <QRCode value={qrValue} size={220} includeMargin />
                </div>
              )}
              
              {qrValue && !isClient && (
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Carregando QR Code...</div>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Expira em <span className="font-bold text-primary">{mm}:{ss}</span>
                </p>
                <p className="text-xs text-gray-500">
                  O QR renova automaticamente a cada ~20s.
                </p>
                <p className="text-sm text-gray-700">
                  Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo.
                </p>
              </div>
            </div>
          )}

          {state === 'connected' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-lg font-medium text-green-700">
                Conectado! Finalizando…
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <p className="text-red-600 font-medium">
                {error ?? 'Algo deu errado.'}
              </p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={state === 'connected'}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
