// src/hooks/useCashDesks.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export const useCashDesks = () => {
  const [cashDesks, setCashDesks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Получение всех касс
  const fetchCashDesks = useCallback(async (searchParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchParams.search) {
        params.append('search', searchParams.search);
      }

      if (searchParams.active_only) {
        params.append('active_only', 'true');
      }

      const qs = params.toString();
      const endpoint = qs ? `/cash-desks?${qs}` : '/cash-desks';
      const response = await apiService.getFresh(endpoint);
      // API возвращает массив напрямую, а не объект с полем data
      setCashDesks(Array.isArray(response) ? response : response?.data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Ошибка загрузки касс:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получение конкретной кассы
  const fetchCashDesk = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiService.get(`/cash-desks/${id}`);
      // API возвращает объект кассы напрямую
      return response?.data || response;
    } catch (error) {
      console.error('Ошибка загрузки кассы:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Создание новой кассы
  const createCashDesk = useCallback(async (cashDeskData) => {
    try {
      setLoading(true);
      const response = await apiService.post('/cash-desks', cashDeskData);

      // Добавляем новую кассу в список
      const newCashDesk = response?.data || response;
      setCashDesks(prev => [newCashDesk, ...prev]);

      return newCashDesk;
    } catch (error) {
      console.error('Ошибка создания кассы:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление кассы
  const updateCashDesk = useCallback(async (id, cashDeskData) => {
    try {
      setLoading(true);
      const response = await apiService.put(`/cash-desks/${id}`, cashDeskData);

      // Обновляем кассу в списке
      const updatedCashDesk = response?.data || response;
      setCashDesks(prev =>
        prev.map(cashDesk =>
          cashDesk.id === id ? updatedCashDesk : cashDesk
        )
      );

      return updatedCashDesk;
    } catch (error) {
      console.error('Ошибка обновления кассы:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Удаление кассы
  const deleteCashDesk = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiService.delete(`/cash-desks/${id}`);

      // Удаляем кассу из списка
      setCashDesks(prev => prev.filter(cashDesk => cashDesk.id !== id));

      return true;
    } catch (error) {
      console.error('Ошибка удаления кассы:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔧 ИСПРАВЛЕНИЕ: Получение операций конкретной кассы без влияния на общий loading
  const fetchCashDeskTransactions = useCallback(async (id, params = {}) => {
    try {
      // 🔧 НЕ устанавливаем общий loading для транзакций
      // setLoading(true); - убрано, чтобы не влиять на основной список касс

      const searchParams = new URLSearchParams();

      if (params.limit) searchParams.append('limit', params.limit);
      if (params.offset) searchParams.append('offset', params.offset);
      if (params.status) searchParams.append('status', params.status);

      const response = await apiService.get(`/cash-desks/${id}/transactions?${searchParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Ошибка загрузки операций кассы:', error);
      throw error;
    }
    // 🔧 НЕ сбрасываем loading здесь
    // finally { setLoading(false); } - убрано
  }, []);

  // 🔧 ИСПРАВЛЕНИЕ: Получение статистики по кассе без влияния на общий loading
  const fetchCashDeskStats = useCallback(async (id, period = '30') => {
    try {
      // 🔧 НЕ устанавливаем общий loading для статистики
      // setLoading(true); - убрано

      const response = await apiService.get(`/cash-desks/${id}/stats?period=${period}`);
      return response;
    } catch (error) {
      console.error('Ошибка загрузки статистики кассы:', error);
      throw error;
    }
    // 🔧 НЕ сбрасываем loading здесь
    // finally { setLoading(false); } - убрано
  }, []);

  // 📊 НОВОЕ: Получение истории баланса кассы для графика
  const fetchCashDeskBalanceHistory = useCallback(async (id, params = {}) => {
    try {
      // 🔧 НЕ устанавливаем общий loading для истории баланса
      // setLoading(true); - убрано, чтобы не влиять на основной список касс

      const searchParams = new URLSearchParams();

      if (params.period) searchParams.append('period', params.period);
      if (params.end_date) searchParams.append('end_date', params.end_date);

      const response = await apiService.get(`/cash-desks/${id}/balance-history?${searchParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Ошибка загрузки истории баланса кассы:', error);
      throw error;
    }
    // 🔧 НЕ сбрасываем loading здесь
    // finally { setLoading(false); } - убрано
  }, []);

  // Поиск касс
  const searchCashDesks = useCallback(async (searchTerm, searchFilter = 'name') => {
    const searchParams = {};

    if (searchTerm?.trim()) {
      searchParams.search = searchTerm.trim();
    }

    // Если фильтр "active", ищем только активные кассы
    if (searchFilter === 'active') {
      searchParams.active_only = true;
    }

    await fetchCashDesks(searchParams);
  }, [fetchCashDesks]);

  // Сброс результатов поиска
  const clearResults = useCallback(() => {
    setCashDesks([]);
    setShowResults(false);
  }, []);

  return {
    cashDesks,
    loading,
    showResults,
    fetchCashDesks,
    fetchCashDesk,
    createCashDesk,
    updateCashDesk,
    deleteCashDesk,
    fetchCashDeskTransactions,
    fetchCashDeskStats,
    fetchCashDeskBalanceHistory,
    searchCashDesks,
    clearResults
  };
};