import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Table } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LeadWithDetails } from '@/hooks/useLeads';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads?: LeadWithDetails[];
  totalLeads?: number;
  onExport?: (format: "csv" | "xlsx") => void;
}

const ExportModal = ({ isOpen, onClose, leads = [], totalLeads, onExport }: ExportModalProps) => {
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [selectedFields, setSelectedFields] = useState({
    name: true,
    company: true,
    value: true,
    stage: true,
    status: true,
    priority: true,
    source: true,
    responsible: true,
    created_at: true,
    expected_close_date: true,
    last_contact_date: true,
    conversion_rate: true,
    notes: false
  });

  const fieldLabels = {
    name: 'Nome do Lead',
    company: 'Empresa',
    value: 'Valor',
    stage: 'Etapa',
    status: 'Status',
    priority: 'Prioridade',
    source: 'Origem',
    responsible: 'Responsável',
    created_at: 'Data de Criação',
    expected_close_date: 'Data Prevista',
    last_contact_date: 'Último Contato',
    conversion_rate: 'Taxa de Conversão',
    notes: 'Observações'
  };

  const handleFieldToggle = (field: string, checked: boolean) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedFields).every(selected => selected);
    const newState = Object.keys(selectedFields).reduce((acc, field) => ({
      ...acc,
      [field]: !allSelected
    }), {});
    setSelectedFields(newState as typeof selectedFields);
  };

  const generateCSV = () => {
    const headers = Object.entries(selectedFields)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => fieldLabels[field as keyof typeof fieldLabels]);

    const rows = leads.map(lead => {
      const row: string[] = [];
      
      if (selectedFields.name) row.push(lead.name);
      if (selectedFields.company) row.push(lead.company?.fantasy_name || '');
      if (selectedFields.value) row.push(lead.value.toString());
      if (selectedFields.stage) row.push(lead.stage?.name || '');
      if (selectedFields.status) row.push(lead.status);
      if (selectedFields.priority) row.push(lead.priority);
      if (selectedFields.source) row.push(lead.source || '');
      if (selectedFields.responsible) row.push(lead.responsible?.name || '');
      if (selectedFields.created_at) row.push(new Date(lead.created_at).toLocaleDateString('pt-BR'));
      if (selectedFields.expected_close_date) row.push(lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString('pt-BR') : '');
      if (selectedFields.last_contact_date) row.push(lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleDateString('pt-BR') : '');
      if (selectedFields.conversion_rate) row.push(lead.conversion_rate + '%');
      if (selectedFields.notes) row.push((lead.notes || '').replace(/"/g, '""'));

      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  const generateJSON = () => {
    return leads.map(lead => {
      const exportData: any = {};
      
      if (selectedFields.name) exportData.nome = lead.name;
      if (selectedFields.company) exportData.empresa = lead.company?.fantasy_name || '';
      if (selectedFields.value) exportData.valor = lead.value;
      if (selectedFields.stage) exportData.etapa = lead.stage?.name || '';
      if (selectedFields.status) exportData.status = lead.status;
      if (selectedFields.priority) exportData.prioridade = lead.priority;
      if (selectedFields.source) exportData.origem = lead.source || '';
      if (selectedFields.responsible) exportData.responsavel = lead.responsible?.name || '';
      if (selectedFields.created_at) exportData.data_criacao = lead.created_at;
      if (selectedFields.expected_close_date) exportData.data_prevista = lead.expected_close_date;
      if (selectedFields.last_contact_date) exportData.ultimo_contato = lead.last_contact_date;
      if (selectedFields.conversion_rate) exportData.taxa_conversao = lead.conversion_rate;
      if (selectedFields.notes) exportData.observacoes = lead.notes;

      return exportData;
    });
  };

  const handleExport = async () => {
    const selectedCount = Object.values(selectedFields).filter(Boolean).length;
    
    if (selectedCount === 0) {
      toast({
        title: "Nenhum campo selecionado",
        description: "Selecione pelo menos um campo para exportar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (onExport) {
        // Use the provided onExport function
        await onExport(format as "csv" | "xlsx");
      } else {
        // Default export behavior
        let content: string;
        let filename: string;
        let mimeType: string;

        if (format === 'csv') {
          content = generateCSV();
          filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
        } else {
          content = JSON.stringify(generateJSON(), null, 2);
          filename = `leads-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
        }

        // Criar e fazer download do arquivo
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Exportação concluída",
        description: `${leads.length} leads exportados com sucesso!`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Erro ao exportar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Leads
          </DialogTitle>
          <DialogDescription>
            Configure os dados que deseja exportar. Total de leads: {totalLeads || leads.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato de exportação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formato de Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      CSV (Excel)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      JSON
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Campos para exportação */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Campos para Exportação</CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {Object.values(selectedFields).every(selected => selected) ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(fieldLabels).map(([field, label]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={selectedFields[field as keyof typeof selectedFields]}
                      onCheckedChange={(checked) => handleFieldToggle(field, checked as boolean)}
                    />
                    <Label 
                      htmlFor={field} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-800">
                <strong>Resumo da exportação:</strong>
                <br />
                • {leads.length} leads serão exportados
                <br />
                • {Object.values(selectedFields).filter(Boolean).length} campos selecionados
                <br />
                • Formato: {format.toUpperCase()}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? 'Exportando...' : `Exportar ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
