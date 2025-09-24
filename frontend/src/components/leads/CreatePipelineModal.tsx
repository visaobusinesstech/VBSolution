import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Target, Plus, Trash2, Palette } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CreatePipelineModalProps {
  open: boolean;
  onClose: () => void;
  onPipelineCreated?: (pipeline: { name: string }) => void;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  position: number;
}

const CreatePipelineModal: React.FC<CreatePipelineModalProps> = ({ open, onClose, onPipelineCreated }) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'Qualified', color: '#10B981', position: 1 },
    { id: '2', name: 'Contact Made', color: '#3B82F6', position: 2 },
    { id: '3', name: 'Demo Scheduled', color: '#8B5CF6', position: 3 },
    { id: '4', name: 'Proposal Made', color: '#F59E0B', position: 4 },
    { id: '5', name: 'Negotiations', color: '#EF4444', position: 5 }
  ]);
  const [loading, setLoading] = useState(false);

  const colors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const addStage = () => {
    const newStage: Stage = {
      id: Date.now().toString(),
      name: `Etapa ${stages.length + 1}`,
      color: colors[stages.length % colors.length],
      position: stages.length + 1
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (id: string) => {
    if (stages.length > 1) {
      setStages(stages.filter(stage => stage.id !== id));
    }
  };

  const updateStage = (id: string, field: keyof Stage, value: string | number) => {
    setStages(stages.map(stage => 
      stage.id === id ? { ...stage, [field]: value } : stage
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Criar pipeline no Supabase
      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .insert({
          name: formData.name,
          owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' // ID do usuário atual
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      // Criar estágios no Supabase
      const stagesData = stages.map(stage => ({
        name: stage.name,
        color: stage.color,
        position: stage.position,
        pipeline_id: pipeline.id,
        owner_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      }));

      const { error: stagesError } = await supabase
        .from('funnel_stages')
        .insert(stagesData);

      if (stagesError) throw stagesError;
      
      onPipelineCreated?.(formData);
      setFormData({ name: '' });
      setStages([
        { id: '1', name: 'Qualified', color: '#10B981', position: 1 },
        { id: '2', name: 'Contact Made', color: '#3B82F6', position: 2 },
        { id: '3', name: 'Demo Scheduled', color: '#8B5CF6', position: 3 },
        { id: '4', name: 'Proposal Made', color: '#F59E0B', position: 4 },
        { id: '5', name: 'Negotiations', color: '#EF4444', position: 5 }
      ]);
      onClose();
    } catch (error) {
      console.error('Erro ao criar pipeline:', error);
      alert('Erro ao criar pipeline. Tente novamente.');
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
            <h3 className="text-lg font-semibold text-gray-900">Nova Pipeline</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <Label htmlFor="name">Nome da Pipeline *</Label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                type="text"
                placeholder="Ex: Vendas Q1 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Estágios */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Estágios da Pipeline</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStage}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Etapa</span>
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {stages.map((stage, index) => (
                <Card key={stage.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-center space-x-3">
                      {/* Cor */}
                      <div className="flex items-center space-x-2">
                        <Palette className="h-4 w-4 text-gray-400" />
                        <div className="flex space-x-1">
                          {colors.slice(0, 6).map(color => (
                            <button
                              key={color}
                              type="button"
                              className={`w-6 h-6 rounded-full border-2 ${
                                stage.color === color ? 'border-gray-900' : 'border-gray-200'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => updateStage(stage.id, 'color', color)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Nome */}
                      <div className="flex-1">
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                          placeholder="Nome da etapa"
                          className="text-sm"
                        />
                      </div>

                      {/* Posição */}
                      <div className="w-16">
                        <Input
                          type="number"
                          value={stage.position}
                          onChange={(e) => updateStage(stage.id, 'position', parseInt(e.target.value) || 1)}
                          className="text-sm text-center"
                          min="1"
                        />
                      </div>

                      {/* Remover */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStage(stage.id)}
                        disabled={stages.length <= 1}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              disabled={loading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Criando...' : 'Criar Pipeline'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePipelineModal;
