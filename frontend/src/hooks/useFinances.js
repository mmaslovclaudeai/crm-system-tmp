// src/hooks/useFinances.js - Хук для работы с финансами
import { useState, useCallback, useEffect } from 'react';
import { financesService } from '../services/financesService';

export const useFinances = () => {
  // Основное состояние
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Фильтры и поиск
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('actual'); // actual или planned
  const [showResults, setShowResults] = useState(false);

  // Отдельные фильтры для Факт и План
  const [actualFilters, setActualFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: '',
    category: '',
    client: '',
    worker: '',
    cashDesk: '',
    minAmount: '',
    maxAmount: ''
  });

  const [plannedFilters, setPlannedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: '',
    category: '',
    client: '',
    worker: '',
    cashDesk: '',
    minAmount: '',
    maxAmount: ''
  });

  // Статистика
  const [financeSummary, setFinanceSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    operationsCount: 0
  });

  // Получение текущих фильтров в зависимости от статуса
  const getCurrentFilters = () => {
    return status === 'actual' ? actualFilters : plannedFilters;
  };

  // Загрузка операций
  const loadFinances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = getCurrentFilters();
      const response = await financesService.getFinances({
        ...currentFilters,
        status,
        search: searchTerm
      });

      setFinances(response);
      setShowResults(true);

      // Загружаем статистику
      const summaryResponse = await financesService.getFinanceSummary(currentFilters);
      setFinanceSummary(summaryResponse);

    } catch (error) {
      console.error('Ошибка загрузки операций:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [status, searchTerm, actualFilters, plannedFilters]); // Добавили правильные зависимости

  // Поиск операций
  const searchFinances = useCallback(async () => {
    await loadFinances();
  }, [loadFinances]);

  // Применение фильтров
  const applyFilters = useCallback(async (newFilters) => {
    if (status === 'actual') {
      setActualFilters(newFilters);
    } else {
      setPlannedFilters(newFilters);
    }
    // Не вызываем loadFinances автоматически, чтобы избежать циклов
  }, [status]);

  // Создание операции
  const createFinance = useCallback(async (financeData) => {
    try {
      setLoading(true);
      const response = await financesService.createFinance(financeData);

      setFinances(prev => [response, ...prev]);

      // Обновляем статистику
      const currentFilters = getCurrentFilters();
      const summaryResponse = await financesService.getFinanceSummary(currentFilters);
      setFinanceSummary(summaryResponse);

      return response;
    } catch (error) {
      console.error('Ошибка создания операции:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [status, actualFilters, plannedFilters]);

  // Создание перевода между кассами
  const createTransfer = useCallback(async (transferData) => {
    try {
      setLoading(true);
      const response = await financesService.createTransfer(transferData);

      // Transfer создает две операции, добавляем их обе
      if (response && response.data && response.data.operations) {
        setFinances(prev => [...response.data.operations, ...prev]);
      }

      // Обновляем статистику
      const currentFilters = getCurrentFilters();
      const summaryResponse = await financesService.getFinanceSummary(currentFilters);
      setFinanceSummary(summaryResponse);

      return response;
    } catch (error) {
      console.error('Ошибка создания transfer операции:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getCurrentFilters]);

  // Обновление операции
  const updateFinance = useCallback(async (id, financeData) => {
    try {
      setLoading(true);
      const response = await financesService.updateFinance(id, financeData);

      setFinances(prev => prev.map(finance =>
        finance.id === id ? { ...finance, ...response } : finance
      ));

      // Обновляем статистику
      const currentFilters = getCurrentFilters();
      const summaryResponse = await financesService.getFinanceSummary(currentFilters);
      setFinanceSummary(summaryResponse);

      return response;
    } catch (error) {
      console.error('Ошибка обновления операции:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [status, actualFilters, plannedFilters]);

  // Удаление операции
  const deleteFinance = useCallback(async (id) => {
    try {
      setLoading(true);
      await financesService.deleteFinance(id);

      setFinances(prev => prev.filter(finance => finance.id !== id));

      // Обновляем статистику
      const currentFilters = getCurrentFilters();
      const summaryResponse = await financesService.getFinanceSummary(currentFilters);
      setFinanceSummary(summaryResponse);

      return true;
    } catch (error) {
      console.error('Ошибка удаления операции:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [status, actualFilters, plannedFilters]);

  // Экспорт в CSV
  const exportToCSV = useCallback(async (filters = null) => {
    try {
      const exportFilters = filters || getCurrentFilters();
      const response = await financesService.exportToCSV({
        ...exportFilters,
        status
      });

      // Создаем и скачиваем файл
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `finances_${status}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error('Ошибка экспорта в CSV:', error);
      throw error;
    }
  }, [status, getCurrentFilters]);

  // Загрузка данных только при изменении статуса или поискового запроса
  useEffect(() => {
    loadFinances();
  }, [loadFinances]); // Добавили loadFinances в зависимости

  // Обработчик изменения статуса
  const handleStatusChange = useCallback((newStatus) => {
    setStatus(newStatus);
  }, []);

  // Очистка результатов поиска
  const clearResults = useCallback(() => {
    setShowResults(false);
    setSearchTerm('');
    setActualFilters({
      dateFrom: '',
      dateTo: '',
      type: '',
      category: '',
      client: '',
      worker: '',
      cashDesk: '',
      minAmount: '',
      maxAmount: ''
    });
    setPlannedFilters({
      dateFrom: '',
      dateTo: '',
      type: '',
      category: '',
      client: '',
      worker: '',
      cashDesk: '',
      minAmount: '',
      maxAmount: ''
    });
  }, []);

  // Загрузка данных за текущий месяц
  const loadCurrentMonthFinances = useCallback(async () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const currentMonthFilters = {
      dateFrom: firstDay.toISOString().split('T')[0],
      dateTo: lastDay.toISOString().split('T')[0],
      type: '',
      category: '',
      client: '',
      worker: '',
      cashDesk: '',
      minAmount: '',
      maxAmount: ''
    };

    if (status === 'actual') {
      setActualFilters(currentMonthFilters);
    } else {
      setPlannedFilters(currentMonthFilters);
    }

    // Вызываем loadFinances напрямую, а не через зависимость
    try {
      setLoading(true);
      setError(null);

      const response = await financesService.getFinances({
        ...currentMonthFilters,
        status,
        search: searchTerm
      });

      setFinances(response);
      setShowResults(true);

      // Загружаем статистику
      const summaryResponse = await financesService.getFinanceSummary(currentMonthFilters);
      setFinanceSummary(summaryResponse);

    } catch (error) {
      console.error('Ошибка загрузки операций:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [status, searchTerm]);

  // Загрузка всех финансов без фильтров
  const loadAllFinances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await financesService.getFinances({
        status,
        search: ''
      });

      setFinances(response);
      setShowResults(true);

      // Загружаем статистику
      const summaryResponse = await financesService.getFinanceSummary({});
      setFinanceSummary(summaryResponse);

    } catch (error) {
      console.error('Ошибка загрузки всех операций:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // 🆕 МЕТОД ДЛЯ ПОЛУЧЕНИЯ ФИНАНСОВОЙ АНАЛИТИКИ
  const getAnalytics = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await financesService.getFinanceAnalytics(params);
      return response;
    } catch (error) {
      console.error('Ошибка получения аналитики:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🆕 МЕТОД ДЛЯ ПОЛУЧЕНИЯ ИСТОРИИ БАЛАНСА
  const getBalanceHistory = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await financesService.getBalanceHistory(params);
      return response;
    } catch (error) {
      console.error('Ошибка получения истории баланса:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);



  return {
    // Состояние
    finances,
    loading,
    error,
    financeSummary,
    showResults,

    // Фильтры
    status,
    searchTerm,
    actualFilters,
    plannedFilters,

    // Методы
    loadFinances,
    searchFinances,
    applyFilters,
    createFinance,
    createTransfer,
    updateFinance,
    deleteFinance,
    exportToCSV,
    handleStatusChange,
    clearResults,
    loadCurrentMonthFinances,
    loadAllFinances,
    getCurrentFilters,
    switchStatus: handleStatusChange,
    getAnalytics, // 🆕 НОВЫЙ МЕТОД
    getBalanceHistory, // 🆕 НОВЫЙ МЕТОД

    // Сеттеры
    setSearchTerm,
    setStatus,
    setActualFilters,
    setPlannedFilters
  };
};