import React from 'react';
import { X, AlertTriangle, Phone, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: {
    connectionId: string;
    phoneNumber: string;
    existingConnections: string[];
  };
}

export default function WhatsAppDuplicateModal({ 
  isOpen, 
  onClose, 
  data 
}: WhatsAppDuplicateModalProps) {
  if (!isOpen || !data) return null;

  const { connectionId, phoneNumber, existingConnections } = data;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Número WhatsApp Duplicado</h3>
                <p className="text-red-100 text-sm">Detecção de duplicidade</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-red-400 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center space-y-3">
            <h4 className="text-xl font-bold text-gray-900">
              Número já conectado
            </h4>
            <p className="text-gray-600">
              O número <span className="font-semibold text-red-600">{phoneNumber}</span> já está sendo usado em outra conexão ativa.
            </p>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                <span className="font-medium">Número:</span> {phoneNumber}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                <span className="font-medium">Conexões ativas:</span> {existingConnections.length}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                <span className="font-medium">Status:</span> Desconectado automaticamente
              </span>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Por que isso aconteceu?</p>
                <p className="text-blue-700">
                  O WhatsApp não permite que o mesmo número seja usado em múltiplas conexões simultâneas. 
                  A nova conexão foi desconectada automaticamente para evitar conflitos.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Entendi
            </Button>
            <Button
              onClick={() => {
                // Redirecionar para página de conexões
                window.location.href = '/settings?tab=connections';
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ver Conexões
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { WhatsAppDuplicateModal };
