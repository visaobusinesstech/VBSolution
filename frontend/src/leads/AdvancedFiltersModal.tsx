
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FunnelStage } from '@/hooks/useFunnelStages';
import { createSafeSelectItems } from '@/utils/selectValidation';

interface AdvancedFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
  stages: FunnelStage[];
}

const AdvancedFiltersModal = ({ isOpen, onClose, onApplyFilters, stages }: AdvancedFiltersModalProps) => {
  const [filters, setFilters] = useState({
    minValue: '',
    maxValue: '',
    createdAfter: undefined as Date | undefined,
    createdBefore: undefined as Date | undefined,
    expectedCloseAfter: undefined as Date | undefined,
    expectedCloseBefore: undefined as Date | undefined,
    source: 'all',
    responsible: 'all',
    stage: 'all'
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      minValue: '',
      maxValue: '',
      createdAfter: undefined,
      createdBefore: undefined,
      expectedCloseAfter: undefined,
      expectedCloseBefore: undefined,
      source: 'all',
      responsible: 'all',
      stage: 'all'
    });
  };

  // Create safe select items for stages with enhanced validation
  const stageItems = createSafeSelectItems(
    (stages || []).filter(stage => stage && stage.id && stage.name),
    (stage) => stage.id,
    (stage) => stage.name,
    'stage'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
          <DialogDescription>
            Configure filtros detalhados para refinar a busca por leads
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Filtros de Valor */}
          <div className="space-y-4">
            <h4 className="font-medium">Valor da Oportunidade</h4>
            
            <div className="space-y-2">
              <Label>Valor Mínimo</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={filters.minValue}
                onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Valor Máximo</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={filters.maxValue}
                onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
              />
            </div>
          </div>

          {/* Filtros de Data */}
          <div className="space-y-4">
            <h4 className="font-medium">Datas</h4>
            
            <div className="space-y-2">
              <Label>Criado Após</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.createdAfter && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.createdAfter ? (
                      format(filters.createdAfter, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.createdAfter}
                    onSelect={(date) => setFilters({ ...filters, createdAfter: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Criado Antes</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.createdBefore && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.createdBefore ? (
                      format(filters.createdBefore, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.createdBefore}
                    onSelect={(date) => setFilters({ ...filters, createdBefore: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Outros filtros */}
          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select value={filters.source} onValueChange={(value) => setFilters({ ...filters, source: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SafeSelectItem value="all">Todas</SafeSelectItem>
                    <SafeSelectItem value="indication">Indicação</SafeSelectItem>
                    <SafeSelectItem value="ads">Anúncios</SafeSelectItem>
                    <SafeSelectItem value="social">Redes Sociais</SafeSelectItem>
                    <SafeSelectItem value="organic">Orgânico</SafeSelectItem>
                    <SafeSelectItem value="event">Evento</SafeSelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={filters.stage} onValueChange={(value) => setFilters({ ...filters, stage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SafeSelectItem value="all">Todas</SafeSelectItem>
                    {stageItems.map((item) => (
                      <SafeSelectItem key={item.key} value={item.value}>
                        {item.label}
                      </SafeSelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={filters.responsible} onValueChange={(value) => setFilters({ ...filters, responsible: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SafeSelectItem value="all">Todos</SafeSelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Limpar Filtros
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFiltersModal;
