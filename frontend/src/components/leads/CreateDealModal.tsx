import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, User, Building, DollarSign, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CreateDealModalProps {
  open: boolean;
  onClose: () => void;
  onLeadCreated?: () => void;
}

const CreateDealModal: React.FC<CreateDealModalProps> = ({ open, onClose, onLeadCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    value: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    source: 'website'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Primeiro, vamos buscar o primeiro estágio disponível
      const { data: stages } = await supabase
        .from('funnel_stages')
        .select('id')
        .order('position', { ascending: true })
        .limit(1);

      if (!stages || stages.length === 0) {
        throw new Error('Nenhum estágio encontrado');
      }

      const { error } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          value: parseFloat(formData.value) || 0,
          stage_id: stages[0].id,
          priority: formData.priority,
          status: 'open',
          source: formData.source,
          owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        });

      if (error) throw error;

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        value: '',
        priority: 'medium',
        source: 'website'
      });

      onLeadCreated?.();
      onClose();
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      alert('Erro ao criar lead. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Novo Lead</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">Nome do Cliente *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company">Empresa</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="company"
                type="text"
                placeholder="Nome da empresa"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="value">Valor Negociado</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="value"
                type="number"
                placeholder="0.00"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="pl-10"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div>
            <Label htmlFor="source">Origem</Label>
            <select
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="website">Website</option>
              <option value="referral">Indicação</option>
              <option value="linkedin">LinkedIn</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Criando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDealModal;
