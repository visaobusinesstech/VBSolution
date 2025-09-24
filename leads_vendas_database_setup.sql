-- Script para configurar banco de dados para página de Leads e Vendas
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar e criar tabela de templates se não existir
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'proposal', 'contract', 'presentation')),
    subject TEXT,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Variáveis que podem ser substituídas no template
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false, -- Se pode ser usado por outros usuários
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Verificar e criar tabela de eventos/compromissos se não existir
CREATE TABLE IF NOT EXISTS public.lead_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('meeting', 'call', 'demo', 'proposal', 'follow_up', 'deadline', 'other')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    attendees JSONB DEFAULT '[]', -- Lista de participantes
    is_all_day BOOLEAN DEFAULT false,
    reminder_minutes INTEGER DEFAULT 15, -- Lembrete em minutos antes
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'postponed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Verificar e criar tabela de produtos se não existir
CREATE TABLE IF NOT EXISTS public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'BRL',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Atualizar tabela de leads para incluir campos necessários
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES public.funnel_stages(id);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'qualified' CHECK (pipeline_stage IN ('qualified', 'contact_made', 'demo_scheduled', 'proposal_made', 'negotiations_started', 'won', 'lost'));

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS negotiated_price DECIMAL(10,2);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS expected_close_date DATE;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 5. Garantir que a tabela de etapas do funil tenha as etapas padrão
INSERT INTO public.funnel_stages (id, name, order_position, color, probability, owner_id)
VALUES 
    (gen_random_uuid(), 'Qualified', 1, '#10b981', 10, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO public.funnel_stages (id, name, order_position, color, probability, owner_id)
VALUES 
    (gen_random_uuid(), 'Contact Made', 2, '#3b82f6', 25, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO public.funnel_stages (id, name, order_position, color, probability, owner_id)
VALUES 
    (gen_random_uuid(), 'Demo Scheduled', 3, '#8b5cf6', 50, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO public.funnel_stages (id, name, order_position, color, probability, owner_id)
VALUES 
    (gen_random_uuid(), 'Proposal Made', 4, '#f59e0b', 75, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO public.funnel_stages (id, name, order_position, color, probability, owner_id)
VALUES 
    (gen_random_uuid(), 'Negotiations Started', 5, '#ef4444', 90, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- 6. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON public.leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON public.leads(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_lead_events_start_date ON public.lead_events(start_date);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON public.templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_owner_id ON public.templates(owner_id);

-- 7. Criar funções auxiliares
CREATE OR REPLACE FUNCTION update_lead_pipeline_stage(lead_id UUID, new_stage TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.leads 
    SET 
        pipeline_stage = new_stage,
        updated_at = NOW()
    WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pipeline_stats(owner_uuid UUID)
RETURNS TABLE (
    stage TEXT,
    total_value DECIMAL,
    deal_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.pipeline_stage as stage,
        COALESCE(SUM(l.negotiated_price), 0) as total_value,
        COUNT(*)::INTEGER as deal_count
    FROM public.leads l
    WHERE l.owner_id = owner_uuid
    AND l.pipeline_stage NOT IN ('won', 'lost')
    GROUP BY l.pipeline_stage
    ORDER BY 
        CASE l.pipeline_stage
            WHEN 'qualified' THEN 1
            WHEN 'contact_made' THEN 2
            WHEN 'demo_scheduled' THEN 3
            WHEN 'proposal_made' THEN 4
            WHEN 'negotiations_started' THEN 5
            ELSE 6
        END;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_events_updated_at ON public.lead_events;
CREATE TRIGGER update_lead_events_updated_at
    BEFORE UPDATE ON public.lead_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Comentários nas tabelas
COMMENT ON TABLE public.templates IS 'Templates reutilizáveis para emails, WhatsApp, propostas, etc.';
COMMENT ON TABLE public.lead_events IS 'Eventos e compromissos relacionados aos leads';
COMMENT ON TABLE public.products IS 'Produtos e serviços da empresa';
COMMENT ON COLUMN public.leads.pipeline_stage IS 'Etapa atual do lead no pipeline de vendas';
COMMENT ON COLUMN public.leads.negotiated_price IS 'Preço negociado com o cliente';
COMMENT ON COLUMN public.leads.expected_close_date IS 'Data esperada para fechamento do negócio';

-- 10. Verificar estrutura final
SELECT 'Tabelas criadas/atualizadas com sucesso!' as status;

-- Verificar se as tabelas foram criadas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('templates', 'lead_events', 'products') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
