
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, X, Archive, Trash2 } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onBulkAction: (action: string) => Promise<void>;
  onClear: () => void;
}

const BulkActionsBar = ({ selectedCount, onSelectAll, onBulkAction, onClear }: BulkActionsBarProps) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {selectedCount} selecionados
        </Badge>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Selecionar todos
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            Limpar seleção
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onBulkAction('won')}
          className="text-green-600 hover:bg-green-50"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Marcar como Ganho
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onBulkAction('lost')}
          className="text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Marcar como Perdido
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onBulkAction('frozen')}
          className="text-blue-600 hover:bg-blue-50"
        >
          <Archive className="h-4 w-4 mr-1" />
          Congelar
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
