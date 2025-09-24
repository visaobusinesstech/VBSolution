import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppContact {
  chat_id: string;
  name: string;
  phone: string;
  whatsapp_name?: string;
  profile_picture?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  whatsapp_name?: string;
  profile_image_url?: string;
  last_contact_at?: string;
  notes?: string;
  tags?: string[];
  custom_fields?: any[];
  ai_enabled?: boolean;
  attendant_name?: string;
  attendant_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export function useContactSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar contato do WhatsApp com a tabela de contatos
  const syncWhatsAppContact = async (whatsappContact: WhatsAppContact) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar se o contato já existe pelo número de telefone
      const { data: existingContact, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('phone', whatsappContact.phone)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar contato: ${fetchError.message}`);
      }

      const contactData = {
        name: whatsappContact.whatsapp_name || whatsappContact.name,
        phone: whatsappContact.phone,
        whatsapp_name: whatsappContact.whatsapp_name,
        profile_image_url: whatsappContact.profile_picture,
        last_contact_at: whatsappContact.last_message_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingContact) {
        // Atualizar contato existente
        const { data: updatedContact, error: updateError } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', existingContact.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Erro ao atualizar contato: ${updateError.message}`);
        }

        return updatedContact;
      } else {
        // Criar novo contato
        // Para novas conversas, usar o attendance_type da conexão como padrão
        let defaultAiEnabled = false;
        try {
          const { data: sessionData } = await supabase
            .from('whatsapp_sessions')
            .select('attendance_type')
            .eq('owner_id', whatsappContact.owner_id)
            .eq('connection_id', whatsappContact.connection_id)
            .single();
          
          if (sessionData && sessionData.attendance_type === 'AI') {
            defaultAiEnabled = true;
            console.log('🤖 Novo contato criado com IA habilitada (configuração da conexão)');
          } else {
            console.log('🤖 Novo contato criado com atendimento humano (configuração da conexão)');
          }
        } catch (error) {
          console.log('🤖 Erro ao buscar configuração da conexão, usando padrão humano');
        }
        
        const { data: newContact, error: createError } = await supabase
          .from('contacts')
          .insert({
            ...contactData,
            ai_enabled: defaultAiEnabled,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Erro ao criar contato: ${createError.message}`);
        }

        return newContact;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na sincronização de contato:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar contato pelo número de telefone
  const getContactByPhone = async (phoneNumber: string, ownerId?: string): Promise<Contact | null> => {
    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('phone', phoneNumber);

      // Se ownerId for fornecido, filtrar por ele
      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }

      const { data: contact, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar contato: ${error.message}`);
      }

      return contact;
    } catch (err) {
      console.error('Erro ao buscar contato:', err);
      return null;
    }
  };

  // Atualizar informações do contato
  const updateContact = async (contactId: string, updates: Partial<Contact>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: updatedContact, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar contato: ${error.message}`);
      }

      return updatedContact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao atualizar contato:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sincronizar múltiplos contatos
  const syncMultipleContacts = async (whatsappContacts: WhatsAppContact[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        whatsappContacts.map(contact => syncWhatsAppContact(contact))
      );

      const successful = results
        .filter((result): result is PromiseFulfilledResult<Contact> => result.status === 'fulfilled')
        .map(result => result.value);

      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      if (failed.length > 0) {
        console.warn(`${failed.length} contatos falharam na sincronização:`, failed);
      }

      return {
        successful,
        failed: failed.length,
        total: whatsappContacts.length,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na sincronização múltipla:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Criar novo contato
  const createContact = async (contactData: Partial<Contact>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          name: contactData.name || '',
          phone: contactData.phone || '',
          email: contactData.email || '',
          company: contactData.company || '',
          whatsapp_name: contactData.whatsapp_name || '',
          profile_image_url: contactData.profile_image_url || '',
          notes: contactData.notes || '',
          tags: contactData.tags || [],
          custom_fields: contactData.custom_fields || [],
          ai_enabled: contactData.ai_enabled || false,
          attendant_name: contactData.attendant_name || '',
          attendant_photo_url: contactData.attendant_photo_url || '',
          last_contact_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar contato:', errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    syncWhatsAppContact,
    getContactByPhone,
    updateContact,
    createContact,
    syncMultipleContacts,
    isLoading,
    error,
  };
}
