import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  User, 
  Building, 
  DollarSign, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  value: number;
  stage_id: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'won' | 'lost';
  source: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  companies?: {
    name: string;
  };
  funnel_stages?: {
    name: string;
    color: string;
  };
}

interface LeadExpandedModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const LeadExpandedModal: React.FC<LeadExpandedModalProps> = ({ lead, isOpen, onClose, onEdit }) => {
  if (!isOpen || !lead) return null;

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'lost': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Detalhes do Lead</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{lead.name}</p>
                    <p className="text-sm text-gray-500">Nome completo</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{lead.email}</p>
                    <p className="text-sm text-gray-500">E-mail</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{lead.phone || 'Não informado'}</p>
                    <p className="text-sm text-gray-500">Telefone</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Informações Comerciais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{(lead as any).companies?.name || lead.company || 'Não informado'}</p>
                    <p className="text-sm text-gray-500">Empresa</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">R$ {lead.value.toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-gray-500">Valor negociado</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Target className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{lead.source}</p>
                    <p className="text-sm text-gray-500">Origem</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(lead.status)}
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{lead.status}</p>
                    <p className="text-sm text-gray-500">Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Badge className={`${getPriorityColor(lead.priority)}`}>
                    {getPriorityLabel(lead.priority)}
                  </Badge>
                  <div>
                    <p className="font-medium text-gray-900">Prioridade</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: (lead as any).funnel_stages?.color || '#6B7280' }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{(lead as any).funnel_stages?.name || 'Sem etapa'}</p>
                    <p className="text-sm text-gray-500">Etapa atual</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-500">Data de criação</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(lead.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm text-gray-500">Última atualização</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
            Editar Lead
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LeadExpandedModal;