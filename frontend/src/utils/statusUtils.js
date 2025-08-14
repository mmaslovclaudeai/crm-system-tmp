// src/utils/statusUtils.js - ОБНОВЛЕННАЯ ВЕРСИЯ
import {
  LEAD_STATUSES,
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  CLIENT_STATUS_LABELS_ONLY,
  STATUS_GROUPS
} from '../constants';

/**
 * Проверяет, является ли статус статусом лида
 * @param {string} status - статус для проверки
 * @returns {boolean}
 */
export const isLeadStatus = (status) => {
  return LEAD_STATUSES.includes(status);
};

/**
 * Проверяет, является ли статус статусом клиента
 * @param {string} status - статус для проверки
 * @returns {boolean}
 */
export const isClientStatus = (status) => {
  return CLIENT_STATUSES.includes(status);
};

/**
 * Определяет группу статуса (lead, client или unknown)
 * @param {string} status - статус для проверки
 * @returns {string} - 'lead', 'client' или 'unknown'
 */
export const getStatusGroup = (status) => {
  if (isLeadStatus(status)) return 'lead';
  if (isClientStatus(status)) return 'client';
  return 'unknown';
};

/**
 * Возвращает название типа записи для пользователя
 * @param {string} status - статус записи
 * @returns {string} - 'Лид', 'Клиент' или 'Неизвестно'
 */
export const getRecordTypeName = (status) => {
  const group = getStatusGroup(status);
  switch (group) {
    case 'lead': return 'Лид';
    case 'client': return 'Клиент';
    default: return 'Неизвестно';
  }
};

/**
 * Возвращает подходящие лейблы статусов в зависимости от контекста
 * @param {string} context - 'leads', 'clients' или 'all'
 * @returns {object} - объект с лейблами статусов
 */
export const getStatusLabelsForContext = (context) => {
  switch (context) {
    case STATUS_GROUPS.LEADS:
      return LEAD_STATUS_LABELS;
    case STATUS_GROUPS.CLIENTS:
      return CLIENT_STATUS_LABELS_ONLY;
    case STATUS_GROUPS.ALL:
    default:
      return CLIENT_STATUS_LABELS; // Все статусы (лиды + клиенты)
  }
};

/**
 * Возвращает доступные статусы для контекста
 * @param {string} context - 'leads', 'clients' или 'all'
 * @returns {array} - массив доступных статусов
 */
export const getAvailableStatusesForContext = (context) => {
  switch (context) {
    case STATUS_GROUPS.LEADS:
      return LEAD_STATUSES;
    case STATUS_GROUPS.CLIENTS:
      return CLIENT_STATUSES;
    case STATUS_GROUPS.ALL:
    default:
      return [...LEAD_STATUSES, ...CLIENT_STATUSES]; // Все статусы
  }
};

/**
 * Фильтрует записи по группе статусов
 * @param {array} records - массив записей
 * @param {string} statusGroup - 'leads', 'clients' или 'all'
 * @returns {array} - отфильтрованный массив записей
 */
export const filterRecordsByStatusGroup = (records, statusGroup) => {
  if (!records || !Array.isArray(records)) return [];

  switch (statusGroup) {
    case STATUS_GROUPS.LEADS:
      return records.filter(record => isLeadStatus(record.status));
    case STATUS_GROUPS.CLIENTS:
      return records.filter(record => isClientStatus(record.status));
    case STATUS_GROUPS.ALL:
    default:
      return records;
  }
};

/**
 * 🔧 ОБНОВЛЕНО: Определяет дефолтный статус для создания новой записи в зависимости от контекста
 * @param {string} context - 'leads', 'clients' или 'all'
 * @returns {string} - дефолтный статус
 */
export const getDefaultStatusForContext = (context) => {
  switch (context) {
    case STATUS_GROUPS.LEADS:
      return 'CREATED'; // Первый статус в воронке лидов
    case STATUS_GROUPS.CLIENTS:
      return 'IN_PROGRESS'; // Первый статус для клиентов
    case STATUS_GROUPS.ALL:
    default:
      return 'CREATED'; // По умолчанию создаем лида (можно изменить на любой)
  }
};

/**
 * Проверяет, может ли запись быть переведена из одного статуса в другой
 * @param {string} fromStatus - текущий статус
 * @param {string} toStatus - целевой статус
 * @returns {boolean} - можно ли перевести
 */
export const canTransitionStatus = (fromStatus, toStatus) => {
  const fromGroup = getStatusGroup(fromStatus);
  const toGroup = getStatusGroup(toStatus);

  // 🔧 ОБНОВЛЕНО: Разрешаем любые переводы статусов
  // 1. Внутри одной группы (лид -> лид, клиент -> клиент)
  // 2. Из лидов в клиенты (конверсия)
  // 3. Из клиентов обратно в лиды (редкий случай, но возможно)
  return true; // Разрешаем все переводы
};

/**
 * 🆕 НОВОЕ: Возвращает рекомендуемые следующие статусы для текущего
 * @param {string} currentStatus - текущий статус
 * @returns {array} - массив рекомендуемых следующих статусов
 */
export const getRecommendedNextStatuses = (currentStatus) => {
  // Последовательности статусов для лидов
  const leadFlow = ['CREATED', 'DISTRIBUTION', 'GIVE_ACCESS'];
  // Переход в клиенты
  const clientFlow = ['IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH'];

  if (isLeadStatus(currentStatus)) {
    const currentIndex = leadFlow.indexOf(currentStatus);
    const recommended = [];

    // Следующий статус в воронке лидов
    if (currentIndex >= 0 && currentIndex < leadFlow.length - 1) {
      recommended.push(leadFlow[currentIndex + 1]);
    }

    // Возможность перехода в клиенты (особенно с GIVE_ACCESS)
    if (currentStatus === 'GIVE_ACCESS') {
      recommended.push('IN_PROGRESS'); // Начал обучение
    }

    return recommended;
  }

  if (isClientStatus(currentStatus)) {
    const currentIndex = clientFlow.indexOf(currentStatus);
    const recommended = [];

    // Следующий статус в процессе обучения
    if (currentIndex >= 0 && currentIndex < clientFlow.length - 1) {
      recommended.push(clientFlow[currentIndex + 1]);
    }

    return recommended;
  }

  return [];
};

/**
 * 🆕 НОВОЕ: Получает описание статуса для пользователя
 * @param {string} status - статус
 * @returns {object} - объект с информацией о статусе
 */
export const getStatusInfo = (status) => {
  const group = getStatusGroup(status);
  const label = CLIENT_STATUS_LABELS[status] || status;

  return {
    status,
    label,
    group,
    groupName: group === 'lead' ? 'Лид' : group === 'client' ? 'Клиент' : 'Неизвестно',
    isLeadStatus: isLeadStatus(status),
    isClientStatus: isClientStatus(status),
    recommendedNext: getRecommendedNextStatuses(status)
  };
};