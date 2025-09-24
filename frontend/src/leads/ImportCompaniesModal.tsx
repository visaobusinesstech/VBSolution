
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, Download, FileText } from 'lucide-react';

interface ImportCompaniesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportCompaniesModal = ({ isOpen, onClose }: ImportCompaniesModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.xlsx')) {
        toast({
          title: "Formato inválido",
          description: "Selecione um arquivo CSV ou Excel (.xlsx)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo para importar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Aqui você implementaria a lógica de importação
      console.log('Importing file:', selectedFile);
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Importação realizada",
        description: "Empresas importadas com sucesso!",
      });
      
      onClose();
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Erro ao importar arquivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Criar template CSV
    const csvContent = `nome_fantasia,razao_social,cnpj,email,telefone,cep,endereco,cidade,estado,setor
Empresa Exemplo LTDA,Empresa Exemplo LTDA,12.345.678/0001-90,contato@exemplo.com,(11) 99999-9999,01234-567,Rua Exemplo 123,São Paulo,SP,Tecnologia`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_empresas.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Empresas</DialogTitle>
          <DialogDescription>
            Importe empresas em lote através de arquivo CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download do template */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Template de importação</h4>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Baixe o template com o formato correto para importação
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>

          {/* Seleção de arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo de empresas</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Instruções */}
          <div className="text-sm text-gray-600 space-y-2">
            <h5 className="font-medium text-gray-900">Instruções:</h5>
            <ul className="list-disc list-inside space-y-1">
              <li>Formato aceito: CSV ou Excel (.xlsx)</li>
              <li>Use o template fornecido para garantir a formatação correta</li>
              <li>Campos obrigatórios: nome_fantasia</li>
              <li>Máximo 1000 empresas por importação</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || loading}>
            {loading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCompaniesModal;
