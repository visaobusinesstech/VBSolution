
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeSelectItem } from '@/components/ui/safe-select-item';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, CheckCircle2, Archive, Trash2 } from 'lucide-react';
import { Company } from '@/hooks/useCompanies';
import { FunnelStage } from '@/hooks/useFunnelStages';
import { createSafeSelectItems } from '@/utils/selectValidation';

interface LeadsFiltersBarProps {
  filters: {
    search: string;
    company: string;
    responsible: string;
    stage: string;
    status: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: any) => void;
  companies: Company[];
  stages: FunnelStage[];
  selectedCount?: number;
  onBulkAction?: (action: string) => void;
  onClearSelection?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

const LeadsFiltersBar = ({
  filters,
  onFiltersChange,
  companies,
  stages,
  selectedCount = 0,
  onBulkAction = () => {},
  onClearSelection = () => {},
  searchInputRef
}: LeadsFiltersBarProps) => {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      company: '',
      responsible: '',
      stage: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'all'
  );

  // Create safe select items for companies and stages with enhanced validation
  const companyItems = createSafeSelectItems(
    (companies || []).filter(company => company && company.id && company.fantasy_name),
    (company) => company.id,
    (company) => company.fantasy_name,
    'company-filter'
  );

  const stageItems = createSafeSelectItems(
    (stages || []).filter(stage => stage && stage.id && stage.name),
    (stage) => stage.id,
    (stage) => stage.name,
    'stage-filter'
  );

  return (
    <div className="space-y-4">
      {/* Barra principal de filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar leads ou empresas..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Select value={filters.company || 'all-companies'} onValueChange={(value) => updateFilter('company', value === 'all-companies' ? '' : value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SafeSelectItem value="all-companies">Todas</SafeSelectItem>
              {companyItems.map((item) => (
                <SafeSelectItem key={item.key} value={item.value}>
                  {item.label}
                </SafeSelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.stage || 'all-stages'} onValueChange={(value) => updateFilter('stage', value === 'all-stages' ? '' : value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              <SafeSelectItem value="all-stages">Todas</SafeSelectItem>
              {stageItems.map((item) => (
                <SafeSelectItem key={item.key} value={item.value}>
                  {item.label}
                </SafeSelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SafeSelectItem value="all">Status</SafeSelectItem>
              <SafeSelectItem value="open">Ativo</SafeSelectItem>
              <SafeSelectItem value="won">Ganho</SafeSelectItem>
              <SafeSelectItem value="lost">Perdido</SafeSelectItem>
              <SafeSelectItem value="frozen">Congelado</SafeSelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Barra de ações em lote */}
      {selectedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {selectedCount} selecionados
            </Badge>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Limpar seleção
            </Button>
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
      )}
    </div>
  );
};

export default LeadsFiltersBar;
