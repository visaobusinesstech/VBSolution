
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExportModal = ({ isOpen, onClose }: ImportExportModalProps) => {
  const [activeTab, setActiveTab] = useState('import');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFile(file);
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV ou Excel (.xlsx, .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      // Simular importação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Importação concluída",
        description: "Dados importados com sucesso!",
      });
      
      setImportFile(null);
      onClose();
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Erro ao importar dados. Verifique o formato do arquivo.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(true);
    try {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Exportação concluída",
        description: `Arquivo ${format.toUpperCase()} será baixado em breve!`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Erro ao exportar dados.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const downloadTemplate = () => {
    toast({
      title: "Download iniciado",
      description: "Modelo de planilha será baixado em breve!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar / Exportar Dados
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6 mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                    <div className="text-sm">
                      <strong>Importante:</strong> Faça backup dos seus dados antes de importar.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Modelo de Planilha</Label>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Modelo CSV
                      </Button>
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Modelo Excel
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="import-file">Selecionar Arquivo</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                    {importFile && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Arquivo selecionado: {importFile.name}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <h4 className="font-medium mb-2">Campos obrigatórios:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Nome do Lead</li>
                      <li>Empresa (Nome Fantasia)</li>
                      <li>Valor da Oportunidade</li>
                      <li>Etapa (ID ou Nome)</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleImport} 
                      disabled={!importFile || importing}
                    >
                      {importing ? "Importando..." : "Importar Dados"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6 mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Escolha o formato de exportação:</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                          <h4 className="font-medium mb-2">CSV</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Formato universal para planilhas
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExport('csv')}
                            disabled={exporting}
                            className="w-full"
                          >
                            Exportar CSV
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                          <FileSpreadsheet className="h-8 w-8 mx-auto mb-3 text-green-600" />
                          <h4 className="font-medium mb-2">Excel</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Arquivo Excel com formatação
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExport('excel')}
                            disabled={exporting}
                            className="w-full"
                          >
                            Exportar Excel
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-3 text-red-600" />
                          <h4 className="font-medium mb-2">PDF</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Relatório para impressão
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExport('pdf')}
                            disabled={exporting}
                            className="w-full"
                          >
                            Exportar PDF
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg text-sm">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Dados inclusos na exportação:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Informações completas dos leads</li>
                      <li>Dados das empresas relacionadas</li>
                      <li>Histórico de atividades</li>
                      <li>Status e etapas atuais</li>
                      <li>Valores e datas importantes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExportModal;
