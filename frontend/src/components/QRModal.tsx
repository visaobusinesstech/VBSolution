import { X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { WhatsAppStatus } from '@/types';

interface QRModalProps {
  qrCode: string | null;
  onClose: () => void;
  status: WhatsAppStatus;
}

export default function QRModal({ qrCode, onClose, status }: QRModalProps) {
  const getStatusIcon = () => {
    if (status.connected) {
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    }
    if (status.lastError) {
      return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
    return <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />;
  };

  const getStatusText = () => {
    if (status.connected) {
      return 'WhatsApp conectado com sucesso!';
    }
    if (status.lastError) {
      return `Erro: ${status.lastError}`;
    }
    return 'Aguardando conexão...';
  };

  const getStatusColor = () => {
    if (status.connected) {
      return 'text-green-600';
    }
    if (status.lastError) {
      return 'text-red-600';
    }
    return 'text-blue-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Conectar WhatsApp
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            {getStatusIcon()}
          </div>
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          {status.sessionName && (
            <p className="text-xs text-gray-500 mt-1">
              Sessão: {status.sessionName}
            </p>
          )}
        </div>

        {/* QR Code */}
        {qrCode && !status.connected && (
          <div className="text-center mb-6">
            <div className="bg-gray-50 rounded-lg p-4 inline-block">
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Escaneie o QR Code com seu WhatsApp
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Abra o WhatsApp {'>>'} Configurações {'>>'} WhatsApp Web
            </p>
          </div>
        )}

        {/* Instruções */}
        {!status.connected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Como conectar:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Abra o WhatsApp no seu celular</li>
              <li>2. Toque em Configurações (⚙️)</li>
              <li>3. Toque em WhatsApp Web</li>
              <li>4. Aponte a câmera para o QR Code</li>
              <li>5. Aguarde a confirmação</li>
            </ol>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end space-x-3">
          {status.connected ? (
            <button
              onClick={onClose}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Concluído
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
