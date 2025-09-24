import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useSuppliers } from '@/hooks/useSuppliers';
import SupplierForm from '@/components/SupplierForm';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Edit,
  Trash2,
  Eye,
  Building2,
  ArrowLeft,
  TrendingUp,
  Phone
} from 'lucide-react';

const ImprovedSuppliersPage = () => {
  const navigate = useNavigate();
  const { suppliers, loading, error, createSupplier, deleteSupplier } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.activity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSupplier = async (formData: any) => {
    try {
      await createSupplier(formData);
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Fornecedor cadastrado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar fornecedor. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o fornecedor "${name}"?`)) {
      try {
        await deleteSupplier(id);
        toast({
          title: "Sucesso",
          description: "Fornecedor excluído com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir fornecedor. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBackToCompanies = () => {
    navigate('/companies');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Erro ao carregar fornecedores: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToCompanies}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Fornecedores
                </h1>
                <p className="text-gray-600 text-sm mt-1">Gerencie seus fornecedores e parceiros comerciais</p>
              </div>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl">Cadastrar Novo Fornecedor</DialogTitle>
                </DialogHeader>
                <SupplierForm onSubmit={handleCreateSupplier} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Fornecedores</p>
                  <p className="text-2xl font-semibold text-gray-900">{suppliers.length}</p>
                </div>
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-900" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fornecedores Ativos</p>
                  <p className="text-2xl font-semibold text-gray-900">{suppliers.length}</p>
                </div>
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-gray-900" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Atividades</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Set(suppliers.filter(s => s.activity).map(s => s.activity)).size}
                  </p>
                </div>
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-gray-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar fornecedores por nome, empresa ou atividade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 border-gray-300 focus:border-gray-500"
                />
              </div>
              <Badge variant="outline" className="border-gray-300 text-gray-700">
                {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'fornecedor' : 'fornecedores'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        {filteredSuppliers.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-medium text-gray-900">Nome</TableHead>
                  <TableHead className="font-medium text-gray-900">Empresa</TableHead>
                  <TableHead className="font-medium text-gray-900">Atividade</TableHead>
                  <TableHead className="font-medium text-gray-900">Contato</TableHead>
                  <TableHead className="font-medium text-gray-900">Data de Criação</TableHead>
                  <TableHead className="text-right font-medium text-gray-900">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {supplier.photo_url ? (
                            <img 
                              src={supplier.photo_url} 
                              alt={supplier.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-gray-900" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          {supplier.cnpj && (
                            <div className="text-sm text-gray-500">{supplier.cnpj}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.company_name ? (
                        <div className="text-sm text-gray-700">{supplier.company_name}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.activity ? (
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          {supplier.activity}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {(supplier.city || supplier.state) && (
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{[supplier.city, supplier.state].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(supplier.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="text-center py-16">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca ou limpar os filtros' 
                  : 'Comece cadastrando seu primeiro fornecedor para começar a gerenciar seus parceiros comerciais'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Fornecedor
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedSuppliersPage;
