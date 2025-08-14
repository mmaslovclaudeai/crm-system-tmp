// utils/transferGroupingUtils.js

/**
 * Группирует переводы между кассами в один логический платеж
 * @param {Array} finances - массив всех финансовых операций
 * @param {Array} cashDesks - массив касс для получения названий
 * @returns {Array} - массив с сгруппированными переводами
 */
export const groupTransferPayments = (finances, cashDesks = []) => {
  console.log('🔄 Группировка переводов:', {
    totalFinances: finances.length,
    cashDesksCount: cashDesks.length
  });

  // Находим все переводы между кассами
  const transfers = finances.filter(finance =>
    (finance.category === 'Перевод между касс' || finance.category === 'Перевод между кассами') &&
    finance.transfer_pair_id
  );

  console.log('💸 Найдено переводов:', transfers.length);

  // Создаем Set для отслеживания уже обработанных ID
  const processedIds = new Set();
  const groupedTransfers = [];

  // Создаем объект для быстрого поиска касс по ID
  const cashDeskMap = cashDesks.reduce((acc, desk) => {
    acc[desk.id] = desk;
    return acc;
  }, {});

  transfers.forEach(transfer => {
    // Если этот перевод уже обработан, пропускаем
    if (processedIds.has(transfer.id)) {
      return;
    }

    // Ищем парный перевод
    const pairTransfer = transfers.find(t =>
      t.id === transfer.transfer_pair_id &&
      t.transfer_pair_id === transfer.id
    );

    if (pairTransfer) {
      console.log('👥 Найдена пара переводов:', {
        id1: transfer.id,
        amount1: transfer.amount,
        cashDesk1: transfer.cash_desk_id,
        id2: pairTransfer.id,
        amount2: pairTransfer.amount,
        cashDesk2: pairTransfer.cash_desk_id
      });

      // Определяем какой перевод расходный (отрицательный), а какой приходный
      const isCurrentNegative = Number(transfer.amount) < 0;
      const negativeTransfer = isCurrentNegative ? transfer : pairTransfer;
      const positiveTransfer = isCurrentNegative ? pairTransfer : transfer;

      // Получаем информацию о кассах - сначала из мапы по ID, потом из названий в данных
      let fromCashDesk = cashDeskMap[negativeTransfer.cash_desk_id];
      let toCashDesk = cashDeskMap[positiveTransfer.cash_desk_id];

      // Если не нашли в мапе, используем названия из API ответа
      if (!fromCashDesk && negativeTransfer.cash_desk_name) {
        fromCashDesk = {
          id: negativeTransfer.cash_desk_id,
          name: negativeTransfer.cash_desk_name
        };
      }

      if (!toCashDesk && positiveTransfer.cash_desk_name) {
        toCashDesk = {
          id: positiveTransfer.cash_desk_id,
          name: positiveTransfer.cash_desk_name
        };
      }

      console.log('🏦 Информация о кассах:', {
        fromCashDesk: fromCashDesk?.name || 'НЕ НАЙДЕНА',
        toCashDesk: toCashDesk?.name || 'НЕ НАЙДЕНА'
      });

      // Создаем сгруппированный перевод
      const groupedTransfer = {
        id: `transfer_${Math.min(transfer.id, pairTransfer.id)}_${Math.max(transfer.id, pairTransfer.id)}`,
        type: 'transfer',
        category: 'Перевод между касс',
        amount: Math.abs(Number(negativeTransfer.amount)), // Всегда положительная сумма
        date: negativeTransfer.date, // Берем дату из расходной операции
        status: negativeTransfer.status,
        description: `Перевод ${Math.abs(Number(negativeTransfer.amount)).toLocaleString('ru-RU')} ₽ из ${fromCashDesk?.name || 'Касса'} в ${toCashDesk?.name || 'Касса'}`,

        // Информация о переводе
        from_cash_desk_id: negativeTransfer.cash_desk_id,
        to_cash_desk_id: positiveTransfer.cash_desk_id,
        from_cash_desk: fromCashDesk,
        to_cash_desk: toCashDesk,

        // Исходные операции для возможности редактирования
        original_payments: [negativeTransfer, positiveTransfer],

        // Флаг что это сгруппированный перевод
        is_grouped_transfer: true
      };

      groupedTransfers.push(groupedTransfer);

      // Отмечаем оба ID как обработанные
      processedIds.add(transfer.id);
      processedIds.add(pairTransfer.id);
    }
  });

  // Фильтруем исходный массив, исключая сгруппированные переводы
  const filteredFinances = finances.filter(finance =>
    !((finance.category === 'Перевод между касс' || finance.category === 'Перевод между кассами') &&
      finance.transfer_pair_id &&
      processedIds.has(finance.id))
  );

  // Возвращаем объединенный массив, отсортированный по дате (новые сначала)
  const result = [...filteredFinances, ...groupedTransfers].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    // Первичная сортировка по дате
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB - dateA; // Новые записи сначала
    }

    // Вторичная сортировка по времени создания (если есть поле created_at)
    if (a.created_at && b.created_at) {
      return new Date(b.created_at) - new Date(a.created_at);
    }

    // Третичная сортировка по ID (для стабильности)
    const idA = typeof a.id === 'string' ? parseInt(a.id.split('_')[1] || '0') : a.id;
    const idB = typeof b.id === 'string' ? parseInt(b.id.split('_')[1] || '0') : b.id;
    return idB - idA;
  });

  console.log('✅ Результат группировки:', {
    исходныхОпераций: finances.length,
    найденоПереводов: transfers.length,
    сгруппированныхПереводов: groupedTransfers.length,
    итоговыхОпераций: result.length
  });

  return result;
};

/**
 * Получает участников для сгруппированного перевода
 * @param {Object} groupedTransfer - сгруппированный перевод
 * @returns {Object} - объект с отправителем и получателем
 */
export const getTransferParticipants = (groupedTransfer) => {
  return {
    sender: {
      type: 'cash_desk',
      id: groupedTransfer.from_cash_desk?.id || groupedTransfer.from_cash_desk_id,
      name: groupedTransfer.from_cash_desk?.name || `Касса #${groupedTransfer.from_cash_desk_id}`,
      icon: 'Wallet'
    },
    recipient: {
      type: 'cash_desk',
      id: groupedTransfer.to_cash_desk?.id || groupedTransfer.to_cash_desk_id,
      name: groupedTransfer.to_cash_desk?.name || `Касса #${groupedTransfer.to_cash_desk_id}`,
      icon: 'Wallet'
    }
  };
};