// src/components/client-card/hooks/useClientData.js
import { useState, useEffect } from 'react';
import { clientsService } from '../../../services/clientsService.js';
import { financesService } from '../../../services/financesService.js';

export const useClientData = (clientId, onError) => {
  // Основные данные
  const [client, setClient] = useState(null);
  const [clientFinances, setClientFinances] = useState([]);
  const [clientStats, setClientStats] = useState({
    totalOperations: 0,
    totalAmount: 0,
    lastOperation: null,
    averageCheck: 0
  });

  // Состояния загрузки
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Вычисление статистики на основе финансовых операций
  const calculateStats = (finances) => {
    if (!finances || finances.length === 0) {
      setClientStats({
        totalOperations: 0,
        totalAmount: 0,
        lastOperation: null,
        averageCheck: 0
      });
      return;
    }

    const totalAmount = finances.reduce((sum, f) => sum + Number(f.amount), 0);
    const lastOperation = finances.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const averageCheck = totalAmount / finances.length;

    setClientStats({
      totalOperations: finances.length,
      totalAmount,
      lastOperation,
      averageCheck
    });
  };

  // Загрузка данных клиента
  const loadClientData = async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      // Загружаем основные данные клиента
      const clientData = await clientsService.getClient(clientId);
      setClient(clientData);

      // Загружаем финансовые операции клиента
      const financesData = await financesService.getClientFinances(clientId);
      setClientFinances(financesData);

      // Вычисляем статистику
      calculateStats(financesData);
    } catch (err) {
      console.error('Ошибка загрузки данных клиента:', err);
      const errorMessage = err.message;
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Обновление данных клиента (например, после редактирования)
  const updateClientData = (updatedClient) => {
    setClient(updatedClient);
  };

  // Перезагрузка финансовых данных
  const reloadFinances = async () => {
    if (!clientId) return;

    try {
      const financesData = await financesService.getClientFinances(clientId);
      setClientFinances(financesData);
      calculateStats(financesData);
    } catch (err) {
      console.error('Ошибка перезагрузки финансов:', err);
    }
  };

  // Загрузка данных при монтировании или изменении clientId
  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  return {
    // Данные
    client,
    clientFinances,
    clientStats,

    // Состояния
    loading,
    error,

    // Методы
    loadClientData,
    updateClientData,
    reloadFinances,
    calculateStats
  };
};