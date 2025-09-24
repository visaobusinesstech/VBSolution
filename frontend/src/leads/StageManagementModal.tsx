
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, GripVertical, Settings } from 'lucide-react';
import { FunnelStage } from '@/hooks/useFunnelStages';

interface StageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: FunnelStage[];
  onStageCreated: (stageData: any) => Promise<any>;
}

const StageManagementModal = ({ 
  isOpen, 
  onClose, 
  stages,
  onStageCreated 
}: StageManagementModalProps) => {
  const [newStage, setNewStage] = useState({
    name: '',
    color: '#3b82f6',
    order_position: stages.length + 1
  });

  const handleCreateStage = async () => {
    if (!newStage.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a etapa",
        variant: "destructive",
      });
      return;
    }

    try {
      await onStageCreated(newStage);
      
      toast({
        title: "Etapa criada",
        description: "Nova etapa adicionada ao funil!",
      });
      
      setNewStage({ 
        name: '', 
        color: '#3b82f6',
        order_position: stages.length + 1 
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar etapa",
        variant: "destructive",
      });
    }
  };

  const predefinedStages = [
    { name: 'Contato Inicial', color: '#3b82f6' },
    { name: 'Qualificação', color: '#8b5cf6' },
    { name: 'Proposta', color: '#f59e0b' },
    { name: 'Negociação', color: '#06b6d4' },
    { name: 'Fechamento', color: '#10b981' }
  ];

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];

  const addPredefinedStage = async (stage: { name: string; color: string }) => {
    const stageData = {
      ...stage,
      order_position: stages.length + 1
    };
    
    try {
      await onStageCreated(stageData);
      toast({
        title: "Etapa adicionada",
        description: `Etapa "${stage.name}" adicionada com sucesso!`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar etapa",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Etapas do Funil
          </DialogTitle>
          <DialogDescription>
            Personalize as etapas do seu pipeline de vendas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Etapas Pré-definidas */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Etapas Sugeridas
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {predefinedStages.map((stage, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => addPredefinedStage(stage)}
                    className="justify-start"
                    disabled={stages.some(s => s.name.toLowerCase() === stage.name.toLowerCase())}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Criar nova etapa */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Nova Etapa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-2">
                  <Label htmlFor="stageName">Nome da etapa</Label>
                  <Input
                    id="stageName"
                    value={newStage.name}
                    onChange={(e) => setNewStage(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Follow-up Cliente"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cor da etapa</Label>
                  <div className="flex gap-1 flex-wrap">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                          newStage.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewStage(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                
                <Button onClick={handleCreateStage} className="w-full text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Etapa
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de etapas existentes */}
          <div>
            <h4 className="font-medium mb-3">Etapas Atuais ({stages.length})</h4>
            
            {stages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg font-medium mb-2">Nenhuma etapa criada</div>
                <p>Use as etapas sugeridas ou crie sua primeira etapa</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stages
                  .sort((a, b) => a.order_position - b.order_position)
                  .map((stage) => (
                  <Card key={stage.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="font-medium">{stage.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            #{stage.order_position}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StageManagementModal;
