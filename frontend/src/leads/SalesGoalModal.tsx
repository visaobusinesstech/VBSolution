
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Calendar, DollarSign } from 'lucide-react';

interface SalesGoal {
  id: string;
  month: string;
  year: number;
  targetAmount: number;
  productId?: string;
  productName?: string;
}

interface SalesGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Omit<SalesGoal, 'id'>) => void;
  products: Array<{ id: string; name: string }>;
}

const SalesGoalModal = ({ isOpen, onClose, onSaveGoal, products }: SalesGoalModalProps) => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const handleSave = () => {
    if (!month || !targetAmount) return;

    const selectedProductData = products.find(p => p.id === selectedProduct);

    onSaveGoal({
      month,
      year,
      targetAmount: parseFloat(targetAmount),
      productId: selectedProduct || undefined,
      productName: selectedProductData?.name
    });

    // Reset form
    setMonth('');
    setTargetAmount('');
    setSelectedProduct('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Definir Meta de Vendas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview da meta */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Target className="h-4 w-4" />
                <span className="font-medium">Meta Atual</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">
                R$ {targetAmount ? parseFloat(targetAmount).toLocaleString('pt-BR') : '0,00'}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {month && months.find(m => m.value === month)?.label} {year}
                {selectedProduct && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 rounded text-xs">
                    {products.find(p => p.id === selectedProduct)?.name}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Formulário */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Mês
                </Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 5}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor da Meta (R$)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="0,00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="product">Produto (Opcional)</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto específico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os produtos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!month || !targetAmount}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Salvar Meta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesGoalModal;
