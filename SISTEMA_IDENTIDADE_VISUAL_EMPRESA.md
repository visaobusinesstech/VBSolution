# 🎨 Sistema de Identidade Visual por Empresa

## 📋 Visão Geral

O sistema de identidade visual permite que cada empresa personalize as cores da **sidebar**, **topbar** e **botões de ação** de forma individual, garantindo que as configurações sejam salvas no banco de dados e aplicadas automaticamente.

## 🎯 Funcionalidades Implementadas

### ✅ Cores Personalizáveis
- **Cor da Sidebar**: Personaliza a cor de fundo da barra lateral
- **Cor da Topbar**: Personaliza a cor de fundo da barra superior
- **Cor dos Botões**: Personaliza a cor dos botões de ação primários e secundários

### ✅ Características Técnicas
- **Isolamento por Empresa**: Cada empresa tem suas próprias cores salvas no banco
- **Aplicação Automática**: Cores são carregadas automaticamente ao fazer login
- **Persistência**: Configurações salvas no Supabase
- **Interface Simplificada**: Apenas 3 opções de cores na tela de configurações

## 🗄️ Estrutura do Banco de Dados

### Tabela: `company_settings`
```sql
-- Colunas adicionadas para identidade visual
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#dee2e3',
ADD COLUMN IF NOT EXISTS topbar_color TEXT DEFAULT '#3F30F1',
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#4A5477';
```

### Valores Padrão
- **Sidebar**: `#dee2e3` (cinza claro)
- **Topbar**: `#3F30F1` (azul roxo)
- **Botões**: `#4A5477` (azul escuro)

## 🔧 Implementação Técnica

### 1. Interface TypeScript
```typescript
export interface CompanySettings {
  // ... outras propriedades
  sidebar_color: string;
  topbar_color: string;
  button_color: string;
}
```

### 2. Variáveis CSS
```css
:root {
  --sidebar-color: #dee2e3;
  --topbar-color: #3F30F1;
  --button-color: #4A5477;
}
```

### 3. Aplicação nos Componentes
- **Sidebar**: `backgroundColor: 'var(--sidebar-color)'`
- **Topbar**: `backgroundColor: 'var(--topbar-color)'`
- **Botões**: `backgroundColor: 'var(--button-color)'`

### 4. Carregamento Automático
O `ThemeContext` carrega automaticamente as cores da empresa quando o usuário faz login:

```typescript
const loadCompanyTheme = async () => {
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('sidebar_color, topbar_color, button_color')
    .eq('company_id', user.id)
    .single();
  
  // Aplicar cores nas variáveis CSS
  document.documentElement.style.setProperty('--sidebar-color', companySettings.sidebar_color);
  document.documentElement.style.setProperty('--topbar-color', companySettings.topbar_color);
  document.documentElement.style.setProperty('--button-color', companySettings.button_color);
};
```

## 🎨 Interface do Usuário

### Localização
**Configurações > Empresa > Identidade Visual**

### Componentes da Interface
1. **ColorPicker para Sidebar**: Seletor de cor para a barra lateral
2. **ColorPicker para Topbar**: Seletor de cor para a barra superior  
3. **ColorPicker para Botões**: Seletor de cor para botões de ação
4. **Botão Salvar**: Aplica e salva as configurações

### Remoções Realizadas
- ❌ Cor Primária (removida)
- ❌ Cor Secundária (removida)  
- ❌ Cor de Destaque (removida)
- ✅ Mantidas apenas as 3 cores específicas solicitadas

## 🚀 Como Usar

### Para Administradores
1. Acesse **Configurações** no menu lateral
2. Vá para a aba **Empresa**
3. Role até a seção **Identidade Visual**
4. Clique nos seletores de cor para personalizar:
   - Cor da Sidebar
   - Cor da Topbar
   - Cor dos Botões
5. Clique em **Salvar** para aplicar as mudanças

### Aplicação Automática
- As cores são aplicadas imediatamente após salvar
- As configurações persistem entre sessões
- Cada empresa mantém suas cores individuais

## 🧪 Teste do Sistema

### Script de Teste
Execute o arquivo `test_company_theme_system.js` no console do navegador:

```javascript
// Testar variáveis CSS
window.testCompanyTheme.testCSSVariables();

// Testar estilos dos componentes
window.testCompanyTheme.testComponentStyles();

// Simular mudança de cores
window.testCompanyTheme.simulateColorChange();
```

### Verificações Manuais
1. **Sidebar**: Deve usar a cor configurada como fundo
2. **Topbar**: Deve usar a cor configurada como fundo
3. **Botões**: Devem usar a cor configurada para fundo e borda
4. **Persistência**: Cores devem ser mantidas após recarregar a página

## 📁 Arquivos Modificados

### Backend/Database
- `add_theme_colors_to_company_settings.sql` - Script de migração
- `frontend/src/integrations/supabase/types.ts` - Tipos TypeScript

### Frontend
- `frontend/src/hooks/useCompanySettings.ts` - Interface atualizada
- `frontend/src/contexts/ThemeContext.tsx` - Carregamento automático
- `frontend/src/pages/Settings.tsx` - Interface simplificada
- `frontend/src/components/BitrixSidebar.tsx` - Aplicação da cor
- `frontend/src/components/BitrixTopbar.tsx` - Aplicação da cor
- `frontend/src/hooks/useButtonColors.ts` - Aplicação da cor
- `frontend/src/index.css` - Variáveis CSS

### Testes
- `test_company_theme_system.js` - Script de teste
- `SISTEMA_IDENTIDADE_VISUAL_EMPRESA.md` - Documentação

## ✅ Status Final

- ✅ Schema do banco atualizado
- ✅ Interface simplificada (apenas 3 cores)
- ✅ Cores aplicadas automaticamente
- ✅ Persistência por empresa
- ✅ Componentes atualizados
- ✅ Sistema de teste implementado

## 🎯 Resultado

O sistema agora permite que cada empresa personalize individualmente apenas as cores da **sidebar**, **topbar** e **botões**, com todas as configurações sendo salvas no banco de dados e aplicadas automaticamente em toda a interface.
