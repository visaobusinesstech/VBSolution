
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVB } from '@/contexts/VBContext';
import { 
  BarChart3, 
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  Target,
  Calendar,
  Clock
} from 'lucide-react';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';

const Reports = () => {
  const { state } = useVB();
  const { companies, employees, activities, products, settings } = state;
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Dados calculados
  const totalCompanies = companies.length;
  const totalEmployees = employees.length;
  const totalActivities = activities.length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const conversionRate = totalCompanies > 0 ? (completedActivities / totalCompanies * 100) : 0;

  // Dados para gráficos
  const companiesByStage = settings.funnelStages.map(stage => ({
    name: stage.name,
    value: companies.filter(c => c.funnelStage === stage.id).length,
    color: stage.color
  }));

  const activitiesByEmployee = employees.map(employee => ({
    name: employee.name.split(' ')[0],
    activities: activities.filter(a => a.responsibleId === employee.id).length,
    completed: activities.filter(a => a.responsibleId === employee.id && a.status === 'completed').length
  }));

  const activitiesByType = [
    { name: 'Ligações', value: activities.filter(a => a.type === 'call').length, color: '#3b82f6' },
    { name: 'Reuniões', value: activities.filter(a => a.type === 'meeting').length, color: '#8b5cf6' },
    { name: 'Tarefas', value: activities.filter(a => a.type === 'task').length, color: '#10b981' },
    { name: 'Outros', value: activities.filter(a => a.type === 'other').length, color: '#f59e0b' }
  ];

  const departmentStats = settings.departments.map(dept => ({
    name: dept,
    employees: employees.filter(emp => emp.department === dept).length,
    activities: activities.filter(a => {
      const responsible = employees.find(emp => emp.id === a.responsibleId);
      return responsible?.department === dept;
    }).length
  }));

  const [monthlyTrend, setMonthlyTrend] = useState([]);

  useEffect(() => {
    fetchMonthlyTrend();
  }, [selectedPeriod]);

  const fetchMonthlyTrend = async () => {
    try {
      // Buscar tendência mensal do Supabase
      // Por enquanto, array vazio
      setMonthlyTrend([]);
    } catch (error) {
      console.error('Erro ao buscar tendência mensal:', error);
    }
  };

  const productPerformance = products.map(product => ({
    name: product.name,
    value: product.basePrice,
    type: product.type,
    category: product.category
  }));

  const exportReport = (reportType: string) => {
    // Aqui você implementaria a lógica de exportação
    console.log(`Exportando relatório: ${reportType}`);
    // Em uma implementação real, você geraria e baixaria um arquivo PDF/Excel
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e Análises</h1>
          <p className="text-muted-foreground">
            Análises detalhadas do desempenho da equipe e resultados do negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport('geral')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="vb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 245.8k</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +12.5% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +2.1% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">R$ 12.5k</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              -3.2% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtividade</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">87%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              +5.8% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução temporal */}
        <Card className="vb-card">
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>
              Acompanhamento de empresas, atividades e conversões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="companies" 
                  stroke="#3b82f6" 
                  name="Empresas"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="activities" 
                  stroke="#8b5cf6" 
                  name="Atividades"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#10b981" 
                  name="Conversões"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição do funil */}
        <Card className="vb-card">
          <CardHeader>
            <CardTitle>Distribuição do Funil</CardTitle>
            <CardDescription>
              Empresas por etapa do pipeline de vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={companiesByStage}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {companiesByStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análises por equipe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance por funcionário */}
        <Card className="vb-card">
          <CardHeader>
            <CardTitle>Performance por Funcionário</CardTitle>
            <CardDescription>
              Atividades realizadas e concluídas por pessoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activitiesByEmployee}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="activities" fill="#3b82f6" name="Total" />
                <Bar dataKey="completed" fill="#10b981" name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Atividades por tipo */}
        <Card className="vb-card">
          <CardHeader>
            <CardTitle>Atividades por Tipo</CardTitle>
            <CardDescription>
              Distribuição das atividades realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activitiesByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {activitiesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análises por departamento */}
      <Card className="vb-card">
        <CardHeader>
          <CardTitle>Performance por Departamento</CardTitle>
          <CardDescription>
            Análise de produtividade e distribuição por setor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="employees" fill="#3b82f6" name="Funcionários" />
              <Bar dataKey="activities" fill="#10b981" name="Atividades" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Relatórios rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="vb-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total cadastradas:</span>
              <span className="font-medium">{totalCompanies}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ativas no funil:</span>
              <span className="font-medium">{companies.filter(c => c.funnelStage !== 'fechamento').length}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => exportReport('empresas')}
            >
              <Download className="mr-2 h-3 w-3" />
              Exportar
            </Button>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total na equipe:</span>
              <span className="font-medium">{totalEmployees}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ativos este mês:</span>
              <span className="font-medium">{employees.filter(e => activities.some(a => a.responsibleId === e.id)).length}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => exportReport('funcionarios')}
            >
              <Download className="mr-2 h-3 w-3" />
              Exportar
            </Button>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Atividades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total realizadas:</span>
              <span className="font-medium">{totalActivities}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Taxa de conclusão:</span>
              <span className="font-medium">{((completedActivities / totalActivities) * 100).toFixed(1)}%</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => exportReport('atividades')}
            >
              <Download className="mr-2 h-3 w-3" />
              Exportar
            </Button>
          </CardContent>
        </Card>

        <Card className="vb-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taxa conversão:</span>
              <span className="font-medium">{conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ticket médio:</span>
              <span className="font-medium">R$ 12.5k</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => exportReport('vendas')}
            >
              <Download className="mr-2 h-3 w-3" />
              Exportar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
