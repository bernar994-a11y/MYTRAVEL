// ==========================================
// MY TRAVEL — Helper Utilities
// ==========================================

/**
 * Generate a UUID v4
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format a date string to locale (PT-BR)
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format date to short format (15 Jun)
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  });
}

/**
 * Format date to long format
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format datetime
 */
export function formatDateTime(datetimeStr) {
  if (!datetimeStr) return '';
  const date = new Date(datetimeStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = 'BRL') {
  const num = Number(amount) || 0;
  try {
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    });
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const diff = end - start;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get trip status based on dates and manual overrides
 */
export function getTripStatus(tripOrStartDate, endDate = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start_date, end_date, manual_status;

  if (typeof tripOrStartDate === 'object' && tripOrStartDate !== null) {
    start_date = tripOrStartDate.start_date;
    end_date = tripOrStartDate.end_date;
    manual_status = tripOrStartDate.manual_status;
  } else {
    start_date = tripOrStartDate;
    end_date = endDate;
  }

  const start = new Date(start_date + 'T00:00:00');
  const end = new Date(end_date + 'T00:00:00');

  // Automatic "Completed" status always wins if date is past
  if (today > end) return 'completed';
  
  // Manual override for "Confirmed"
  if (manual_status === 'confirmed') return 'confirmed';
  
  if (today < start) return 'planning';
  return 'active';
}

/**
 * Days until a date
 */
export function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = target - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Relative time (e.g., "há 2 dias")
 */
export function relativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `há ${minutes} min`;
  return 'agora';
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle(fn, limit = 100) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Get array of dates between start and end
 */
export function getDateRange(startDate, endDate) {
  const dates = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const current = new Date(start);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get greeting based on time of day
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Get a file size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get month/day names for chart labels
 */
export function getMonthName(monthIndex) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[monthIndex];
}

export function getDayName(dayIndex) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[dayIndex];
}

/**
 * Sort array by date field
 */
export function sortByDate(arr, field, asc = true) {
  return [...arr].sort((a, b) => {
    const dateA = new Date(a[field]);
    const dateB = new Date(b[field]);
    return asc ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Group array by key
 */
export function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const val = item[key];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
}

/**
 * Sum array of numbers
 */
export function sumBy(arr, key) {
  return arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
}

/**
 * Add days to a date string
 */
export function addDaysToDate(dateStr, days) {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
