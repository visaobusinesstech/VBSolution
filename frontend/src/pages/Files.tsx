
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  Search,
  Plus,
  FileText,
  Globe,
  Database,
  Users,
  MoreHorizontal,
  Calendar,
  Eye,
  ArrowUpDown,
  Filter,
  Star,
  X,
  Upload,
  Link,
  Copy,
  FolderPlus,
  AlignJustify,
  Clock,
  Folder,
  Lock,
  Share,
  User
} from 'lucide-react';

const Files = () => {
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [viewMode, setViewMode] = useState<'todos' | 'meus-documentos' | 'compartilhado' | 'privado' | 'espaco-de-trabalho' | 'recentes'>('todos');

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    setDocumentType('');
    setDocumentTitle('');
    setDocumentDescription('');
  };

  const handleCreateDocument = () => {
    // Lógica para criar documento
    console.log('Criando documento:', { documentType, documentTitle, documentDescription });
    setIsCreateModalOpen(false);
    // Aqui você pode adicionar a lógica para salvar o documento
  };

  const handleViewModeChange = (mode: 'todos' | 'meus-documentos' | 'compartilhado' | 'privado' | 'espaco-de-trabalho' | 'recentes') => {
    setViewMode(mode);
  };

  // Botões de visualização seguindo o padrão de Activities
  const viewButtons = [
    { 
      id: 'todos', 
      label: 'Todos',
      icon: FileText,
      active: viewMode === 'todos'
    },
    {
      id: 'meus-documentos', 
      label: 'Meus documentos',
      icon: User,
      active: viewMode === 'meus-documentos'
    },
    {
      id: 'compartilhado', 
      label: 'Compartilhado',
      icon: Share,
      active: viewMode === 'compartilhado'
    },
    {
      id: 'privado', 
      label: 'Privado',
      icon: Lock,
      active: viewMode === 'privado'
    },
    {
      id: 'espaco-de-trabalho', 
      label: 'Espaço de trabalho',
      icon: Folder,
      active: viewMode === 'espaco-de-trabalho'
    },
    {
      id: 'recentes', 
      label: 'Recentes',
      icon: Clock,
      active: viewMode === 'recentes'
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      {/* Faixa branca contínua com botões de navegação seguindo o padrão de Activities */}
      <div className="bg-white -mt-6 -mx-6">
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão fixo de toggle da sidebar - SEMPRE VISÍVEL quando colapsada */}
              {!sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={14} />
                </Button>
              )}
              
              {viewButtons.map((button) => {
                const Icon = button.icon;
                return (
                  <Button
                    key={button.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewModeChange(button.id as any)}
                    className={`
                      h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                      ${button.active 
                        ? 'bg-gray-50 text-slate-900 shadow-inner' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {button.label}
                  </Button>
                );
              })}
            </div>
            
            {/* Botões de ação na extrema direita */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors"
                title="Buscar"
              >
                <Search className="h-4 w-4 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="px-6 py-6">
        <div className="flex gap-6">
              {/* Left Sidebar - Fixed Cards */}
              <div className="w-80 flex-shrink-0">
                <div className="space-y-4">
                  {/* Recente */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                      </div>
                      <h3 className="font-medium text-gray-900">Recente</h3>
                    </div>
                    <p className="text-sm text-gray-500">Seus documentos abertos recentemente serão exibidos aqui.</p>
                  </Card>

                  {/* Favoritos */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Star className="w-5 h-5 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-900">Favoritos</h3>
                    </div>
                    <p className="text-sm text-gray-500">Seus documentos favoritos serão exibidos aqui.</p>
                  </Card>

                  {/* Criados por mim */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                      </div>
                      <h3 className="font-medium text-gray-900">Criados por mim</h3>
                    </div>
                    <p className="text-sm text-gray-500">Todos os documentos criados por você serão exibidos aqui.</p>
                  </Card>
                </div>
              </div>

              {/* Right Content Area - File Lists */}
              <div className="flex-1">
                {viewMode === 'todos' && (
                  <div className="mt-0">
                  {/* Documents Table */}
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-left font-medium text-gray-700 py-3">
                            <div className="flex items-center gap-2">
                              Nome
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-3">Localização</TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-3">Etiquetas</TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-3">
                            <div className="flex items-center gap-2">
                              Data de atualização
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-3">
                            <div className="flex items-center gap-2">
                              Data de visualização
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-left font-medium text-gray-700 py-3">Compartilhamento</TableHead>
                          <TableHead className="w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Empty state */}
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="text-center">
                                <h3 className="font-medium text-gray-900 mb-1">Nenhum documento encontrado</h3>
                                <p className="text-sm text-gray-500">Você ainda não criou nenhum documento. Clique no botão + para criar seu primeiro documento.</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                  </div>
                )}

                {viewMode === 'meus-documentos' && (
                  <Card>
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Seus documentos aparecerão aqui.</p>
                    </div>
                  </Card>
                )}

                {viewMode === 'compartilhado' && (
                  <Card>
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Documentos compartilhados aparecerão aqui.</p>
                    </div>
                  </Card>
                )}

                {viewMode === 'privado' && (
                  <Card>
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Documentos privados aparecerão aqui.</p>
                    </div>
                  </Card>
                )}

                {viewMode === 'espaco-de-trabalho' && (
                  <Card>
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Documentos do espaço de trabalho aparecerão aqui.</p>
                    </div>
                  </Card>
                )}

                {viewMode === 'recentes' && (
                  <Card>
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Documentos atribuídos aparecerão aqui.</p>
                    </div>
                  </Card>
                )}

              </div>
            </div>
          </div>
      </div>

      {/* Botão flutuante de novo documento */}
      <Button
        onClick={handleOpenCreateModal}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 transition-colors duration-200"
        style={{
          backgroundColor: '#021529',
          borderColor: '#021529'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#001122';
          e.currentTarget.style.borderColor = '#001122';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#021529';
          e.currentTarget.style.borderColor = '#021529';
        }}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* Modal de criação de documento */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Criar Novo Documento</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Escolha o tipo de documento que deseja criar
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6">
                <div className="space-y-6">
                  {/* Tipo de Documento */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Tipo de Documento</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Card 
                        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          documentType === 'wiki' ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setDocumentType('wiki')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                            <Database className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Wiki</h4>
                            <p className="text-xs text-gray-600">Base de conhecimento</p>
                          </div>
                        </div>
                      </Card>

                      <Card 
                        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          documentType === 'documento' ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setDocumentType('documento')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Documento</h4>
                            <p className="text-xs text-gray-600">Documento padrão</p>
                          </div>
                        </div>
                      </Card>

                      <Card 
                        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          documentType === 'proposta' ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setDocumentType('proposta')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Proposta</h4>
                            <p className="text-xs text-gray-600">Proposta comercial</p>
                          </div>
                        </div>
                      </Card>

                      <Card 
                        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          documentType === 'pagina' ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setDocumentType('pagina')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Página</h4>
                            <p className="text-xs text-gray-600">Página da empresa</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Ações Rápidas</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <Card className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-teal-100 flex items-center justify-center">
                            <Upload className="w-4 h-4 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Upload de Arquivo</h4>
                            <p className="text-xs text-gray-600">Fazer upload de um arquivo existente</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center">
                            <Link className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Importar do Link</h4>
                            <p className="text-xs text-gray-600">Importar conteúdo de uma URL</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                            <Copy className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Duplicar Documento</h4>
                            <p className="text-xs text-gray-600">Criar cópia de documento existente</p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center">
                            <FolderPlus className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Nova Pasta</h4>
                            <p className="text-xs text-gray-600">Criar uma nova pasta para organização</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Formulário condicional */}
                  {documentType && (
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="text-sm font-medium text-gray-900">Detalhes do {documentType}</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título
                          </label>
                          <Input
                            placeholder={`Nome do ${documentType}`}
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição (opcional)
                          </label>
                          <textarea
                            placeholder={`Breve descrição do ${documentType}`}
                            value={documentDescription}
                            onChange={(e) => setDocumentDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateDocument}
                  disabled={!documentType || !documentTitle}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Criar {documentType}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Files;
