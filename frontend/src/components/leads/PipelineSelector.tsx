
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  description?: string;
}

interface PipelineSelectorProps {
  pipelines: Pipeline[];
  selectedPipeline: string;
  onPipelineChange: (pipelineId: string) => void;
  onCreatePipeline: () => void;
  onManagePipelines: () => void;
}

const PipelineSelector = ({ 
  pipelines, 
  selectedPipeline, 
  onPipelineChange,
  onCreatePipeline,
  onManagePipelines
}: PipelineSelectorProps) => {
  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Pipeline:</span>
        <Select value={selectedPipeline} onValueChange={onPipelineChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione um pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline.id} value={pipeline.id}>
                <div className="flex flex-col">
                  <span>{pipeline.name}</span>
                  {pipeline.description && (
                    <span className="text-xs text-gray-500">{pipeline.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onCreatePipeline}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Pipeline
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onManagePipelines}
        >
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar
        </Button>
      </div>
    </div>
  );
};

export default PipelineSelector;
