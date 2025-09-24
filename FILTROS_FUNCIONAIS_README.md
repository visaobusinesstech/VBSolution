# Filtros Funcionais - Sistema CRM

## Visão Geral

Substituímos os filtros estáticos das páginas `/activities` e `/projects` por filtros funcionais e inteligentes que permitem uma melhor organização e busca dos dados.

## Filtros Implementados

### 1. **Filtro de Data** 📅
- **Todas as datas**: Mostra todas as atividades/projetos
- **Hoje**: Filtra apenas itens com data de hoje
- **Esta semana**: Filtra itens da semana atual (domingo a sábado)
- **Este mês**: Filtra itens do mês atual
- **Atrasados**: Mostra itens com prazo vencido

### 2. **Filtro de Responsável** 👤
- **Todos os responsáveis**: Mostra itens de todos os funcionários
- **Responsável específico**: Filtra por funcionário selecionado
- Lista dinâmica baseada nos funcionários cadastrados no sistema

### 3. **Filtro Arquivados/Ativos** 📁
- **Ativos**: Mostra apenas itens ativos (padrão)
- **Arquivados**: Mostra apenas itens arquivados
- Botão toggle que muda visualmente quando ativo

### 4. **Filtro de Grupos de Trabalho** 🏢
- **Todos os grupos**: Mostra itens de todos os departamentos
- **Departamento específico**: Filtra por departamento selecionado
- Lista dinâmica baseada nos departamentos configurados

### 5. **Campo de Busca** 🔍
- Busca por texto em títulos e descrições
- Funciona em conjunto com os outros filtros
- Atualização em tempo real

## Funcionalidades

### Botões de Controle
- **Aplicar**: Executa todos os filtros selecionados
- **Limpar**: Remove todos os filtros e volta ao estado inicial

### Aplicação Inteligente
- Os filtros são aplicados de forma inteligente
- Combinações de filtros são suportadas
- Performance otimizada com debounce

## Arquitetura Técnica

### Hook Personalizado: `useFilters`
```typescript
const { filters, updateFilter, clearFilters, getFilterParams } = useFilters();
```

### Componente Reutilizável: `FilterBar`
- Componente React reutilizável
- Props tipadas com TypeScript
- Estilo consistente em todas as páginas

### Estrutura de Filtros
```typescript
interface FilterState {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'overdue';
  responsibleId: 'all' | string;
  archived: boolean;
  workGroup: 'all' | string;
  search: string;
}
```

## Como Usar

### 1. Selecionar Filtros
- Escolha os filtros desejados nos dropdowns
- Use o botão toggle para arquivados/ativos
- Digite no campo de busca

### 2. Aplicar Filtros
- Clique em "Aplicar" para executar os filtros
- Os resultados são atualizados automaticamente

### 3. Limpar Filtros
- Clique em "Limpar" para remover todos os filtros
- Volta ao estado inicial da página

## Páginas Atualizadas

### `/activities`
- Filtros aplicados às atividades
- Busca por nome da tarefa
- Filtros funcionais para todas as visualizações

### `/projects`
- Filtros aplicados aos projetos
- Busca por nome do projeto
- Mesma funcionalidade da página de atividades

## Benefícios

1. **Melhor Organização**: Filtros específicos e relevantes
2. **Busca Eficiente**: Combinação de filtros para resultados precisos
3. **Interface Consistente**: Mesmo padrão em todas as páginas
4. **Performance**: Filtros otimizados e reutilizáveis
5. **Manutenibilidade**: Código limpo e bem estruturado

## Próximas Melhorias

- [ ] Filtros salvos automaticamente
- [ ] Histórico de filtros utilizados
- [ ] Filtros personalizáveis por usuário
- [ ] Exportação de resultados filtrados
- [ ] Filtros avançados com datas customizadas

## Suporte

Para dúvidas ou sugestões sobre os filtros, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento.
