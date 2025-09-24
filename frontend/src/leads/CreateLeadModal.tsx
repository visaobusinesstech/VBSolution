
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useLeads, Lead } from '@/hooks/useLeads';
import { FunnelStage } from '@/hooks/useFunnelStages';

interface Company {
  id: string;
  fantasy_name: string;
  email?: string;
  phone?: string;
  sector?: string;
}

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies?: Company[];
  stages?: FunnelStage[];
  onLeadCreated?: () => void;
  editingLead?: any;
  onCreateLead?: (leadData: any) => Promise<void>;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => Promise<any>;
}

const CreateLeadModal = ({ 
  isOpen, 
  onClose, 
  companies = [], 
  stages = [], 
  onLeadCreated = () => {},
  editingLead,
  onCreateLead,
  onUpdateLead
}: CreateLeadModalProps) => {
  const { createLead, updateLead } = useLeads();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
    value: 0,
    currency: 'BRL' as 'BRL' | 'USD' | 'EUR',
    stage_id: '',
    responsible_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    source: '',
    status: 'open' as 'open' | 'won' | 'lost' | 'frozen',
    expected_close_date: '',
    conversion_rate: 0,
    notes: ''
  });

  useEffect(() => {
    if (editingLead) {
      setFormData({
        name: editingLead.name || '',
        company_id: editingLead.company_id || '',
        value: editingLead.value || 0,
        currency: editingLead.currency || 'BRL',
        stage_id: editingLead.stage_id || '',
        responsible_id: editingLead.responsible_id || '',
        priority: editingLead.priority || 'medium',
        source: editingLead.source || '',
        status: editingLead.status || 'open',
        expected_close_date: editingLead.expected_close_date || '',
        conversion_rate: editingLead.conversion_rate || 0,
        notes: editingLead.notes || ''
      });
    } else {
      setFormData({
        name: '',
        company_id: '',
        value: 0,
        currency: 'BRL',
        stage_id: stages[0]?.id || '',
        responsible_id: '',
        priority: 'medium',
        source: '',
        status: 'open',
        expected_close_date: '',
        conversion_rate: 0,
        notes: ''
      });
    }
  }, [editingLead, stages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do lead é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (editingLead) {
        if (onUpdateLead) {
          await onUpdateLead(editingLead.id, formData);
        } else {
          await updateLead(editingLead.id, formData);
        }
        toast({
          title: "Lead atualizado",
          description: "Lead atualizado com sucesso!",
        });
      } else {
        if (onCreateLead) {
          await onCreateLead(formData);
        } else {
          await createLead(formData);
        }
        toast({
          title: "Lead criado",
          description: "Lead criado com sucesso!",
        });
      }
      
      onLeadCreated();
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: editingLead ? "Erro ao atualizar lead" : "Erro ao criar lead",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLead ? 'Editar Lead' : 'Criar Novo Lead'}
          </DialogTitle>
          <DialogDescription>
            {editingLead ? 'Atualize as informações do lead' : 'Preencha as informações do novo lead'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Lead *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Digite o nome do lead"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => handleInputChange('company_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.fantasy_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => handleInputChange('value', Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversion_rate">Taxa de Conversão (%)</Label>
              <Input
                id="conversion_rate"
                type="number"
                min="0"
                max="100"
                value={formData.conversion_rate}
                onChange={(e) => handleInputChange('conversion_rate', Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Etapa</Label>
              <Select
                value={formData.stage_id}
                onValueChange={(value) => handleInputChange('stage_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="Website, indicação, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Data Prevista de Fechamento</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações sobre o lead..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (editingLead ? 'Atualizar' : 'Criar Lead')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeadModal;
