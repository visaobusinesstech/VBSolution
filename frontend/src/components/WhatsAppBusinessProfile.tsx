import React, { useState, useEffect } from 'react';
import { Building2, Globe, Mail, Clock, MapPin, Phone } from 'lucide-react';
import { useWhatsAppProfile } from '@/hooks/useWhatsAppProfile';

interface WhatsAppBusinessProfileProps {
  jid: string;
  className?: string;
}

export const WhatsAppBusinessProfile: React.FC<WhatsAppBusinessProfileProps> = ({
  jid,
  className = ''
}) => {
  const { getBusinessProfile, getCachedProfile, loading } = useWhatsAppProfile();
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      setIsLoading(true);
      try {
        // Verificar cache primeiro
        const cachedProfile = getCachedProfile(jid);
        if (cachedProfile?.businessProfile) {
          setBusinessProfile(cachedProfile.businessProfile);
          setIsLoading(false);
          return;
        }

        // Buscar do servidor
        const profile = await getBusinessProfile(jid);
        if (profile) {
          setBusinessProfile(profile);
        }
      } catch (error) {
        console.error('Erro ao buscar perfil de negócio:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessProfile();
  }, [jid, getBusinessProfile, getCachedProfile]);

  if (isLoading || loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!businessProfile) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              Perfil de Negócio
            </h3>
            {businessProfile.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {businessProfile.category}
              </span>
            )}
          </div>

          {businessProfile.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {businessProfile.description}
            </p>
          )}

          <div className="space-y-2">
            {businessProfile.website && businessProfile.website.length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a
                  href={businessProfile.website[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 truncate"
                >
                  {businessProfile.website[0]}
                </a>
              </div>
            )}

            {businessProfile.email && (
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a
                  href={`mailto:${businessProfile.email}`}
                  className="text-gray-600 hover:text-gray-800 truncate"
                >
                  {businessProfile.email}
                </a>
              </div>
            )}

            {businessProfile.businessHours && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">
                  {businessProfile.businessHours}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface WhatsAppPresenceIndicatorProps {
  jid: string;
  className?: string;
}

export const WhatsAppPresenceIndicator: React.FC<WhatsAppPresenceIndicatorProps> = ({
  jid,
  className = ''
}) => {
  const { getPresence, getCachedProfile } = useWhatsAppProfile();
  const [presence, setPresence] = useState<any>(null);

  useEffect(() => {
    const fetchPresence = async () => {
      try {
        // Verificar cache primeiro
        const cachedProfile = getCachedProfile(jid);
        if (cachedProfile?.presence) {
          setPresence(cachedProfile.presence);
          return;
        }

        // Buscar do servidor
        const presenceData = await getPresence(jid);
        if (presenceData) {
          setPresence(presenceData);
        }
      } catch (error) {
        console.error('Erro ao buscar presença:', error);
      }
    };

    fetchPresence();
  }, [jid, getPresence, getCachedProfile]);

  if (!presence) {
    return null;
  }

  const getPresenceText = () => {
    if (presence.isOnline) {
      return 'Online';
    }
    if (presence.isTyping) {
      return 'Digitando...';
    }
    if (presence.lastSeen) {
      const lastSeen = new Date(presence.lastSeen * 1000);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) {
        return 'Visto agora';
      } else if (diffInMinutes < 60) {
        return `Visto há ${diffInMinutes} min`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `Visto há ${hours}h`;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `Visto há ${days} dias`;
      }
    }
    return 'Offline';
  };

  const getPresenceColor = () => {
    if (presence.isOnline) return 'text-green-600';
    if (presence.isTyping) return 'text-blue-600';
    return 'text-gray-500';
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        presence.isOnline ? 'bg-green-500' : 
        presence.isTyping ? 'bg-blue-500 animate-pulse' : 
        'bg-gray-400'
      }`} />
      <span className={`text-xs font-medium ${getPresenceColor()}`}>
        {getPresenceText()}
      </span>
    </div>
  );
};

export default WhatsAppBusinessProfile;
