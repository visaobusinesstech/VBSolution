import React, { useState, useEffect } from 'react';
import { User, Camera, Loader2 } from 'lucide-react';
import { useWhatsAppProfile } from '@/hooks/useWhatsAppProfile';
import { useWhatsAppContacts } from '@/hooks/useWhatsAppContacts';

interface WhatsAppProfilePictureProps {
  jid: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPresence?: boolean;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-lg',
};

export const WhatsAppProfilePicture: React.FC<WhatsAppProfilePictureProps> = ({
  jid,
  name,
  size = 'md',
  showPresence = false,
  className = '',
  fallbackIcon
}) => {
  const { getProfilePicture, getCachedProfile, loading } = useWhatsAppProfile();
  const { contacts } = useWhatsAppContacts();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Verificar database primeiro
  useEffect(() => {
    const contact = contacts.find(c => c.whatsapp_jid === jid || c.phone === jid.replace('@s.whatsapp.net', ''));
    if (contact?.whatsapp_profile_picture) {
      setProfilePictureUrl(contact.whatsapp_profile_picture);
      setHasError(false);
      return;
    }

    // Verificar cache como fallback
    const cachedProfile = getCachedProfile(jid);
    if (cachedProfile?.profilePictureUrl) {
      setProfilePictureUrl(cachedProfile.profilePictureUrl);
      setHasError(false);
    }
  }, [jid, contacts, getCachedProfile]);

  // Buscar foto de perfil da API apenas se não estiver no database nem no cache
  useEffect(() => {
    if (!profilePictureUrl && !isLoading && !hasError) {
      const contact = contacts.find(c => c.whatsapp_jid === jid || c.phone === jid.replace('@s.whatsapp.net', ''));
      const cachedProfile = getCachedProfile(jid);
      
      // Só buscar da API se não estiver no database nem no cache
      if (!contact?.whatsapp_profile_picture && !cachedProfile?.profilePictureUrl) {
        const fetchProfilePicture = async () => {
          setIsLoading(true);
          try {
            const url = await getProfilePicture(jid, true); // High resolution
            if (url) {
              setProfilePictureUrl(url);
              setHasError(false);
            } else {
              setHasError(true);
            }
          } catch (error) {
            console.error('Erro ao buscar foto de perfil:', error);
            setHasError(true);
          } finally {
            setIsLoading(false);
          }
        };

        fetchProfilePicture();
      }
    }
  }, [jid, profilePictureUrl, isLoading, hasError, getProfilePicture, contacts, getCachedProfile]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPresenceIndicator = () => {
    if (!showPresence) return null;
    
    const cachedProfile = getCachedProfile(jid);
    const presence = cachedProfile?.presence;
    
    if (presence?.isOnline) {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      );
    }
    
    if (presence?.isTyping) {
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full animate-pulse" />
      );
    }
    
    return null;
  };

  const sizeClass = sizeClasses[size];
  const baseClasses = `relative inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 overflow-hidden ${sizeClass} ${className}`;

  if (isLoading || loading) {
    return (
      <div className={`${baseClasses} bg-gray-100`}>
        <Loader2 className="w-1/2 h-1/2 animate-spin text-gray-400" />
      </div>
    );
  }

  if (profilePictureUrl && !hasError) {
    return (
      <div className={baseClasses}>
        <img
          src={profilePictureUrl}
          alt={name || 'Profile'}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
        {getPresenceIndicator()}
      </div>
    );
  }

  // Fallback: ícone ou iniciais
  return (
    <div className={baseClasses}>
      {fallbackIcon || (
        <div className="flex flex-col items-center justify-center">
          <User className="w-1/2 h-1/2" />
          {name && (
            <span className="text-xs font-medium leading-none mt-0.5">
              {getInitials(name)}
            </span>
          )}
        </div>
      )}
      {getPresenceIndicator()}
    </div>
  );
};

interface WhatsAppProfilePictureWithBusinessProps extends WhatsAppProfilePictureProps {
  showBusinessInfo?: boolean;
}

export const WhatsAppProfilePictureWithBusiness: React.FC<WhatsAppProfilePictureWithBusinessProps> = ({
  jid,
  name,
  size = 'md',
  showPresence = false,
  showBusinessInfo = false,
  className = '',
  fallbackIcon
}) => {
  const { getBusinessProfile, getCachedProfile } = useWhatsAppProfile();
  const [businessProfile, setBusinessProfile] = useState<any>(null);

  useEffect(() => {
    if (showBusinessInfo) {
      const fetchBusinessProfile = async () => {
        try {
          const cachedProfile = getCachedProfile(jid);
          if (cachedProfile?.businessProfile) {
            setBusinessProfile(cachedProfile.businessProfile);
          } else {
            const profile = await getBusinessProfile(jid);
            if (profile) {
              setBusinessProfile(profile);
            }
          }
        } catch (error) {
          console.error('Erro ao buscar perfil de negócio:', error);
        }
      };

      fetchBusinessProfile();
    }
  }, [jid, showBusinessInfo, getBusinessProfile, getCachedProfile]);

  return (
    <div className="flex items-center space-x-3">
      <WhatsAppProfilePicture
        jid={jid}
        name={name}
        size={size}
        showPresence={showPresence}
        className={className}
        fallbackIcon={fallbackIcon}
      />
      
      {showBusinessInfo && businessProfile && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {name || jid}
            </h3>
            {businessProfile.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {businessProfile.category}
              </span>
            )}
          </div>
          
          {businessProfile.description && (
            <p className="text-xs text-gray-500 truncate">
              {businessProfile.description}
            </p>
          )}
          
          {businessProfile.website && businessProfile.website.length > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-xs text-gray-400">🌐</span>
              <a
                href={businessProfile.website[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 truncate"
              >
                {businessProfile.website[0]}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppProfilePicture;
