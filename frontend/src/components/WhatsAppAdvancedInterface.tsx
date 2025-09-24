import React, { useState, useRef } from 'react';
import { 
  Send, 
  Image, 
  Video, 
  Mic, 
  MapPin, 
  Users, 
  Phone, 
  MoreVertical, 
  Smile, 
  Paperclip,
  MessageSquare,
  Pin,
  Star,
  Archive,
  Trash2,
  Settings,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useWhatsAppAdvanced } from '@/hooks/useWhatsAppAdvanced';

interface WhatsAppAdvancedInterfaceProps {
  jid: string;
  onMessageSent?: (message: any) => void;
  className?: string;
}

export const WhatsAppAdvancedInterface: React.FC<WhatsAppAdvancedInterfaceProps> = ({
  jid,
  onMessageSent,
  className = ''
}) => {
  const {
    sendTextMessage,
    sendMediaMessage,
    sendLocationMessage,
    sendContactMessage,
    sendPollMessage,
    reactToMessage,
    pinMessage,
    markMessagesAsRead,
    updatePresence,
    getProfilePicture,
    getBusinessProfile,
    updateProfileName,
    updateProfileStatus,
    updateProfilePicture,
    removeProfilePicture,
    checkWhatsAppId,
    getGroupMetadata,
    createGroup,
    updateGroupParticipants,
    updateGroupSubject,
    updateGroupDescription,
    leaveGroup,
    getGroupInviteCode,
    revokeGroupInviteCode,
    acceptGroupInvite,
    getGroupInviteInfo,
    updateBlockStatus,
    getPrivacySettings,
    getBlockList,
    loading,
    error
  } = useWhatsAppAdvanced();

  const [message, setMessage] = useState('');
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showGroupOptions, setShowGroupOptions] = useState(false);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollData, setPollData] = useState({
    name: '',
    values: ['', ''],
    selectableCount: 1
  });
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleSendText = async () => {
    if (!message.trim()) return;

    try {
      await sendTextMessage(jid, message.trim());
      setMessage('');
      onMessageSent?.({ type: 'text', content: message.trim() });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleSendMedia = async (type: 'image' | 'video' | 'audio' | 'document', file: File) => {
    try {
      await sendMediaMessage(jid, { type, fileName: file.name, mimetype: file.type }, file);
      onMessageSent?.({ type, file });
    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
    }
  };

  const handleSendLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await sendLocationMessage(jid, {
          degreesLatitude: position.coords.latitude,
          degreesLongitude: position.coords.longitude
        });
        onMessageSent?.({ type: 'location', position });
      } catch (error) {
        console.error('Erro ao enviar localização:', error);
      }
    });
  };

  const handleSendContact = async () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Contato Teste
TEL:+1234567890
END:VCARD`;

    try {
      await sendContactMessage(jid, {
        displayName: 'Contato Teste',
        contacts: [{ vcard }]
      });
      onMessageSent?.({ type: 'contact', contact: 'Contato Teste' });
    } catch (error) {
      console.error('Erro ao enviar contato:', error);
    }
  };

  const handleSendPoll = async () => {
    if (!pollData.name || pollData.values.some(v => !v.trim())) {
      alert('Preencha todos os campos da enquete');
      return;
    }

    try {
      await sendPollMessage(jid, pollData);
      setPollData({ name: '', values: ['', ''], selectableCount: 1 });
      setShowPollCreator(false);
      onMessageSent?.({ type: 'poll', poll: pollData });
    } catch (error) {
      console.error('Erro ao enviar enquete:', error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      updatePresence('composing', jid);
    } else if (isTyping && !e.target.value.trim()) {
      setIsTyping(false);
      updatePresence('paused', jid);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleFileSelect = (type: 'image' | 'video' | 'audio' | 'document') => {
    const refs = {
      image: imageInputRef,
      video: videoInputRef,
      audio: audioInputRef,
      document: documentInputRef
    };
    
    refs[type].current?.click();
  };

  const handleFileChange = (type: 'image' | 'video' | 'audio' | 'document') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendMedia(type, file);
    }
  };

  const addPollOption = () => {
    setPollData(prev => ({
      ...prev,
      values: [...prev.values, '']
    }));
  };

  const removePollOption = (index: number) => {
    setPollData(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }));
  };

  const updatePollOption = (index: number, value: string) => {
    setPollData(prev => ({
      ...prev,
      values: prev.values.map((v, i) => i === index ? value : v)
    }));
  };

  return (
    <div className={`bg-white border-t border-gray-200 p-4 ${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Poll Creator Modal */}
      {showPollCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Criar Enquete</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pergunta
                </label>
                <input
                  type="text"
                  value={pollData.name}
                  onChange={(e) => setPollData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Digite sua pergunta..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opções
                </label>
                {pollData.values.map((value, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Opção ${index + 1}`}
                    />
                    {pollData.values.length > 2 && (
                      <button
                        onClick={() => removePollOption(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addPollOption}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  + Adicionar opção
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleções permitidas
                </label>
                <select
                  value={pollData.selectableCount}
                  onChange={(e) => setPollData(prev => ({ ...prev, selectableCount: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowPollCreator(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendPoll}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Enviar Enquete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Options Panel */}
      {showMediaOptions && (
        <div className="absolute bottom-16 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleFileSelect('image')}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Image className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Imagem</span>
            </button>
            <button
              onClick={() => handleFileSelect('video')}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Video className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Vídeo</span>
            </button>
            <button
              onClick={() => handleFileSelect('audio')}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Mic className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Áudio</span>
            </button>
            <button
              onClick={() => handleFileSelect('document')}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Paperclip className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Documento</span>
            </button>
            <button
              onClick={handleSendLocation}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <MapPin className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Localização</span>
            </button>
            <button
              onClick={handleSendContact}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Phone className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Contato</span>
            </button>
            <button
              onClick={() => setShowPollCreator(true)}
              className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <MessageSquare className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Enquete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
            disabled={loading}
          />
          <button
            onClick={() => setShowMediaOptions(!showMediaOptions)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleSendText}
          disabled={!message.trim() || loading}
          className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange('image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange('video')}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange('audio')}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        onChange={handleFileChange('document')}
        className="hidden"
      />
    </div>
  );
};

export default WhatsAppAdvancedInterface;
