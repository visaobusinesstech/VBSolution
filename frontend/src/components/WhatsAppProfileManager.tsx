import React, { useState } from 'react';
import { User, Camera, Save, X, Edit3, Check } from 'lucide-react';
import { useWhatsAppProfile } from '@/hooks/useWhatsAppProfile';

interface WhatsAppProfileManagerProps {
  className?: string;
}

export const WhatsAppProfileManager: React.FC<WhatsAppProfileManagerProps> = ({
  className = ''
}) => {
  const {
    updateProfileName,
    updateProfileStatus,
    updateProfilePicture,
    removeProfilePicture,
    loading
  } = useWhatsAppProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async () => {
    if (!profileName.trim() && !profileStatus.trim()) {
      setMessage({ type: 'error', text: 'Preencha pelo menos um campo' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const promises = [];
      
      if (profileName.trim()) {
        promises.push(updateProfileName(profileName.trim()));
      }
      
      if (profileStatus.trim()) {
        promises.push(updateProfileStatus(profileStatus.trim()));
      }

      await Promise.all(promises);
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setIsEditing(false);
      setProfileName('');
      setProfileStatus('');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione uma imagem válida' });
      return;
    }

    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // Converter para base64 ou URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageUrl = e.target?.result as string;
          await updateProfilePicture('', imageUrl); // JID vazio para perfil próprio
          setMessage({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' });
        } catch (error) {
          console.error('Erro ao atualizar foto:', error);
          setMessage({ type: 'error', text: 'Erro ao atualizar foto de perfil' });
        } finally {
          setIsSaving(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setMessage({ type: 'error', text: 'Erro ao processar imagem' });
      setIsSaving(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await removeProfilePicture(''); // JID vazio para perfil próprio
      setMessage({ type: 'success', text: 'Foto de perfil removida com sucesso!' });
    } catch (error) {
      console.error('Erro ao remover foto:', error);
      setMessage({ type: 'error', text: 'Erro ao remover foto de perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Gerenciar Perfil
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              <span>Editar</span>
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Upload de foto */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-2 block">
                Foto de Perfil
              </span>
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isSaving || loading}
                  className="hidden"
                  id="profile-picture-upload"
                />
                <label
                  htmlFor="profile-picture-upload"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isSaving ? 'Enviando...' : 'Alterar Foto'}
                </label>
                <button
                  onClick={handleRemoveProfilePicture}
                  disabled={isSaving || loading}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remover
                </button>
              </div>
            </label>
          </div>
        </div>

        {/* Nome do perfil */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Perfil
          </label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Digite seu nome"
            disabled={!isEditing || isSaving || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Status do perfil */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <input
            type="text"
            value={profileStatus}
            onChange={(e) => setProfileStatus(e.target.value)}
            placeholder="Digite seu status"
            disabled={!isEditing || isSaving || loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Botões de ação */}
        {isEditing && (
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving || loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving || loading || (!profileName.trim() && !profileStatus.trim())}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppProfileManager;
