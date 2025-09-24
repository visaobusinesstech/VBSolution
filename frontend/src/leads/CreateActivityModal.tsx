
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { LeadWithDetails } from '@/hooks/useLeads';
import { createSafeSelectItems } from '@/utils/selectValidation';
import { useVB } from '@/contexts/VBContext';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: LeadWithDetails[];
}

const CreateActivityModal = ({ isOpen, onClose, leads }: CreateActivityModalProps) => {
  const { dispatch } = useVB();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'call',
    leadId: '',
    scheduledDate: '',
    scheduledTime: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.leadId || !formData.scheduledDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, lead e data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Criar nova atividade usando o contexto VBContext
      const newActivity = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        date: new Date(`${formData.scheduledDate}T${formData.scheduledTime || '00:00'}`),
        priority: 'medium' as const,
        responsibleId: '', // Será definido pelo usuário logado ou selecionado
        type: (formData.type === 'email' ? 'other' : formData.type) as 'call' | 'meeting' | 'task' | 'other',
        status: 'pending' as const,
        createdAt: new Date(),
        leadId: formData.leadId
      };

      // Adicionar ao contexto (que automaticamente salva no localStorage)
      dispatch({ type: 'ADD_ACTIVITY', payload: newActivity });
      
      toast({
        title: "Atividade criada",
        description: "Atividade agendada com sucesso!",
      });
      
      onClose();
      setFormData({
        title: '',
        type: 'call',
        leadId: '',
        scheduledDate: '',
        scheduledTime: '',
        description: ''
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar atividade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create safe select items for leads with enhanced validation
  const leadItems = createSafeSelectItems(
    (leads || []).filter(lead => lead && lead.id && lead.name),
    (lead) => lead.id,
    (lead) => lead.name,
    'lead'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-gray-300">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Nova Atividade</DialogTitle>
          <DialogDescription className="text-gray-600">
            Agende uma nova atividade para um lead
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-700">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Ligação de follow-up"
              className="border-gray-300 focus:border-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-700">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="call">Ligação</SafeSelectItem>
                  <SafeSelectItem value="email">E-mail</SafeSelectItem>
                  <SafeSelectItem value="meeting">Reunião</SafeSelectItem>
                  <SafeSelectItem value="task">Tarefa</SafeSelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead" className="text-gray-700">Lead *</Label>
              <Select
                value={formData.leadId || 'no-lead'}
                onValueChange={(value) => handleInputChange('leadId', value === 'no-lead' ? '' : value)}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="no-lead">Selecione um lead</SafeSelectItem>
                  {leadItems.map((item) => (
                    <SafeSelectItem key={item.key} value={item.value}>
                      {item.label}
                    </SafeSelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate" className="text-gray-700">Data *</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                className="border-gray-300 focus:border-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledTime" className="text-gray-700">Horário</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                className="border-gray-300 focus:border-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o objetivo da atividade..."
              rows={3}
              className="border-gray-300 focus:border-gray-500"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-300 text-gray-700">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-gray-900 hover:bg-gray-800 text-white">
              {loading ? 'Criando...' : 'Criar Atividade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateActivityModal;
