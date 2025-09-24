
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X,
  Calendar,
  Building2,
  User,
  DollarSign,
  Tag
} from 'lucide-react';

interface LeadsFiltersProps {
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

const LeadsFilters = ({ onFiltersChange, onClearFilters }: LeadsFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    responsible: '',
    company: '',
    stage: '',
    source: '',
    dateRange: '',
    minValue: '',
    maxValue: ''
  });

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Contar filtros ativos
    const activeCount = Object.values(newFilters).filter(v => v !== '').length + (searchTerm ? 1 : 0);
    setActiveFiltersCount(activeCount);
    
    onFiltersChange({ ...newFilters, search: searchTerm });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const activeCount = Object.values(filters).filter(v => v !== '').length + (value ? 1 : 0);
    setActiveFiltersCount(activeCount);
    onFiltersChange({ ...filters, search: value });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      priority: '',
      responsible: '',
      company: '',
      stage: '',
      source: '',
      dateRange: '',
      minValue: '',
      maxValue: ''
    });
    setActiveFiltersCount(0);
    onClearFilters();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Busca principal */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome do lead, empresa ou responsável..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
          Todos os leads
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
          Meus leads
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
          Leads quentes
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
          Vencendo hoje
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
          Atrasados
        </Badge>
      </div>

      {/* Filtros avançados */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Status */}
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="bg-gray-50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os status</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="won">Ganho</SelectItem>
            <SelectItem value="lost">Perdido</SelectItem>
            <SelectItem value="frozen">Congelado</SelectItem>
          </SelectContent>
        </Select>

        {/* Prioridade */}
        <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
          <SelectTrigger className="bg-gray-50">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        {/* Etapa */}
        <Select value={filters.stage} onValueChange={(value) => updateFilter('stage', value)}>
          <SelectTrigger className="bg-gray-50">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as etapas</SelectItem>
            <SelectItem value="contact">Contato Inicial</SelectItem>
            <SelectItem value="meeting">Reunião</SelectItem>
            <SelectItem value="proposal">Proposta</SelectItem>
            <SelectItem value="closing">Fechamento</SelectItem>
          </SelectContent>
        </Select>

        {/* Fonte */}
        <Select value={filters.source} onValueChange={(value) => updateFilter('source', value)}>
          <SelectTrigger className="bg-gray-50">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as origens</SelectItem>
            <SelectItem value="organic">Orgânico</SelectItem>
            <SelectItem value="referral">Indicação</SelectItem>
            <SelectItem value="google_ads">Google Ads</SelectItem>
            <SelectItem value="social_media">Redes Sociais</SelectItem>
            <SelectItem value="cold_call">Cold Call</SelectItem>
          </SelectContent>
        </Select>

        {/* Período */}
        <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
          <SelectTrigger className="bg-gray-50">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os períodos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Este trimestre</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtros de valor */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Valor:</span>
        </div>
        <Input
          placeholder="Valor mín."
          value={filters.minValue}
          onChange={(e) => updateFilter('minValue', e.target.value)}
          className="w-32 bg-gray-50"
          type="number"
        />
        <span className="text-gray-400">até</span>
        <Input
          placeholder="Valor máx."
          value={filters.maxValue}
          onChange={(e) => updateFilter('maxValue', e.target.value)}
          className="w-32 bg-gray-50"
          type="number"
        />
      </div>
    </div>
  );
};

export default LeadsFilters;
