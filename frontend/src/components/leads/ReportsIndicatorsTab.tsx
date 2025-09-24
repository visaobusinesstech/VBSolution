
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, Target, Users, Clock, Trophy, AlertTriangle } from 'lucide-react';
import { LeadWithDetails } from '@/hooks/useLeads';
import { FunnelStage } from '@/hooks/useFunnelStages';

interface ReportsIndicatorsTabProps {
  leads: LeadWithDetails[];
  stages: FunnelStage[];
}

const ReportsIndicatorsTab = ({ leads, stages }: ReportsIndicatorsTabProps) => {
  // Calcular métricas
  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.status === 'won');
  const lostLeads = leads.filter(l => l.status === 'lost');
  const openLeads = leads.filter(l => l.status === 'open');
  
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = wonLeads.reduce((sum, lead) => sum + lead.value, 0);
  
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0;
  const averageTicket = wonLeads.length > 0 ? wonValue / wonLeads.length : 0;

  // Métricas por etapa
  const stageMetrics = stages.map(stage => {
    const stageLeads = leads.filter(l => l.stage_id === stage.id);
    const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
    
    return {
      ...stage,
      leadCount: stageLeads.length,
      totalValue: stageValue,
      conversionRate: totalLeads > 0 ? Math.round((stageLeads.length / totalLeads) * 100) : 0
    };
  });

  // Tempo médio no funil (simulado)
  const averageDaysInFunnel = 24;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Relatórios e Indicadores</h2>
          <p className="text-gray-600 mt-1">
            Acompanhe o desempenho do seu pipeline de vendas
          </p>
        </div>
        
        <div className="flex gap-3">
          <Select defaultValue="30">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Indicadores principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalLeads}</div>
            <p className="text-xs text-gray-600">
              <span className="text-green-600">+12%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Valor Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {totalValue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-600">
              <span className="text-green-600">+8%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{conversionRate}%</div>
            <p className="text-xs text-gray-600">
              <span className="text-red-600">-2%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
            <Trophy className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {averageTicket.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-gray-600">
              <span className="text-green-600">+15%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Negócios Ganhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-green-600">{wonLeads.length}</span>
              <Badge className="bg-green-100 text-green-800">
                R$ {wonValue.toLocaleString('pt-BR')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Negócios Perdidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-red-600">{lostLeads.length}</span>
              <Badge className="bg-red-100 text-red-800">
                R$ {lostLeads.reduce((sum, l) => sum + l.value, 0).toLocaleString('pt-BR')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {totalLeads > 0 ? Math.round((lostLeads.length / totalLeads) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Negócios Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-blue-600">{openLeads.length}</span>
              <Badge className="bg-blue-100 text-blue-800">
                R$ {openLeads.reduce((sum, l) => sum + l.value, 0).toLocaleString('pt-BR')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {totalLeads > 0 ? Math.round((openLeads.length / totalLeads) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance por etapa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stageMetrics.map((stage, index) => (
              <div key={stage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium text-gray-900">{stage.name}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{stage.leadCount}</div>
                    <div className="text-gray-600">leads</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">
                      R$ {stage.totalValue.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-gray-600">valor</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{stage.conversionRate}%</div>
                    <div className="text-gray-600">do pipeline</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tempo Médio no Funil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {averageDaysInFunnel} dias
            </div>
            <p className="text-gray-600">
              Tempo médio desde a criação até o fechamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-yellow-800">
                    3 leads sem atividade há mais de 7 dias
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-red-50 rounded border-l-4 border-red-400">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-800">
                    2 leads com data de fechamento vencida
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsIndicatorsTab;
