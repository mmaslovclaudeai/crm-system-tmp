// src/hooks/useClients.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С МАППИНГОМ ПОЛЕЙ
import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import { STATUS_GROUPS } from '../constants';


export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);



  // 🔧 НОВАЯ ФУНКЦИЯ: Поиск клиентов/лидов через API с поддержкой групп статусов
  const fetchClients = useCallback(async (searchParams = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchParams.search) {
        params.append('search', searchParams.search);
      }

      if (searchParams.filter) {
        params.append('filter', searchParams.filter);
      }

      // 🔧 НОВОЕ: Добавляем фильтрацию по группам статусов
      if (searchParams.statusGroup) {
        params.append('status_group', searchParams.statusGroup);
      }

      const response = await apiService.get(`/clients?${params.toString()}`);
      setClients(response || []);
      setShowResults(true);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔧 ОБНОВЛЕННАЯ ФУНКЦИЯ: Поиск клиентов с группой статусов
  const searchClients = useCallback(async (searchTerm, searchFilter = 'name', statusGroup = STATUS_GROUPS.ALL) => {
    const searchParams = {};

    if (searchTerm?.trim()) {
      searchParams.search = searchTerm.trim();
      searchParams.filter = searchFilter;
    }

    // 🔧 НОВОЕ: Добавляем группу статусов
    if (statusGroup && statusGroup !== STATUS_GROUPS.ALL) {
      searchParams.statusGroup = statusGroup;
    }

    await fetchClients(searchParams);
  }, [fetchClients]);

  // 🔧 НОВАЯ ФУНКЦИЯ: Поиск только лидов
  const searchLeads = useCallback(async (searchTerm, searchFilter = 'name') => {
    console.log('🎯 Поиск лидов:', { searchTerm, searchFilter });
    await searchClients(searchTerm, searchFilter, STATUS_GROUPS.LEADS);
  }, [searchClients]);

  // 🔧 НОВАЯ ФУНКЦИЯ: Поиск только активных клиентов
  const searchActiveClients = useCallback(async (searchTerm, searchFilter = 'name') => {
    console.log('👥 Поиск активных клиентов:', { searchTerm, searchFilter });
    await searchClients(searchTerm, searchFilter, STATUS_GROUPS.CLIENTS);
  }, [searchClients]);

  // 🔧 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Создание клиента с маппингом fullName → name
  const createClient = useCallback(async (clientData) => {
    try {
      setLoading(true);
      
      // 🔧 ИСПРАВЛЕНИЕ: Маппим fullName в name для API
      const apiData = {
        ...clientData,
        name: clientData.fullName || clientData.name, // ✅ API ожидает "name"
      };
      
      // 🔧 УДАЛЯЕМ fullName если он есть, чтобы не дублировать
      if (apiData.fullName) {
        delete apiData.fullName;
      }
      
      console.log('🔄 Создание клиента - отправляем в API:', apiData);
      
      const response = await apiService.post('/clients', apiData);

      
              setClients(prev => [response, ...prev]);

      console.log('✅ Клиент создан успешно:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка создания клиента:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔧 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Обновление клиента с маппингом fullName → name
  const updateClient = useCallback(async (id, clientData) => {
    try {
      setLoading(true);
      
      // 🔧 ИСПРАВЛЕНИЕ: Маппим fullName в name для API
      const apiData = {
        ...clientData,
        name: clientData.fullName || clientData.name, // ✅ API ожидает "name"
      };
      
      // 🔧 УДАЛЯЕМ fullName если он есть
      if (apiData.fullName) {
        delete apiData.fullName;
      }
      
      console.log('🔄 Обновление клиента - отправляем в API:', { id, data: apiData });
      
      const response = await apiService.put(`/clients/${id}`, apiData);

      
              setClients(prev => prev.map(client =>
          client.id === id ? { ...client, ...response } : client
        ));

      console.log('✅ Клиент обновлен успешно:', response);
      return response;
    } catch (error) {
      console.error('❌ Ошибка обновления клиента:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Удаление клиента
  const deleteClient = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiService.delete(`/clients/${id}`);

      
              setClients(prev => prev.filter(client => client.id !== id));

      return true;
    } catch (error) {
      console.error('Ошибка удаления клиента:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получение клиента по ID
  const getClientById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiService.get(`/clients/${id}`);
      return response;
    } catch (error) {
      console.error('Ошибка загрузки клиента:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);



  // 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

  // Группировка клиентов по статусам (для Kanban)
  const groupClientsByStatus = useCallback((clientsList = clients) => {
    const grouped = {
      CREATED: [],
      DISTRIBUTION: [],
      GIVE_ACCESS: [],
      IN_PROGRESS: [],
      SEARCH_OFFER: [],
      ACCEPT_OFFER: [],
      PAYING_OFFER: [],
      FINISH: []
    };

    clientsList.forEach(client => {
      if (grouped[client.status]) {
        grouped[client.status].push(client);
      }
    });

    return grouped;
  }, [clients]);

  // Фильтрация клиентов по группе статусов
  const filterClientsByGroup = useCallback((statusGroup, clientsList = clients) => {
    switch (statusGroup) {
      case STATUS_GROUPS.LEADS:
        return clientsList.filter(client =>
          ['CREATED', 'DISTRIBUTION', 'GIVE_ACCESS'].includes(client.status)
        );

      case STATUS_GROUPS.CLIENTS:
        return clientsList.filter(client =>
          ['IN_PROGRESS', 'SEARCH_OFFER', 'ACCEPT_OFFER', 'PAYING_OFFER', 'FINISH'].includes(client.status)
        );

      case STATUS_GROUPS.ALL:
      default:
        return clientsList;
    }
  }, [clients]);

  // Получение статистики
  const getClientsStats = useCallback(() => {
    const leads = filterClientsByGroup(STATUS_GROUPS.LEADS);
    const activeClients = filterClientsByGroup(STATUS_GROUPS.CLIENTS);

    return {
      total: clients.length,
      leads: leads.length,
      clients: activeClients.length,
      byStatus: groupClientsByStatus()
    };
  }, [clients, filterClientsByGroup, groupClientsByStatus]);

  // 🔧 БЫСТРЫЕ ОПЕРАЦИИ

  // Загрузка всех клиентов
  const loadAllClients = useCallback(async () => {
    await fetchClients();
  }, [fetchClients]);

  // Загрузка только лидов
  const loadLeads = useCallback(async () => {
    await searchLeads('');
  }, [searchLeads]);

  // Загрузка только активных клиентов
  const loadActiveClients = useCallback(async () => {
    await searchActiveClients('');
  }, [searchActiveClients]);

  // Очистка результатов поиска
  const clearResults = useCallback(() => {
    setClients([]);
    setShowResults(false);
  }, []);

  // 🔧 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Обновление статуса клиента с правильным маппингом
  const updateClientStatus = useCallback(async (clientId, newStatus) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      throw new Error('Клиент не найден');
    }

    // 🔧 ИСПРАВЛЕНИЕ: Формируем данные для обновления с правильным маппингом
    const updateData = {
      fullName: client.name, // Конвертируем обратно для формы
      email: client.email,
      phone: client.phone,
      status: newStatus
    };

    return await updateClient(clientId, updateData);
  }, [clients, updateClient]);

  return {
    // Состояние
    clients,
    loading,
    showResults,

    // Поиск и загрузка
    fetchClients,
    searchClients,
    searchLeads,
    searchActiveClients,
    loadAllClients,
    loadLeads,
    loadActiveClients,

    // CRUD операции
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    updateClientStatus,

    // Утилиты
    groupClientsByStatus,
    filterClientsByGroup,
    getClientsStats,
    clearResults,


  };
};
