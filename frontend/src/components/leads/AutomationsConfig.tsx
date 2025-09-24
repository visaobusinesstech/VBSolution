
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Plus, 
  Zap, 
  Clock,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Bell,
  Target,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AutomationsConfig = () => {
  const [automations, setAutomations] = useState([
    {
      id: '1',
      name: 'Follow-up automático após 3 dias',
      description: 'Criar tarefa de follow-up quando um lead fica 3 dias na mesma etapa',
      trigger: 'Tempo na etapa > 3 dias',
      action: 'Criar tarefa de ligação',
      status: 'active',
      category: 'follow-up'
    },
    {
      id: '2',
      name: 'Notificação de lead quente',
      description: 'Enviar notificação quando lead tem alta prioridade e valor > R$ 50.000',
      trigger: 'Prioridade = Alta E Valor > R$ 50.000',
      action: 'Notificar responsável',
      status: 'active',
      category: 'notification'
    },
    {
      id: '3',
      name: 'E-mail de boas-vindas',
      description: 'Enviar e-mail de boas-vindas quando um novo lead é criado',
      trigger: 'Novo lead criado',
      action: 'Enviar e-mail modelo',
      status: 'inactive',
      category: 'email'
    },
    {
      id: '4',
      name: 'Alerta de oportunidade perdida',
      description: 'Notificar gerente quando lead é marcado como perdido com valor > R$ 30.000',
      trigger: 'Status = Perdido E Valor > R$ 30.000',
      action: 'Notificar gerente',
      status: 'active',
      category: 'alert'
    }
  ]);

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(automation => 
      automation.id === id 
        ? { ...automation, status: automation.status === 'active' ? 'inactive' : 'active' }
        : automation
    ));
    
    toast({
      title: "Automação atualizada",
      description: "Status da automação foi alterado com sucesso!",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'follow-up':
        return <Clock className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'alert':
        return <Target className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'follow-up':
        return 'bg-blue-100 text-blue-800';
      case 'notification':
        return 'bg-purple-100 text-purple-800';
      case 'email':
        return 'bg-green-100 text-green-800';
      case 'alert':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Automações do Pipeline
          </h2>
          <p className="text-gray-600 mt-1">
            Configure regras automáticas para otimizar seu processo de vendas
          </p>
        </div>
        
        <Button className="text-white hover:opacity-90" style={{ backgroundColor: '#4A5477' }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Automações Ativas</p>
                <p className="text-2xl font-bold">
                  {automations.filter(a => a.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Execuções Hoje</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Economizado</p>
                <p className="text-2xl font-bold">12h</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Automações */}
      <div className="grid grid-cols-1 gap-4">
        {automations.map((automation) => (
          <Card key={automation.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${getCategoryColor(automation.category)}`}>
                    {getCategoryIcon(automation.category)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{automation.name}</h3>
                      <Badge 
                        variant={automation.status === 'active' ? 'default' : 'secondary'}
                        className={automation.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {automation.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{automation.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Gatilho:</span>
                        <p className="text-gray-600 bg-gray-50 p-2 rounded mt-1">
                          {automation.trigger}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Ação:</span>
                        <p className="text-gray-600 bg-gray-50 p-2 rounded mt-1">
                          {automation.action}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <Switch
                    checked={automation.status === 'active'}
                    onCheckedChange={() => toggleAutomation(automation.id)}
                  />
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modelos de Automação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Modelos de Automação Populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Phone className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium">Follow-up Inteligente</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Cria automaticamente tarefas de follow-up baseadas no tempo e comportamento do lead
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Usar Modelo
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium">Sequência de E-mails</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Envia sequência de e-mails personalizados baseada na etapa do lead
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Usar Modelo
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Bell className="h-5 w-5 text-orange-500" />
                  <h4 className="font-medium">Alertas de Alta Prioridade</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Notifica a equipe quando leads importantes precisam de atenção urgente
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Usar Modelo
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium">WhatsApp Automático</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Envia mensagens do WhatsApp em momentos estratégicos do funil
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Usar Modelo
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationsConfig;
