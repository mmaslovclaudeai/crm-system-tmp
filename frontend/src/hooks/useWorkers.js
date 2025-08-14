// src/hooks/useWorkers.js - Хук для работы с API работников
import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { apiService } from '../services/api';


export const useWorkers = () => {
  // Состояния
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔧 ОСНОВНЫЕ API ФУНКЦИИ

  // Получение списка работников
  const fetchWorkers = useCallback(async (searchParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      // Добавляем параметры поиска
      if (searchParams.search) {
        queryParams.append('search', searchParams.search);
      }
      if (searchParams.active_only !== undefined) {
        queryParams.append('active_only', searchParams.active_only);
      }

      const endpoint = `/workers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await apiService.get(endpoint);
      
      setWorkers(Array.isArray(data) ? data : []);

      console.log(`👥 Загружено работников: ${Array.isArray(data) ? data.length : 0}`);

    } catch (err) {
      console.error('Ошибка при загрузке работников:', err);
      setError(err.message);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Создание нового работника
  const createWorker = useCallback(async (workerData) => {
    setLoading(true);
    setError(null);

    try {
      const newWorker = await apiService.post('/workers', workerData);

      // Добавляем нового работника в список
      setWorkers(prev => [newWorker, ...prev]);

      console.log(`✅ Создан новый работник: ${newWorker.full_name}`);
      return newWorker;

    } catch (err) {
      console.error('Ошибка при создании работника:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление работника
  const updateWorker = useCallback(async (workerId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const updatedWorker = await apiService.put(`/workers/${workerId}`, updateData);

      // Обновляем работника в списке
      setWorkers(prev =>
        prev.map(worker =>
          worker.id === workerId ? updatedWorker : worker
        )
      );

      console.log(`✅ Обновлен работник: ${updatedWorker.full_name}`);
      return updatedWorker;

    } catch (err) {
      console.error('Ошибка при обновлении работника:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Удаление работника
  const deleteWorker = useCallback(async (workerId) => {
    setLoading(true);
    setError(null);

    try {
      await apiService.delete(`/workers/${workerId}`);

      // Удаляем работника из списка
      setWorkers(prev => prev.filter(worker => worker.id !== workerId));

      console.log(`🗑️ Удален работник с ID: ${workerId}`);

    } catch (err) {
      console.error('Ошибка при удалении работника:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получение конкретного работника
  const fetchWorkerById = useCallback(async (workerId) => {
    setLoading(true);
    setError(null);

    try {
      const worker = await apiService.get(`/workers/${workerId}`);
      console.log(`👤 Загружен работник: ${worker.full_name}`);
      return worker;

    } catch (err) {
      console.error('Ошибка при загрузке работника:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получение финансовых операций работника
  const fetchWorkerFinances = useCallback(async (workerId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.get(`/workers/${workerId}/finances`);
      console.log(`💰 Загружены финансы работника ${workerId}: ${data.length} операций`);
      return data;

    } catch (err) {
      console.error('Ошибка при загрузке финансов работника:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получение статистики работника
  const fetchWorkerStats = useCallback(async (workerId) => {
    setLoading(true);
    setError(null);

    try {
      const stats = await apiService.get(`/workers/${workerId}/stats`);
      console.log(`📊 Загружена статистика работника ${workerId}`);
      return stats;

    } catch (err) {
      console.error('Ошибка при загрузке статистики работника:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔧 ФУНКЦИИ ПОИСКА И ФИЛЬТРАЦИИ

  // Поиск работников
  const searchWorkers = useCallback(async (searchTerm, activeOnly = false) => {
    console.log(`🔍 Поиск работников: "${searchTerm}", только активные: ${activeOnly}`);

    await fetchWorkers({
      search: searchTerm,
      active_only: activeOnly
    });
  }, [fetchWorkers]);

  // Загрузка только активных работников
  const searchActiveWorkers = useCallback(async (searchTerm = '') => {
    await searchWorkers(searchTerm, true);
  }, [searchWorkers]);

  // Загрузка всех работников
  const searchAllWorkers = useCallback(async (searchTerm = '') => {
    await searchWorkers(searchTerm, false);
  }, [searchWorkers]);



  // 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

  // Фильтрация работников по статусу
  const filterWorkersByStatus = useCallback((activeOnly, workersList = workers) => {
    if (activeOnly) {
      return workersList.filter(worker => worker.is_active);
    }
    return workersList;
  }, [workers]);

  // Группировка работников по должностям
  const groupWorkersByPosition = useCallback((workersList = workers) => {
    const grouped = {};

    workersList.forEach(worker => {
      const position = worker.position || 'Не указано';
      if (!grouped[position]) {
        grouped[position] = [];
      }
      grouped[position].push(worker);
    });

    return grouped;
  }, [workers]);

  // Получение статистики
  const getWorkersStats = useCallback(() => {
    const activeWorkers = filterWorkersByStatus(true);
    const inactiveWorkers = filterWorkersByStatus(false).filter(w => !w.is_active);

    return {
      total: workers.length,
      active: activeWorkers.length,
      inactive: inactiveWorkers.length,
      byPosition: groupWorkersByPosition()
    };
  }, [workers, filterWorkersByStatus, groupWorkersByPosition]);

  // 🔧 БЫСТРЫЕ ОПЕРАЦИИ

  // Загрузка всех работников
  const loadAllWorkers = useCallback(async () => {
    await fetchWorkers();
  }, [fetchWorkers]);

  // Загрузка только активных работников
  const loadActiveWorkers = useCallback(async () => {
    await searchActiveWorkers('');
  }, [searchActiveWorkers]);

  // Обновление статуса работника (увольнение/восстановление)
  const toggleWorkerStatus = useCallback(async (workerId, newStatus) => {
    const updateData = {
      is_active: newStatus,
      fire_date: newStatus ? null : new Date().toISOString().split('T')[0]
    };

    return await updateWorker(workerId, updateData);
  }, [updateWorker]);

  return {
    // Состояния
    workers,
    loading,
    error,

    // Основные операции
    fetchWorkers,
    createWorker,
    updateWorker,
    deleteWorker,
    fetchWorkerById,
    fetchWorkerFinances,
    fetchWorkerStats,

    // Поиск и фильтрация
    searchWorkers,
    searchActiveWorkers,
    searchAllWorkers,

    // Вспомогательные функции
    filterWorkersByStatus,
    groupWorkersByPosition,
    getWorkersStats,

    // Быстрые операции
    loadAllWorkers,
    loadActiveWorkers,
    toggleWorkerStatus,

    // Очистка ошибок
    clearError: () => setError(null)
  };
};