import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  product?: string;
  negotiated_price: number;
  expected_close_date?: string;
  pipeline_stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'won' | 'lost';
  assigned_to?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface LeadsDashboardProps {
  leads: Lead[];
}

const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ leads }) => {
  // Calcular métricas principais
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter(lead => lead.status === 'won').length;
    const lostLeads = leads.filter(lead => lead.status === 'lost').length;
    const activeLeads = leads.filter(lead => !lead.status || lead.status !== 'won' && lead.status !== 'lost').length;
    
    const totalValue = leads.reduce((sum, lead) => sum + (lead.negotiated_price || 0), 0);
    const wonValue = leads.filter(lead => lead.status === 'won').reduce((sum, lead) => sum + (lead.negotiated_price || 0), 0);
    
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    const winRate = (wonLeads + lostLeads) > 0 ? (wonLeads / (wonLeads + lostLeads)) * 100 : 0;
    
    return {
      totalLeads,
      wonLeads,
      lostLeads,
      activeLeads,
      totalValue,
      wonValue,
      conversionRate,
      winRate
    };
  }, [leads]);

  // Dados para gráfico de pipeline por estágio
  const pipelineData = useMemo(() => {
    const stages = [
      'qualified',
      'contact_made', 
      'demo_scheduled',
      'proposal_made',
      'negotiations_started'
    ];
    
    const stageNames = {
      qualified: 'Qualified',
      contact_made: 'Contact Made',
      demo_scheduled: 'Demo Scheduled',
      proposal_made: 'Proposal Made',
      negotiations_started: 'Negotiations Started'
    };

    return stages.map(stage => {
      const stageLeads = leads.filter(lead => lead.pipeline_stage === stage);
      const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.negotiated_price || 0), 0);
      
      return {
        stage: stageNames[stage as keyof typeof stageNames],
        leads: stageLeads.length,
        value: totalValue
      };
    });
  }, [leads]);

  // Dados para gráfico de conversão por mês
  const monthlyData = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthLeads = leads.filter(lead => {
        const leadDate = new Date(lead.created_at);
        return leadDate.getFullYear() === date.getFullYear() && 
               leadDate.getMonth() === date.getMonth();
      });
      
      const monthWon = monthLeads.filter(lead => lead.status === 'won').length;
      const monthLost = monthLeads.filter(lead => lead.status === 'lost').length;
      
      months.push({
        month: monthName,
        total: monthLeads.length,
        won: monthWon,
        lost: monthLost,
        conversion: monthLeads.length > 0 ? (monthWon / monthLeads.length) * 100 : 0
      });
    }
    
    return months;
  }, [leads]);

  // Dados para gráfico de pizza - distribuição por prioridade
  const priorityData = useMemo(() => {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const priorityNames = {
      low: 'Baixa',
      medium: 'Média', 
      high: 'Alta',
      urgent: 'Urgente'
    };
    
    const colors = {
      low: '#10b981',
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444'
    };

    return priorities.map(priority => ({
      name: priorityNames[priority as keyof typeof priorityNames],
      value: leads.filter(lead => lead.priority === priority).length,
      color: colors[priority as keyof typeof colors]
    }));
  }, [leads]);

  // Dados para gráfico de tendência de valor
  const valueTrendData = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthValue = leads
        .filter(lead => {
          const leadDate = new Date(lead.created_at);
          return leadDate.getFullYear() === date.getFullYear() && 
                 leadDate.getMonth() === date.getMonth();
        })
        .reduce((sum, lead) => sum + (lead.negotiated_price || 0), 0);
      
      months.push({
        month: monthName,
        value: monthValue
      });
    }
    
    return months;
  }, [leads]);

  // Componente de métrica
  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {change >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <MetricCard
          title="Leads Ganhos"
          value={metrics.wonLeads}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={<Target className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
        <MetricCard
          title="Valor Total"
          value={metrics.totalValue.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          })}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pipeline */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pipeline por Estágio
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'leads' ? `${value} leads` : `R$ ${Number(value).toLocaleString('pt-BR')}`,
                  name === 'leads' ? 'Leads' : 'Valor'
                ]}
              />
              <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Prioridades */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição por Prioridade
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos de tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Conversão */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendência de Conversão (6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'conversion' ? `${Number(value).toFixed(1)}%` : value,
                  name === 'conversion' ? 'Taxa de Conversão' : 
                  name === 'total' ? 'Total de Leads' :
                  name === 'won' ? 'Leads Ganhos' : 'Leads Perdidos'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="conversion" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tendência de Valor */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Valor por Mês (12 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={valueTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor Total']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumo de performance */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo de Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {metrics.wonLeads}
            </div>
            <div className="text-sm text-gray-600 mb-1">Leads Ganhos</div>
            <div className="text-xs text-green-600">
              {metrics.winRate.toFixed(1)}% de taxa de vitória
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {metrics.lostLeads}
            </div>
            <div className="text-sm text-gray-600 mb-1">Leads Perdidos</div>
            <div className="text-xs text-red-600">
              {(100 - metrics.winRate).toFixed(1)}% de taxa de perda
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {metrics.activeLeads}
            </div>
            <div className="text-sm text-gray-600 mb-1">Leads Ativos</div>
            <div className="text-xs text-blue-600">
              Em andamento no pipeline
            </div>
          </div>
        </div>
      </div>

      {/* Insights e recomendações */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Insights e Recomendações
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Oportunidade de Crescimento</h4>
              <p className="text-sm text-gray-600 mt-1">
                Com {metrics.activeLeads} leads ativos, foque na qualificação e acompanhamento para aumentar a taxa de conversão.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900">Meta de Conversão</h4>
              <p className="text-sm text-gray-600 mt-1">
                Sua taxa atual de {metrics.conversionRate.toFixed(1)}% pode ser melhorada com follow-ups mais frequentes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsDashboard;
