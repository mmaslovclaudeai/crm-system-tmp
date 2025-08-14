// src/constants/index.js

// 🔧 ЛОКАЛЬНАЯ РАЗРАБОТКА: API URL
const getApiBaseUrl = () => {
  // В режиме разработки используем прокси Vite
  if (import.meta.env.DEV) {
    return '/api';
  }
  // В продакшне используем переменную окружения или дефолт
  return import.meta.env.VITE_API_URL || 'https://admin-stage.dev.crm.seniorpomidornaya.ru/api';
};

export const API_BASE_URL = getApiBaseUrl();



export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info'
};

// 🔧 ОБНОВЛЕНО: Добавлена вкладка LEADS (перед CLIENTS)
export const TABS = {
  LEADS: 'leads',        // 🆕 Новая вкладка для лидов (первая!)
  CLIENTS: 'clients',    // Существующая вкладка для клиентов
  FINANCES: 'finances',
  CASH_DESKS: 'cash_desks',
  WORKERS: 'workers'
};

// НОВЫЕ КОНСТАНТЫ ДЛЯ РАБОТНИКОВ
export const WORKER_STATUS = {
  ACTIVE: true,
  INACTIVE: false
};

export const WORKER_SEARCH_FILTERS = {
  NAME: 'name',
  POSITION: 'position',

  ACTIVE: 'active'
};

// 👥 БАНКИ ДЛЯ ВЫПАДАЮЩЕГО СПИСКА
export const BANKS = [
  'T-Bank',
  'Sber',
  'Alpha Bank',
  'VTB',
  'Raiffeisen',
  'Газпромбанк',
  'Россельхозбанк',
  'Открытие',
  'Почта Банк',
  'МТС Банк'
];

// 👥 ДОЛЖНОСТИ ДЛЯ АВТОДОПОЛНЕНИЯ
export const COMMON_POSITIONS = [
  'Собственник',
  'СЕО',
  'HR-менеджер',
  'Разработчик',
  'Продюссер',
  'Бухгалтер',
  'Диагност',
  'CRM менеджер',
  'СОО',
  'Ассистент',
  'Монтажер',
  'Сценарист',
  'СММ-специалист',
  'Ревьюер',
  'Методист',
  'Семинарист',
  'Лектор',
  'Куратор'
];

// 🆕 Новые константы для подвкладок финансов
export const FINANCE_TABS = {
  ACTUAL: 'actual',
  PLANNED: 'planned',
  STATISTICS: 'statistics'
};

export const SEARCH_FILTERS = {
  NAME: 'name',
  EMAIL: 'email',
  ACTIVE: 'active'
};

// 🔧 ПОЛНОСТЬЮ ОБНОВЛЕННЫЕ СТАТУСЫ (лиды + клиенты)
export const CLIENT_STATUS = {
  // 🎯 СТАТУСЫ ПРИЕМКИ УЧЕНИКОВ
  CREATED: 'CREATED',           // Создан
  DISTRIBUTION: 'DISTRIBUTION', // Распределение
  GIVE_ACCESS: 'GIVE_ACCESS',   // Выдача доступов

  // 👥 СТАТУСЫ УЧЕНИКОВ
  IN_PROGRESS: 'IN_PROGRESS',   // Обучается
  SEARCH_OFFER: 'SEARCH_OFFER', // Ищет работу
  ACCEPT_OFFER: 'ACCEPT_OFFER', // Принимает оффер
  PAYING_OFFER: 'PAYING_OFFER', // Выплачивает процент
  FINISH: 'FINISH'              // Закончил обучение
};

// 🔧 ГРУППИРОВКА СТАТУСОВ ПО ТИПАМ
export const LEAD_STATUSES = ['CREATED', 'DISTRIBUTION', 'GIVE_ACCESS'];
export const CLIENT_STATUSES = ['IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH'];

// 🔧 ОБНОВЛЕННЫЕ ЛЕЙБЛЫ ДЛЯ ВСЕХ СТАТУСОВ
export const CLIENT_STATUS_LABELS = {
  // 🎯 Лейблы для приемки учеников
  [CLIENT_STATUS.CREATED]: 'Создан',
  [CLIENT_STATUS.DISTRIBUTION]: 'Распределение',
  [CLIENT_STATUS.GIVE_ACCESS]: 'Выдача доступов',

  // 👥 Лейблы для учеников (существующие)
  [CLIENT_STATUS.IN_PROGRESS]: 'Обучается',
  [CLIENT_STATUS.SEARCH_OFFER]: 'Ищет работу',
  [CLIENT_STATUS.ACCEPT_OFFER]: 'Принимает оффер',
  [CLIENT_STATUS.PAYING_OFFER]: 'Выплачивает процент',
  [CLIENT_STATUS.FINISH]: 'Закончил обучение'
};

// 🔧 ОБНОВЛЕННЫЕ ЦВЕТА ДЛЯ ВСЕХ СТАТУСОВ
export const CLIENT_STATUS_COLORS = {
  // 🎯 Цвета для приемки учеников (градация синего и голубого)
  [CLIENT_STATUS.CREATED]: 'bg-blue-100 text-blue-800',         // Голубой - создан
  [CLIENT_STATUS.DISTRIBUTION]: 'bg-indigo-100 text-indigo-800', // Индиго - распределение
  [CLIENT_STATUS.GIVE_ACCESS]: 'bg-emerald-100 text-emerald-800', // Изумрудный - выдача доступов


  // 👥 Цвета для учеников (существующие)
  [CLIENT_STATUS.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800', // Желтый - в процессе
  [CLIENT_STATUS.SEARCH_OFFER]: 'bg-orange-100 text-orange-800', // Оранжевый - поиск работы
  [CLIENT_STATUS.ACCEPT_OFFER]: 'bg-purple-100 text-purple-800', // Фиолетовый - принимает оффер
  [CLIENT_STATUS.PAYING_OFFER]: 'bg-red-100 text-red-800',      // Красный - выплачивает
  [CLIENT_STATUS.FINISH]: 'bg-green-100 text-green-800'         // Зеленый - завершил
};

// 🔧 ЛЕЙБЛЫ ДЛЯ СТАТУСОВ ПРИЕМКИ
export const LEAD_STATUS_LABELS = {
  [CLIENT_STATUS.CREATED]: CLIENT_STATUS_LABELS[CLIENT_STATUS.CREATED],
  [CLIENT_STATUS.DISTRIBUTION]: CLIENT_STATUS_LABELS[CLIENT_STATUS.DISTRIBUTION],
  [CLIENT_STATUS.GIVE_ACCESS]: CLIENT_STATUS_LABELS[CLIENT_STATUS.GIVE_ACCESS]
};

// 🔧 ЛЕЙБЛЫ ДЛЯ СТАТУСОВ УЧЕНИКОВ
export const CLIENT_STATUS_LABELS_ONLY = {
  [CLIENT_STATUS.IN_PROGRESS]: CLIENT_STATUS_LABELS[CLIENT_STATUS.IN_PROGRESS],
  [CLIENT_STATUS.SEARCH_OFFER]: CLIENT_STATUS_LABELS[CLIENT_STATUS.SEARCH_OFFER],
  [CLIENT_STATUS.ACCEPT_OFFER]: CLIENT_STATUS_LABELS[CLIENT_STATUS.ACCEPT_OFFER],
  [CLIENT_STATUS.PAYING_OFFER]: CLIENT_STATUS_LABELS[CLIENT_STATUS.PAYING_OFFER],
  [CLIENT_STATUS.FINISH]: CLIENT_STATUS_LABELS[CLIENT_STATUS.FINISH]
};

export const FINANCE_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

// 🆕 Новые константы для статуса платежей
export const PAYMENT_STATUS = {
  ACTUAL: 'actual',    // Фактический платеж (уже совершен)
  PLANNED: 'planned'   // Планируемый платеж (еще не совершен)
};

// 🔐 Константы для авторизации
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer'
};

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'crm_access_token',
  REFRESH_TOKEN: 'crm_refresh_token',
  USER: 'crm_user'
};

export const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 минут до истечения

// 🆕 Константы для касс
export const CASH_DESK_SEARCH_FILTERS = {
  NAME: 'name',
  DESCRIPTION: 'description',
  ACTIVE: 'active'
};

export const CASH_DESK_STATUS = {
  ACTIVE: true,
  INACTIVE: false
};

// 🔧 НОВЫЕ УТИЛИТЫ ДЛЯ РАБОТЫ С ГРУППАМИ СТАТУСОВ
export const STATUS_GROUPS = {
  LEADS: 'leads',
  CLIENTS: 'clients',
  ALL: 'all'
};
