# 🔍 Debug - Problema de Fornecedores

## ❌ Problema Identificado

A página de fornecedores está mostrando o erro:
```
Erro ao carregar fornecedores: Erro ao criar fornecedor
```

## 🔧 Modificações de Debug Implementadas

### **1. Logs Detalhados Adicionados**

#### **Hook `useSuppliers`:**
- ✅ Logs no `fetchSuppliers` para rastrear o processo de busca
- ✅ Logs no `useEffect` para verificar mudanças de estado
- ✅ Logs no `useAuth` para verificar autenticação
- ✅ Estado inicial de `loading` alterado para `false`

#### **Hook `useAuth`:**
- ✅ Logs para verificar o contexto de autenticação
- ✅ Verificação de estado do usuário

### **2. Melhorias na Lógica**

#### **useEffect Melhorado:**
```typescript
useEffect(() => {
  // Só executar se o auth não estiver carregando
  if (!auth.loading) {
    if (user) {
      fetchSuppliers();
    } else {
      setSuppliers([]);
      setError(null);
      setLoading(false);
    }
  }
}, [user, auth.loading, auth.error]);
```

## 🧪 Como Debugar

### **Método 1: Console do Navegador**

1. **Abra o console do navegador** (F12)
2. **Acesse a página de fornecedores** (`/suppliers`)
3. **Verifique os logs** que aparecerão:

```
🔍 useAuth: Contexto de autenticação: {user: "email@exemplo.com (user-id)", loading: false, error: null}
🔍 useSuppliers: Hook de autenticação: {user: "email@exemplo.com (user-id)", loading: false, error: null}
🔄 useSuppliers useEffect: Estado mudou: {user: "email@exemplo.com (user-id)", authLoading: false, authError: null}
✅ useSuppliers useEffect: Usuário autenticado, buscando fornecedores...
🔍 fetchSuppliers: Iniciando busca de fornecedores...
👤 fetchSuppliers: Usuário: email@exemplo.com (user-id)
📡 fetchSuppliers: Fazendo consulta ao Supabase...
```

### **Método 2: Script de Debug HTML**

1. **Abra `test_suppliers_debug.html`** no navegador
2. **Configure as credenciais do Supabase** no script
3. **Execute os testes sequencialmente:**
   - Testar Conexão
   - Verificar Usuário Logado
   - Verificar Tabela Suppliers
   - Buscar Fornecedores
   - Criar Fornecedor Teste
   - Verificar RLS

### **Método 3: Script SQL**

1. **Execute `debug_suppliers_issue.sql`** no Supabase SQL Editor
2. **Verifique:**
   - Se a tabela `suppliers` existe
   - Se RLS está habilitado
   - Se há políticas RLS configuradas
   - Se há dados na tabela
   - Se há dados para o usuário logado

## 🔍 Possíveis Causas do Problema

### **1. Problema de Autenticação**
```
❌ Usuário não autenticado
```
**Solução:** Verificar se o usuário está logado corretamente

### **2. Problema de RLS (Row Level Security)**
```
❌ new row violates row-level security policy
```
**Solução:** Verificar se as políticas RLS estão configuradas corretamente

### **3. Problema de Schema**
```
❌ column "campo" does not exist
```
**Solução:** Verificar se a tabela `suppliers` tem todos os campos necessários

### **4. Problema de Conexão**
```
❌ Failed to fetch
```
**Solução:** Verificar se as credenciais do Supabase estão corretas

### **5. Problema de Estado**
```
❌ Hook executando antes do usuário estar carregado
```
**Solução:** Verificar se o `useEffect` está aguardando o carregamento do auth

## 📊 Checklist de Debug

### **✅ Verificações Básicas:**

- [ ] **Usuário está logado?** (Verificar no console)
- [ ] **Tabela suppliers existe?** (Verificar no Supabase)
- [ ] **RLS está ativo?** (Verificar no Supabase)
- [ ] **Políticas RLS configuradas?** (Verificar no Supabase)
- [ ] **Credenciais do Supabase corretas?** (Verificar no .env)

### **✅ Verificações Avançadas:**

- [ ] **Logs aparecem no console?** (Verificar se os logs estão funcionando)
- [ ] **useEffect está executando?** (Verificar se o hook está sendo chamado)
- [ ] **fetchSuppliers está sendo chamado?** (Verificar se a função está executando)
- [ ] **Erro específico no Supabase?** (Verificar se há erro específico)

## 🚀 Próximos Passos

1. **Execute o debug** usando os métodos acima
2. **Identifique a causa específica** do problema
3. **Aplique a correção** baseada na causa identificada
4. **Teste a solução** criando um fornecedor

## 📋 Logs Esperados (Funcionando)

```
🔍 useAuth: Contexto de autenticação: {user: "email@exemplo.com (user-id)", loading: false, error: null}
🔍 useSuppliers: Hook de autenticação: {user: "email@exemplo.com (user-id)", loading: false, error: null}
🔄 useSuppliers useEffect: Estado mudou: {user: "email@exemplo.com (user-id)", authLoading: false, authError: null}
✅ useSuppliers useEffect: Usuário autenticado, buscando fornecedores...
🔍 fetchSuppliers: Iniciando busca de fornecedores...
👤 fetchSuppliers: Usuário: email@exemplo.com (user-id)
📡 fetchSuppliers: Fazendo consulta ao Supabase...
✅ fetchSuppliers: Dados recebidos: 0 fornecedores
🏁 fetchSuppliers: Busca finalizada
```

---

**🔍 Execute o debug e identifique a causa específica do problema!**
