import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  X, 
  Calendar as CalendarIcon, 
  Filter,
  Bookmark,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FilterData {
  status?: string;
  priority?: string;
  source?: string;
  responsible?: string;
  minValue?: string;
  maxValue?: string;
  dateFrom?: string;
  dateTo?: string;
  responsible_id?: string;
  period?: string;
  closing_soon?: boolean;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterData;
}

interface LeadsAdvancedFiltersProps {
  onFiltersChange: (filters: FilterData) => void;
  onClearFilters: () => void;
}

const LeadsAdvancedFilters = ({ onFiltersChange, onClearFilters }: LeadsAdvancedFiltersProps) => {
  const [activeFilters, setActiveFilters] = useState<FilterData>({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    { id: '1', name: 'Meus leads da semana', filters: { responsible_id: 'me', period: 'week' } },
    { id: '2', name: 'Alta prioridade', filters: { priority: 'high' } },
    { id: '3', name: 'Próximos fechamentos', filters: { closing_soon: true } },
  ]);

  const filterOptions = {
    status: [
      { value: 'open', label: 'Aberto' },
      { value: 'won', label: 'Ganho' },
      { value: 'lost', label: 'Perdido' },
      { value: 'frozen', label: 'Congelado' }
    ],
    priority: [
      { value: 'high', label: 'Alta' },
      { value: 'medium', label: 'Média' },
      { value: 'low', label: 'Baixa' }
    ],
    source: [
      { value: 'website', label: 'Website' },
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'referral', label: 'Indicação' },
      { value: 'cold_call', label: 'Cold Call' },
      { value: 'email', label: 'E-mail' },
      { value: 'event', label: 'Evento' }
    ]
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    if (!value || value === 'all') {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setDateRange({});
    onClearFilters();
  };

  const handleSaveFilter = () => {
    const filterName = prompt('Nome para o filtro:');
    if (filterName && Object.keys(activeFilters).length > 0) {
      const newSavedFilter: SavedFilter = {
        id: Date.now().toString(),
        name: filterName,
        filters: { ...activeFilters }
      };
      setSavedFilters([...savedFilters, newSavedFilter]);
    }
  };

  const applySavedFilter = (filters: FilterData) => {
    setActiveFilters(filters);
    onFiltersChange(filters);
  };

  const deleteSavedFilter = (id: string) => {
    setSavedFilters(savedFilters.filter(f => f.id !== id));
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length + (dateRange.from ? 1 : 0);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-sm">
      <CardContent className="p-6">
        {/* Header dos filtros */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Filtros Avançados</h3>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {getActiveFilterCount()} ativo{getActiveFilterCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {Object.keys(activeFilters).length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSaveFilter}>
                <Bookmark className="h-4 w-4 mr-2" />
                Salvar Filtro
              </Button>
            )}
            {getActiveFilterCount() > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar Todos
              </Button>
            )}
          </div>
        </div>

        {/* Filtros salvos */}
        {savedFilters.length > 0 && (
          <div className="mb-6">
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              Filtros Salvos
            </Label>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((savedFilter) => (
                <div key={savedFilter.id} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applySavedFilter(savedFilter.filters)}
                    className="bg-white"
                  >
                    {savedFilter.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    onClick={() => deleteSavedFilter(savedFilter.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grade de filtros */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Status</Label>
            <Select 
              value={activeFilters.status || 'all'} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions.status.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Prioridade</Label>
            <Select 
              value={activeFilters.priority || 'all'} 
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filterOptions.priority.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origem */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Origem</Label>
            <Select 
              value={activeFilters.source || 'all'} 
              onValueChange={(value) => handleFilterChange('source', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filterOptions.source.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Responsável</Label>
            <Select 
              value={activeFilters.responsible || 'all'} 
              onValueChange={(value) => handleFilterChange('responsible', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="me">Meus leads</SelectItem>
                {/* Aqui viriam os responsáveis da base */}
              </SelectContent>
            </Select>
          </div>

          {/* Valor mínimo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Valor Mínimo</Label>
            <Input
              type="number"
              placeholder="R$ 0"
              value={activeFilters.minValue || ''}
              onChange={(e) => handleFilterChange('minValue', e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Valor máximo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Valor Máximo</Label>
            <Input
              type="number"
              placeholder="R$ 999999"
              value={activeFilters.maxValue || ''}
              onChange={(e) => handleFilterChange('maxValue', e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        {/* Filtros de data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Data de Criação - De</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    format(dateRange.from, "PPP", { locale: ptBR })
                  ) : (
                    <span>Data inicial</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => {
                    const newRange = { ...dateRange, from: date };
                    setDateRange(newRange);
                    handleFilterChange('dateFrom', date?.toISOString());
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Data de Criação - Até</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? (
                    format(dateRange.to, "PPP", { locale: ptBR })
                  ) : (
                    <span>Data final</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => {
                    const newRange = { ...dateRange, to: date };
                    setDateRange(newRange);
                    handleFilterChange('dateTo', date?.toISOString());
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsAdvancedFilters;
