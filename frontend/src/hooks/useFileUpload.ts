import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadLogo = useCallback(async (file: File): Promise<UploadResult> => {
    try {
      setUploading(true);

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Apenas arquivos de imagem são permitidos' };
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Arquivo muito grande. Máximo 5MB' };
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        return { success: false, error: 'Falha no upload do arquivo' };
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };
    } catch (err) {
      console.error('Erro inesperado no upload:', err);
      return { success: false, error: 'Erro inesperado no upload' };
    } finally {
      setUploading(false);
    }
  }, []);

  const deleteLogo = useCallback(async (filePath: string): Promise<UploadResult> => {
    try {
      setUploading(true);

      // Extrair o caminho do arquivo da URL
      const pathMatch = filePath.match(/logos\/([^?]+)/);
      if (!pathMatch) {
        return { success: false, error: 'Caminho do arquivo inválido' };
      }

      const { error } = await supabase.storage
        .from('company-assets')
        .remove([`logos/${pathMatch[1]}`]);

      if (error) {
        console.error('Erro ao deletar arquivo:', error);
        return { success: false, error: 'Falha ao deletar arquivo' };
      }

      return { success: true };
    } catch (err) {
      console.error('Erro inesperado ao deletar:', err);
      return { success: false, error: 'Erro inesperado ao deletar arquivo' };
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    uploading,
    uploadLogo,
    deleteLogo,
  };
}
