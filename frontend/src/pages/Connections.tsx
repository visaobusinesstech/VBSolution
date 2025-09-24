import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  MessageCircle, 
  Zap, 
  Globe, 
  Calendar, 
  Video, 
  Mail,
  Webhook,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  connectionType: 'whatsapp' | 'webhook' | 'google' | 'facebook' | 'instagram' | 'microsoft' | 'slack' | 'discord';
  config: any;
  isActive: boolean;
  isConnected: boolean;
  lastUsedAt?: string;
  authUrl?: string;
}

interface ConnectionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
}

const Connections: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [categories, setCategories] = useState<ConnectionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showInstagramModal, setShowInstagramModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar categorias
      const categoriesResponse = await fetch('/api/agent-actions/connection-categories');
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);

      // Carregar conexões
      const connectionsResponse = await fetch('/api/agent-actions/connections');
      const connectionsData = await connectionsResponse.json();
      setConnections(connectionsData);

      // Carregar status das integrações
      const statusResponse = await fetch('/api/integrations/status');
      const statusData = await statusResponse.json();
      
      // Atualizar conexões com status real
      setConnections(prev => prev.map(conn => {
        if (conn.connectionType === 'google') {
          return { ...conn, isConnected: statusData.google?.connected || false };
        } else if (conn.connectionType === 'facebook' || conn.connectionType === 'instagram') {
          return { ...conn, isConnected: statusData.meta?.connected || false };
        }
        return conn;
      }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (connectionType: string) => {
    try {
      if (connectionType === 'google') {
        setShowGoogleModal(true);
      } else if (connectionType === 'facebook') {
        setShowFacebookModal(true);
      } else if (connectionType === 'instagram') {
        setShowInstagramModal(true);
      } else {
        // Para outros tipos, usar método direto
        let authUrl = '';
        
        if (connectionType === 'webhook') {
          // Implementar lógica para webhook
          console.log('Conectar webhook');
        }
        
        if (authUrl) {
          window.open(authUrl, '_blank', 'width=600,height=600');
        }
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
    }
  };

  const handleDisconnect = async (connectionType: string) => {
    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: connectionType })
      });
      
      if (response.ok) {
        await loadData(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const getConnectionIcon = (connectionType: string) => {
    switch (connectionType) {
      case 'whatsapp': return <MessageCircle className="w-5 h-5" />;
      case 'webhook': return <Webhook className="w-5 h-5" />;
      case 'google': return <Globe className="w-5 h-5" />;
      case 'facebook': return <MessageCircle className="w-5 h-5" />;
      case 'instagram': return <MessageCircle className="w-5 h-5" />;
      case 'microsoft': return <Calendar className="w-5 h-5" />;
      case 'slack': return <Zap className="w-5 h-5" />;
      case 'discord': return <MessageCircle className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'message-circle': return <MessageCircle className="w-5 h-5" />;
      case 'zap': return <Zap className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const filteredConnections = selectedCategory === 'all' 
    ? connections 
    : connections.filter(conn => conn.categoryId === selectedCategory);

  const groupedConnections = categories.reduce((acc, category) => {
    acc[category.id] = connections.filter(conn => conn.categoryId === category.id);
    return acc;
  }, {} as Record<string, Connection[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-600" />
                Conexões
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie suas conexões com serviços externos
              </p>
            </div>
            <button
              onClick={() => setShowAddConnection(true)}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Conexão
            </button>
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas ({connections.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ borderColor: selectedCategory === category.id ? category.color : undefined }}
              >
                {getCategoryIcon(category.icon)}
                {category.name} ({groupedConnections[category.id]?.length || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Conexões por Categoria */}
        {selectedCategory === 'all' ? (
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryConnections = groupedConnections[category.id] || [];
              if (categoryConnections.length === 0) return null;

              return (
                <div key={category.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryConnections.map((connection) => (
                      <ConnectionCard
                        key={connection.id}
                        connection={connection}
                        onEdit={() => {/* Implementar edição */}}
                        onDelete={() => {/* Implementar deleção */}}
                        onToggle={() => {/* Implementar toggle */}}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConnections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onEdit={() => {/* Implementar edição */}}
                onDelete={() => {/* Implementar deleção */}}
                onToggle={() => {/* Implementar toggle */}}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            ))}
            </div>
          </div>
        )}

        {/* Modais de Integração */}
        {showGoogleModal && (
          <GoogleConnectionModal
            onClose={() => setShowGoogleModal(false)}
            onConnect={async () => {
              try {
                const response = await fetch('/api/integrations/google/auth');
                const data = await response.json();
                window.open(data.authUrl, '_blank', 'width=600,height=600');
                setShowGoogleModal(false);
              } catch (error) {
                console.error('Erro ao conectar Google:', error);
              }
            }}
          />
        )}

        {showFacebookModal && (
          <FacebookConnectionModal
            onClose={() => setShowFacebookModal(false)}
            onConnect={async () => {
              try {
                const response = await fetch('/api/integrations/meta/auth');
                const data = await response.json();
                window.open(data.authUrl, '_blank', 'width=600,height=600');
                setShowFacebookModal(false);
              } catch (error) {
                console.error('Erro ao conectar Facebook:', error);
              }
            }}
          />
        )}

        {showInstagramModal && (
          <InstagramConnectionModal
            onClose={() => setShowInstagramModal(false)}
            onConnect={async () => {
              try {
                const response = await fetch('/api/integrations/meta/auth');
                const data = await response.json();
                window.open(data.authUrl, '_blank', 'width=600,height=600');
                setShowInstagramModal(false);
              } catch (error) {
                console.error('Erro ao conectar Instagram:', error);
              }
            }}
          />
        )}

        {/* Modal para adicionar conexão */}
        {showAddConnection && (
          <AddConnectionModal
            onClose={() => setShowAddConnection(false)}
            onSave={() => {/* Implementar salvamento */}}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
};

// Componente para card de conexão
const ConnectionCard: React.FC<{
  connection: Connection;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onConnect: (connectionType: string) => void;
  onDisconnect: (connectionType: string) => void;
}> = ({ connection, onEdit, onDelete, onToggle, onConnect, onDisconnect }) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getConnectionIcon(connection.connectionType)}
          <div>
            <h4 className="font-medium text-gray-900">{connection.name}</h4>
            <p className="text-sm text-gray-600">{connection.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            connection.isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            {connection.isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <button
          onClick={onToggle}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            connection.isActive
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {connection.isActive ? 'Ativo' : 'Inativo'}
        </button>
      </div>

      {connection.lastUsedAt && (
        <p className="text-xs text-gray-500">
          Último uso: {new Date(connection.lastUsedAt).toLocaleDateString('pt-BR')}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        {connection.isConnected ? (
          <>
            <button 
              onClick={() => onDisconnect(connection.connectionType)}
              className="flex-1 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Desconectar
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button 
            onClick={() => onConnect(connection.connectionType)}
            className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Conectar
          </button>
        )}
      </div>
    </div>
  );
};

// Modal para adicionar conexão
const AddConnectionModal: React.FC<{
  onClose: () => void;
  onSave: (connectionData: Partial<Connection>) => void;
  categories: ConnectionCategory[];
}> = ({ onClose, onSave, categories }) => {
  const [connectionData, setConnectionData] = useState<Partial<Connection>>({
    connectionType: 'webhook',
    isActive: true,
    isConnected: false
  });

  const handleSave = () => {
    onSave(connectionData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Conexão</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Conexão
            </label>
            <input
              type="text"
              value={connectionData.name || ''}
              onChange={(e) => setConnectionData({ ...connectionData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Google Calendar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={connectionData.categoryId || ''}
              onChange={(e) => setConnectionData({ ...connectionData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecionar categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Conexão
            </label>
            <select
              value={connectionData.connectionType || 'webhook'}
              onChange={(e) => setConnectionData({ ...connectionData, connectionType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="webhook">Webhook</option>
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="microsoft">Microsoft</option>
              <option value="slack">Slack</option>
              <option value="discord">Discord</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={connectionData.description || ''}
              onChange={(e) => setConnectionData({ ...connectionData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva a conexão..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para conectar Google
const GoogleConnectionModal: React.FC<{
  onClose: () => void;
  onConnect: () => void;
}> = ({ onClose, onConnect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Conectar Google</h3>
            <p className="text-gray-600">Integre com os serviços do Google</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Permissões necessárias:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Google Calendar - Criar e gerenciar eventos</li>
              <li>• Google Meet - Gerar reuniões</li>
              <li>• Gmail - Enviar emails</li>
              <li>• Google Drive - Salvar arquivos</li>
              <li>• Google Sheets - Criar planilhas</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConnect}
            className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Conectar Google
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para conectar Facebook
const FacebookConnectionModal: React.FC<{
  onClose: () => void;
  onConnect: () => void;
}> = ({ onClose, onConnect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Conectar Facebook</h3>
            <p className="text-gray-600">Gerencie suas páginas do Facebook</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Permissões necessárias:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Gerenciar páginas do Facebook</li>
              <li>• Publicar posts</li>
              <li>• Responder comentários</li>
              <li>• Visualizar insights</li>
              <li>• Gerenciar perfil do Instagram</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConnect}
            className="flex-1 px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Conectar Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para conectar Instagram
const InstagramConnectionModal: React.FC<{
  onClose: () => void;
  onConnect: () => void;
}> = ({ onClose, onConnect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-pink-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Conectar Instagram</h3>
            <p className="text-gray-600">Gerencie seu perfil do Instagram</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-pink-50 rounded-lg">
            <h4 className="font-medium text-pink-900 mb-2">Permissões necessárias:</h4>
            <ul className="text-sm text-pink-800 space-y-1">
              <li>• Gerenciar mídia do Instagram</li>
              <li>• Responder comentários</li>
              <li>• Visualizar estatísticas</li>
              <li>• Gerenciar stories</li>
              <li>• Acessar insights</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConnect}
            className="flex-1 px-4 py-3 text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Conectar Instagram
          </button>
        </div>
      </div>
    </div>
  );
};

export default Connections;
