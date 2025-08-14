// src/utils/financeUtils.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
export const getFinanceParticipants = (finance, clients = [], cashDesks = [], workers = []) => {
  const { type, client_id, cash_desk_id, worker_id, category, client_name, cash_desk_name, worker_name } = finance;

  // ✅ ПРИОРИТЕТ: Сначала пытаемся найти в массивах, потом используем имена из API
  let client = clients.find(c => c.id === client_id);
  let cashDesk = cashDesks.find(cd => cd.id === cash_desk_id);
  let worker = workers.find(w => w.id === worker_id);

  // ✅ FALLBACK: Если не нашли в массивах, создаем объекты из имен в API ответе
  if (!client && client_id && client_name) {
    client = {
      id: client_id,
      name: client_name
    };
  }

  if (!cashDesk && cash_desk_id && cash_desk_name) {
    cashDesk = {
      id: cash_desk_id,
      name: cash_desk_name
    };
  }

  if (!worker && worker_id && worker_name) {
    worker = {
      id: worker_id,
      name: worker_name
    };
  }

  // Определяем отправителя и получателя в зависимости от типа операции
  if (type === 'income') {
    // ДОХОД: Клиент → Касса
    return {
      sender: client ? {
        type: 'client',
        id: client.id,
        name: client.name || client.fullName,
        icon: 'User'
      } : null,
      recipient: cashDesk ? {
        type: 'cash_desk',
        id: cashDesk.id,
        name: cashDesk.name,
        icon: 'Wallet'
      } : null
    };
  }

  if (type === 'expense') {
    const isTransfer = category === 'Перевод между кассами';
    const isSalary = category === 'Зарплата';

    if (isTransfer) {
      // ПЕРЕВОД: Касса → Касса
      // Для переводов можно попробовать найти целевую кассу из описания
      let recipientCashDesk = null;

      // Простая логика: если в описании есть "→", пытаемся найти название после стрелки
      if (finance.description && finance.description.includes('→')) {
        const targetName = finance.description.split('→')[1]?.trim();
        if (targetName) {
          recipientCashDesk = {
            type: 'cash_desk',
            id: null,
            name: targetName,
            icon: 'Wallet'
          };
        }
      }

      return {
        sender: cashDesk ? {
          type: 'cash_desk',
          id: cashDesk.id,
          name: cashDesk.name,
          icon: 'Wallet'
        } : null,
        recipient: recipientCashDesk || {
          type: 'cash_desk',
          id: null,
          name: 'Другая касса',
          icon: 'Wallet'
        }
      };
    }

    if (isSalary) {
      // ЗАРПЛАТА: Касса → Работник
      return {
        sender: cashDesk ? {
          type: 'cash_desk',
          id: cashDesk.id,
          name: cashDesk.name,
          icon: 'Wallet'
        } : null,
        recipient: worker ? {
          type: 'worker',
          id: worker.id,
          name: worker.name,
          icon: 'Users'
        } : null
      };
    }

    // ОБЫЧНЫЙ РАСХОД: Касса → Клиент (если указан) или Внешний получатель
    return {
      sender: cashDesk ? {
        type: 'cash_desk',
        id: cashDesk.id,
        name: cashDesk.name,
        icon: 'Wallet'
      } : null,
      recipient: client ? {
        type: 'client',
        id: client.id,
        name: client.name || client.fullName,
        icon: 'User'
      } : {
        type: 'external',
        id: null,
        name: category || 'Внешний получатель',
        icon: 'Building'
      }
    };
  }

  return { sender: null, recipient: null };
};

// Вспомогательные функции для компонента
export const getIconEmoji = (iconName) => {
  const icons = {
    User: '👤',
    Wallet: '💳',
    Users: '👥',
    Building: '🏢'
  };
  return icons[iconName] || '❓';
};

export const getTypeColor = (type) => {
  const colors = {
    client: 'text-blue-600 bg-blue-50',
    cash_desk: 'text-green-600 bg-green-50',
    worker: 'text-purple-600 bg-purple-50',
    external: 'text-gray-600 bg-gray-50'
  };
  return colors[type] || 'text-gray-600 bg-gray-50';
};

export const getTypeName = (type) => {
  const names = {
    client: 'Клиент',
    cash_desk: 'Касса',
    worker: 'Сотрудник',
    external: 'Внешний'
  };
  return names[type] || 'Неизвестно';
};