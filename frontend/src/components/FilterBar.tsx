import React, { forwardRef } from 'react';
import { Filter, CalendarDays, Users, Archive, Building2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FilterState } from '@/hooks/useFilters';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  employees: Array<{ id: string; name: string }>;
  departments: string[];
  searchPlaceholder?: string;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  employees,
  departments,
  searchPlaceholder = "Filtrar...",
  searchInputRef
}) => {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* Campo de busca */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder={searchPlaceholder}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Filtros funcionais */}
        <div className="flex items-center gap-2">
          {/* Filtro de Data */}
          <Select value={filters.dateRange} onValueChange={(value) => onFilterChange('dateRange', value)}>
            <SelectTrigger className="h-7 w-16 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
              <CalendarDays className="h-3 w-3 mr-3" />
              <SelectValue placeholder="Data" />
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Data</SelectItem>
              <SelectItem value="today" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Hoje</SelectItem>
              <SelectItem value="week" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Esta semana</SelectItem>
              <SelectItem value="month" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Este mês</SelectItem>
              <SelectItem value="overdue" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Atrasados</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Responsável */}
          <Select value={filters.responsibleId} onValueChange={(value) => onFilterChange('responsibleId', value)}>
            <SelectTrigger className="h-7 w-28 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
              <Users className="h-3 w-3 mr-3" />
              <SelectValue placeholder="Responsável" />
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Responsável</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id} className="hover:bg-gray-100 focus:bg-gray-100 text-xs">
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro Arquivados/Ativos */}
          <Button
            variant={filters.archived ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange('archived', !filters.archived)}
            className={`h-7 px-2 text-xs font-medium shadow-none border-0 bg-transparent text-gray-900 hover:bg-blue-50 focus:bg-blue-50`}
          >
            <Archive className="h-3 w-3 mr-1" />
            {filters.archived ? 'Arquivados' : 'Ativos'}
          </Button>

          {/* Filtro de Grupos de Trabalho */}
          <Select value={filters.workGroup} onValueChange={(value) => onFilterChange('workGroup', value)}>
            <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-gray-900 text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
              <Building2 className="h-3 w-3 mr-3" />
              <SelectValue placeholder="Grupos" />
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 text-xs">Grupos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept} className="hover:bg-gray-100 focus:bg-gray-100 text-xs">
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
