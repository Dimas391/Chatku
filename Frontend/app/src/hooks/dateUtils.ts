export const parseBackendDate = (isoString: string): Date => {
  // Backend mengirim UTC tanpa 'Z', tambahkan 'Z' untuk parse sebagai UTC
  if (!isoString.includes('Z') && !isoString.includes('+') && !isoString.includes('-')) {
    return new Date(isoString + 'Z');
  }
  return new Date(isoString);
};

export const formatChatTime = (isoString: string): string => {
  if (!isoString) return '';
  
  try {
    const date = parseBackendDate(isoString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch (error) {
    return '';
  }
};

export const formatMessageTime = (isoString: string): string => {
  if (!isoString) return '';
  
  try {
    const date = parseBackendDate(isoString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (isToday) {
      return `${hours}:${minutes}`;
    } else if (isYesterday) {
      return `Kemarin ${hours}:${minutes}`;
    } else {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ` ${hours}:${minutes}`;
    }
  } catch (error) {
    return '';
  }
};