-- Script para corrigir as políticas RLS e permitir operações
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Allow all operations on companies" ON companies;
DROP POLICY IF EXISTS "Allow all operations on company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow all operations on company_areas" ON company_areas;
DROP POLICY IF EXISTS "Allow all operations on company_roles" ON company_roles;
DROP POLICY IF EXISTS "Allow all operations on company_users" ON company_users;
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;

-- Criar políticas mais permissivas para desenvolvimento
CREATE POLICY "Allow all operations on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_areas" ON company_areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_roles" ON company_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on company_users" ON company_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('companies', 'company_settings', 'company_areas', 'company_roles', 'company_users', 'user_profiles')
ORDER BY tablename, policyname;