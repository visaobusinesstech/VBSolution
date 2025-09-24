
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CreateWriteoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWriteoffCreated: () => void;
}

export default function CreateWriteoffModal({ 
  isOpen, 
  onClose, 
  onWriteoffCreated 
}: CreateWriteoffModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    reason: '',
    warehouse: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome da baixa é obrigatório");
      return;
    }

    if (!formData.reason) {
      toast.error("Motivo da baixa é obrigatório");
      return;
    }

    // Here you would typically save to database
    console.log('Creating writeoff:', formData);
    
    onWriteoffCreated();
    toast.success('Baixa criada com sucesso!');
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      reason: '',
      warehouse: '',
      notes: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Baixa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Baixa *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite o nome da baixa"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Motivo da Baixa *</Label>
            <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="damage">Produto Danificado</SelectItem>
                <SelectItem value="expiry">Produto Vencido</SelectItem>
                <SelectItem value="loss">Perda/Roubo</SelectItem>
                <SelectItem value="return">Devolução</SelectItem>
                <SelectItem value="quality">Problema de Qualidade</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="warehouse">Depósito</Label>
            <Select value={formData.warehouse} onValueChange={(value) => handleInputChange('warehouse', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o depósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Depósito Principal</SelectItem>
                <SelectItem value="secondary">Depósito Secundário</SelectItem>
                <SelectItem value="warehouse-a">Armazém A</SelectItem>
                <SelectItem value="warehouse-b">Armazém B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais (opcional)"
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-black hover:bg-gray-800 text-white">
              Criar Baixa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
