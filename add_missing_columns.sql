-- ADICIONAR COLUNAS FALTANTES NA TABELA ACTIVITIES
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela activities existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        RAISE EXCEPTION 'Tabela activities não existe! Execute primeiro o script fix_activities_simple.sql';
    END IF;
END $$;

-- 2. Adicionar colunas que estão faltando
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS work_group VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS comments JSONB,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Verificar se as colunas foram criadas
DO $$
BEGIN
    RAISE NOTICE 'Verificando colunas adicionadas...';
    
    -- Verificar colunas principais
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'actual_hours'
    ) THEN
        RAISE NOTICE '✅ Coluna actual_hours criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna actual_hours não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'estimated_hours'
    ) THEN
        RAISE NOTICE '✅ Coluna estimated_hours criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna estimated_hours não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'work_group'
    ) THEN
        RAISE NOTICE '✅ Coluna work_group criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna work_group não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'department'
    ) THEN
        RAISE NOTICE '✅ Coluna department criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna department não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'attachments'
    ) THEN
        RAISE NOTICE '✅ Coluna attachments criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna attachments não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'comments'
    ) THEN
        RAISE NOTICE '✅ Coluna comments criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna comments não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'is_urgent'
    ) THEN
        RAISE NOTICE '✅ Coluna is_urgent criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna is_urgent não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'is_public'
    ) THEN
        RAISE NOTICE '✅ Coluna is_public criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna is_public não foi criada';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'notes'
    ) THEN
        RAISE NOTICE '✅ Coluna notes criada com sucesso';
    ELSE
        RAISE NOTICE '❌ Coluna notes não foi criada';
    END IF;
    
END $$;

-- 4. Verificar estrutura completa da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- 5. Verificar se as políticas RLS estão funcionando
SELECT 
    policyname, 
    cmd, 
    permissive
FROM pg_policies 
WHERE tablename = 'activities';
