// ==========================================
// MY TRAVEL — Constants
// ==========================================

export const APP_NAME = 'MY TRAVEL';
export const APP_VERSION = '1.0.0';
export const STORAGE_PREFIX = 'mytravel_';

// Trip Status
export const TRIP_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

export const TRIP_STATUS_LABELS = {
  planning: 'Planejando',
  active: 'Em andamento',
  completed: 'Concluída'
};

export const TRIP_STATUS_CLASSES = {
  planning: 'badge-planning',
  active: 'badge-active',
  completed: 'badge-completed'
};

// Expense Categories
export const EXPENSE_CATEGORIES = [
  { id: 'transport', label: 'Transporte', icon: '✈️', color: '#3B82F6' },
  { id: 'food', label: 'Alimentação', icon: '🍽️', color: '#F59E0B' },
  { id: 'accommodation', label: 'Hospedagem', icon: '🏨', color: '#8B5CF6' },
  { id: 'entertainment', label: 'Lazer', icon: '🎭', color: '#EC4899' },
  { id: 'shopping', label: 'Compras', icon: '🛍️', color: '#10B981' },
  { id: 'other', label: 'Outros', icon: '📦', color: '#94A3B8' }
];

// Payment Methods
export const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Cartão de Crédito' },
  { id: 'debit_card', label: 'Cartão de Débito' },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'pix', label: 'PIX' },
  { id: 'transfer', label: 'Transferência' },
  { id: 'other', label: 'Outro' }
];

// Currencies
export const CURRENCIES = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina' },
  { code: 'JPY', symbol: '¥', name: 'Iene Japonês' },
  { code: 'ARS', symbol: 'ARS$', name: 'Peso Argentino' },
  { code: 'CLP', symbol: 'CLP$', name: 'Peso Chileno' },
  { code: 'COP', symbol: 'COP$', name: 'Peso Colombiano' },
  { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano' },
  { code: 'CAD', symbol: 'CA$', name: 'Dólar Canadense' },
  { code: 'AUD', symbol: 'AU$', name: 'Dólar Australiano' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco Suíço' }
];

// Reservation Types
export const RESERVATION_TYPES = [
  { id: 'flight', label: 'Voo', icon: '✈️' },
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'transport', label: 'Transporte', icon: '🚗' }
];

export const RESERVATION_STATUS = [
  { id: 'confirmed', label: 'Confirmada' },
  { id: 'pending', label: 'Pendente' },
  { id: 'cancelled', label: 'Cancelada' }
];

// Document Types
export const DOCUMENT_TYPES = [
  { id: 'passport', label: 'Passaporte', icon: '📘' },
  { id: 'visa', label: 'Visto', icon: '📋' },
  { id: 'ticket', label: 'Passagem', icon: '🎫' },
  { id: 'insurance', label: 'Seguro', icon: '🛡️' },
  { id: 'other', label: 'Outro', icon: '📎' }
];

// Activity Types (Itinerary)
export const ACTIVITY_TYPES = [
  { id: 'sightseeing', label: 'Passeio', icon: '📸' },
  { id: 'transport', label: 'Transporte', icon: '🚌' },
  { id: 'food', label: 'Alimentação', icon: '🍽️' },
  { id: 'accommodation', label: 'Check-in/out', icon: '🏨' },
  { id: 'activity', label: 'Atividade', icon: '🎯' },
  { id: 'shopping', label: 'Compras', icon: '🛍️' },
  { id: 'rest', label: 'Descanso', icon: '😴' }
];

// Reminder Types
export const REMINDER_TYPES = [
  { id: 'checkin', label: 'Check-in', icon: '✈️' },
  { id: 'payment', label: 'Pagamento', icon: '💳' },
  { id: 'booking', label: 'Reserva', icon: '📅' },
  { id: 'custom', label: 'Personalizado', icon: '🔔' }
];

// Default Checklist Template
export const DEFAULT_CHECKLIST = [
  {
    category: 'documents',
    label: '📄 Documentos',
    items: ['Passaporte', 'Visto', 'Carteira de identidade', 'Cartão de embarque', 'Seguro viagem', 'Reserva do hotel', 'Carteira de vacinação']
  },
  {
    category: 'clothing',
    label: '👔 Roupas',
    items: ['Roupas casuais', 'Roupa de banho', 'Casaco/jaqueta', 'Pijama', 'Roupas íntimas', 'Meias', 'Calçados confortáveis']
  },
  {
    category: 'electronics',
    label: '🔌 Eletrônicos',
    items: ['Carregador de celular', 'Adaptador de tomada', 'Fones de ouvido', 'Power bank', 'Câmera', 'Cabo USB']
  },
  {
    category: 'toiletries',
    label: '🧴 Higiene',
    items: ['Escova de dentes', 'Pasta de dentes', 'Shampoo', 'Protetor solar', 'Desodorante', 'Remédios pessoais']
  },
  {
    category: 'other',
    label: '🎒 Outros',
    items: ['Mochila de mão', 'Garrafa de água', 'Snacks', 'Livro/Kindle', 'Máscara de dormir', 'Travesseiro de viagem']
  }
];

// Navigation Items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'trips', label: 'Viagens', icon: 'trips' },
  { id: 'finances', label: 'Finanças', icon: 'finances' },
  { id: 'reservations', label: 'Reservas', icon: 'reservations' },
  { id: 'documents', label: 'Documentos', icon: 'documents' },
  { id: 'checklist', label: 'Checklist', icon: 'checklist' },
  { id: 'reminders', label: 'Lembretes', icon: 'reminders' },
  { id: 'settings', label: 'Configurações', icon: 'settings' }
];

export const BOTTOM_NAV_ITEMS = [
  { id: 'dashboard', label: 'Início', icon: 'dashboard' },
  { id: 'trips', label: 'Viagens', icon: 'trips' },
  { id: 'finances', label: 'Finanças', icon: 'finances' },
  { id: 'checklist', label: 'Checklist', icon: 'checklist' },
  { id: 'settings', label: 'Mais', icon: 'settings' }
];

// Destination suggestions for cover images
export const DESTINATION_EMOJIS = {
  'paris': '🗼',
  'tokyo': '🗾',
  'new york': '🗽',
  'london': '🎡',
  'roma': '🏛️',
  'rio': '🏖️',
  'default': '✈️'
};
