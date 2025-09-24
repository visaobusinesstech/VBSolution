
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Calendar, Zap } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SalesGoal {
  id: string;
  month: string;
  year: number;
  targetAmount: number;
  productId?: string;
  productName?: string;
}

interface SalesGoalChartProps {
  goal: SalesGoal | null;
  currentAmount: number;
  monthlyData?: Array<{ day: string; amount: number }>;
}

const SalesGoalChart = ({ goal, currentAmount, monthlyData = [] }: SalesGoalChartProps) => {
  if (!goal) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50">
        <CardContent className="p-8 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">Nenhuma meta definida</p>
          <p className="text-sm text-gray-500">Defina uma meta para acompanhar seu progresso</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.min((currentAmount / goal.targetAmount) * 100, 100);
  const remaining = Math.max(goal.targetAmount - currentAmount, 0);
  const isOverTarget = currentAmount > goal.targetAmount;

  const getProgressColor = () => {
    if (isOverTarget) return 'from-green-500 to-emerald-600';
    if (progressPercentage >= 80) return 'from-green-400 to-green-600';
    if (progressPercentage >= 60) return 'from-yellow-400 to-orange-500';
    if (progressPercentage >= 40) return 'from-blue-400 to-blue-600';
    return 'from-red-400 to-red-600';
  };

  const monthName = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ][parseInt(goal.month) - 1];

  const pieData = [
    { name: 'Alcançado', value: currentAmount, color: '#10b981' },
    { name: 'Restante', value: remaining, color: '#e5e7eb' }
  ];

  const chartConfig = {
    amount: {
      label: "Vendas",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header da Meta */}
      <Card className={`
        relative overflow-hidden
        ${isOverTarget 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
        }
      `}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className={`h-5 w-5 ${isOverTarget ? 'text-green-600' : 'text-blue-600'}`} />
              Meta de {monthName} {goal.year}
              {goal.productName && (
                <Badge variant="outline" className="ml-2">
                  {goal.productName}
                </Badge>
              )}
            </CardTitle>
            
            {isOverTarget && (
              <Badge className="bg-green-500 text-white flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Meta Superada!
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Valores principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50">
              <div className="text-2xl font-bold text-gray-900">
                R$ {currentAmount.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Atual
              </div>
            </div>

            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50">
              <div className="text-2xl font-bold text-blue-600">
                R$ {goal.targetAmount.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Target className="h-3 w-3" />
                Meta
              </div>
            </div>

            <div className="text-center p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50">
              <div className={`text-2xl font-bold ${isOverTarget ? 'text-green-600' : 'text-orange-600'}`}>
                {isOverTarget ? '+' : ''}R$ {(isOverTarget ? currentAmount - goal.targetAmount : remaining).toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600">
                {isOverTarget ? 'Excedente' : 'Restante'}
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progresso</span>
              <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="relative">
              <Progress 
                value={progressPercentage} 
                className="h-4 bg-white/50"
              />
              <div 
                className={`absolute top-0 left-0 h-4 bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Distribuição da Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Vendas Diárias */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Vendas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Vendas']}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="url(#colorGradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesGoalChart;
