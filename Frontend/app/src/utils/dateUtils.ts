// utils/dateUtils.ts
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Jakarta';

const parseISO = (isoString: string): Date => {
  const cleanString = isoString.includes('Z') || isoString.includes('+') 
    ? isoString 
    : `${isoString}Z`;
  return new Date(cleanString);
};

export const formatChatTime = (isoString: string): string => {
  if (!isoString) return '';
  
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return '';
    
    const zonedDate = toZonedTime(date, TIMEZONE);
    const zonedNow = toZonedTime(new Date(), TIMEZONE);
    
    const dateOnly = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate()).getTime();
    const nowOnly = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate()).getTime();
    
    // 3. Hitung selisih hari
    const diffDays = Math.round((nowOnly - dateOnly) / (1000 * 60 * 60 * 24));
    
    const hours = zonedDate.getHours().toString().padStart(2, '0');
    const minutes = zonedDate.getMinutes().toString().padStart(2, '0');
    
    if (diffDays === 0) {
      return `${hours}:${minutes}`;
    } else if (diffDays === 1) {
      return 'Kemarin';
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`;
    } else {
      return format(zonedDate, 'd MMM', { locale: id });
    }
  } catch (error) {
    return '';
  }
};

export const formatMessageTime = (isoString: string): string => {
  if (!isoString) return '';
  
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return '';
    
    const zonedDate = toZonedTime(date, TIMEZONE);
    const zonedNow = toZonedTime(new Date(), TIMEZONE);
    
    const dateOnly = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate()).getTime();
    const nowOnly = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate()).getTime();
    const diffDays = Math.round((nowOnly - dateOnly) / (1000 * 60 * 60 * 24));
    
    const hours = zonedDate.getHours().toString().padStart(2, '0');
    const minutes = zonedDate.getMinutes().toString().padStart(2, '0');
    
    if (diffDays === 0) {
      return `${hours}:${minutes}`;
    } else if (diffDays === 1) {
      return `Kemarin ${hours}:${minutes}`;
    } else {
      return format(zonedDate, 'd MMM HH:mm', { locale: id });
    }
  } catch (error) {
    return '';
  }
};