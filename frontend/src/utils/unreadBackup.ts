/**
 * Utilitários para gerenciar backup local das mensagens não lidas
 */

const STORAGE_KEY = 'whatsapp_unread_backup';

export interface UnreadBackup {
  [chatId: string]: number;
}

/**
 * Carrega o backup local das mensagens não lidas
 */
export function loadUnreadBackup(): UnreadBackup {
  try {
    const backup = localStorage.getItem(STORAGE_KEY);
    return backup ? JSON.parse(backup) : {};
  } catch (error) {
    console.error('Erro ao carregar backup local:', error);
    return {};
  }
}

/**
 * Salva o backup local das mensagens não lidas
 */
export function saveUnreadBackup(backup: UnreadBackup): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
  } catch (error) {
    console.error('Erro ao salvar backup local:', error);
  }
}

/**
 * Atualiza o contador de mensagens não lidas para um chat específico
 */
export function updateUnreadCount(chatId: string, count: number): void {
  const backup = loadUnreadBackup();
  backup[chatId] = Math.max(0, count);
  saveUnreadBackup(backup);
  console.log(`💾 Backup local atualizado - ${chatId}: ${count}`);
}

/**
 * Marca um chat como lido (contador = 0)
 */
export function markChatAsRead(chatId: string): void {
  updateUnreadCount(chatId, 0);
}

/**
 * Incrementa o contador de mensagens não lidas para um chat
 */
export function incrementUnreadCount(chatId: string): void {
  const backup = loadUnreadBackup();
  const currentCount = backup[chatId] || 0;
  updateUnreadCount(chatId, currentCount + 1);
}

/**
 * Obtém o contador de mensagens não lidas para um chat
 */
export function getUnreadCount(chatId: string): number {
  const backup = loadUnreadBackup();
  return backup[chatId] || 0;
}

/**
 * Sincroniza o contador local com o do servidor, usando o maior valor
 */
export function syncWithServer(chatId: string, serverCount: number): number {
  const localCount = getUnreadCount(chatId);
  const finalCount = Math.max(serverCount, localCount);
  
  if (finalCount !== localCount) {
    updateUnreadCount(chatId, finalCount);
  }
  
  console.log(`📊 Sincronização ${chatId}: Servidor=${serverCount}, Local=${localCount}, Final=${finalCount}`);
  return finalCount;
}

/**
 * Limpa todo o backup local
 */
export function clearUnreadBackup(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('💾 Backup local limpo');
  } catch (error) {
    console.error('Erro ao limpar backup local:', error);
  }
}

/**
 * Obtém estatísticas do backup local
 */
export function getBackupStats(): { totalChats: number; totalUnread: number; chats: UnreadBackup } {
  const backup = loadUnreadBackup();
  const totalChats = Object.keys(backup).length;
  const totalUnread = Object.values(backup).reduce((sum, count) => sum + count, 0);
  
  return {
    totalChats,
    totalUnread,
    chats: backup
  };
}
