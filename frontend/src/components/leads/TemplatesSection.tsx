import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Send, 
  FileText,
  Mail,
  MessageSquare,
  FileCheck,
  Presentation,
  Eye,
  MoreHorizontal,
  Tag,
  Globe,
  Lock
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'proposal' | 'contract' | 'presentation';
  subject?: string;
  content: string;
  variables: Record<string, any>;
  is_active: boolean;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const TemplatesSection: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Tipos de template disponíveis
  const templateTypes = [
    { value: 'email', label: 'E-mail', icon: Mail, color: 'bg-blue-100 text-blue-800' },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-800' },
    { value: 'proposal', label: 'Proposta', icon: FileCheck, color: 'bg-purple-100 text-purple-800' },
    { value: 'contract', label: 'Contrato', icon: FileText, color: 'bg-orange-100 text-orange-800' },
    { value: 'presentation', label: 'Apresentação', icon: Presentation, color: 'bg-pink-100 text-pink-800' }
  ];

  // Templates de exemplo (em produção viria da API)
  const exampleTemplates: Template[] = [
    {
      id: '1',
      name: 'Proposta Comercial Padrão',
      type: 'proposal',
      subject: 'Proposta Comercial - {{company_name}}',
      content: `Prezado(a) {{contact_name}},

Espero que esteja bem. Gostaria de apresentar nossa proposta comercial para {{company_name}}.

Nossa solução inclui:
- {{product_name}}
- Suporte técnico 24/7
- Implementação completa
- Treinamento da equipe

Valor total: {{price}}
Prazo de entrega: {{delivery_time}}

Aguardamos sua resposta para prosseguirmos.

Atenciosamente,
{{sender_name}}`,
      variables: {
        company_name: 'Nome da empresa',
        contact_name: 'Nome do contato',
        product_name: 'Nome do produto',
        price: 'Valor',
        delivery_time: 'Prazo',
        sender_name: 'Seu nome'
      },
      is_active: true,
      is_public: false,
      tags: ['comercial', 'proposta'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Follow-up WhatsApp',
      type: 'whatsapp',
      content: `Olá {{contact_name}}! 👋

Espero que esteja tudo bem. Gostaria de saber se você teve a oportunidade de revisar nossa proposta para {{company_name}}.

Se tiver alguma dúvida ou precisar de mais informações, estarei aqui para ajudar! 😊

{{sender_name}}`,
      variables: {
        contact_name: 'Nome do contato',
        company_name: 'Nome da empresa',
        sender_name: 'Seu nome'
      },
      is_active: true,
      is_public: true,
      tags: ['whatsapp', 'follow-up'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Convite para Demo',
      type: 'email',
      subject: 'Convite para Demonstração - {{product_name}}',
      content: `Olá {{contact_name}},

Gostaria de convidá-lo(a) para uma demonstração personalizada do {{product_name}}.

Durante a demo, você poderá:
✓ Ver o produto em ação
✓ Tirar todas as suas dúvidas
✓ Entender como se adapta ao seu negócio

Data sugerida: {{demo_date}}
Horário: {{demo_time}}
Duração: 30 minutos

Confirma sua participação?

Atenciosamente,
{{sender_name}}`,
      variables: {
        contact_name: 'Nome do contato',
        product_name: 'Nome do produto',
        demo_date: 'Data da demo',
        demo_time: 'Horário',
        sender_name: 'Seu nome'
      },
      is_active: true,
      is_public: false,
      tags: ['demo', 'convite'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Carregar templates (simulação)
  useEffect(() => {
    setTemplates(exampleTemplates);
  }, []);

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesType;
  });

  // Função para obter ícone do tipo
  const getTypeIcon = (type: string) => {
    const typeConfig = templateTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : FileText;
  };

  // Função para obter cor do tipo
  const getTypeColor = (type: string) => {
    const typeConfig = templateTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.color : 'bg-gray-100 text-gray-800';
  };

  // Função para processar variáveis no conteúdo
  const processVariables = (content: string, variables: Record<string, string>) => {
    let processedContent = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value || `{{${key}}}`);
    });
    return processedContent;
  };

  // Componente do card de template
  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => {
    const TypeIcon = getTypeIcon(template.type);
    
    return (
      <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">{template.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            {template.is_public ? (
              <Globe className="w-4 h-4 text-green-600" title="Público" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" title="Privado" />
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="mb-3">
          <Badge className={getTypeColor(template.type)}>
            {templateTypes.find(t => t.value === template.type)?.label}
          </Badge>
          {template.is_active ? (
            <Badge className="ml-2 bg-green-100 text-green-800">Ativo</Badge>
          ) : (
            <Badge className="ml-2 bg-gray-100 text-gray-800">Inativo</Badge>
          )}
        </div>

        {template.subject && (
          <div className="mb-2">
            <p className="text-sm text-gray-600">
              <strong>Assunto:</strong> {template.subject}
            </p>
          </div>
        )}

        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-3">
            {template.content.substring(0, 150)}...
          </p>
        </div>

        {template.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {template.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Templates</h2>
          <p className="text-gray-600">Gerencie seus modelos de comunicação e documentos</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {templateTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
          <div className="text-sm text-gray-600">Total de Templates</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {templates.filter(t => t.type === 'email').length}
          </div>
          <div className="text-sm text-gray-600">E-mails</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {templates.filter(t => t.type === 'whatsapp').length}
          </div>
          <div className="text-sm text-gray-600">WhatsApp</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">
            {templates.filter(t => t.type === 'proposal').length}
          </div>
          <div className="text-sm text-gray-600">Propostas</div>
        </div>
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 text-lg font-medium mb-2">Nenhum template encontrado</div>
          <div className="text-gray-400 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Ajuste os filtros para encontrar templates' 
              : 'Crie seu primeiro template para começar'
            }
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Template
          </Button>
        </div>
      )}

      {/* Modal de criação/edição de template */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {isCreateModalOpen ? 'Criar Novo Template' : 'Editar Template'}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Template
                  </label>
                  <Input placeholder="Ex: Proposta Comercial Padrão" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assunto (para e-mails)
                </label>
                <Input placeholder="Ex: Proposta Comercial - {{company_name}}" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo
                </label>
                <Textarea 
                  rows={8}
                  placeholder="Digite o conteúdo do template. Use {{variavel}} para variáveis dinâmicas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <Input placeholder="Ex: comercial, proposta, vendas (separadas por vírgula)" />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  Template ativo
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Template público
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button>
                {isCreateModalOpen ? 'Criar Template' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesSection;
