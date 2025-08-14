// src/services/financesService.js
import { apiService } from './api';

export const financesService = {
  // 💰 ПОЛУЧЕНИЕ ФИНАНСОВЫХ ОПЕРАЦИЙ С РАСШИРЕННОЙ ФИЛЬТРАЦИЕЙ
  async getFinances(filters = {}) {
    const params = new URLSearchParams();

    // Добавляем параметры фильтрации
    if (filters.search) {
      params.append('search', filters.search);
    }

    if (filters.status) {
      params.append('status', filters.status);
    }

    // Фильтрация по датам
    if (filters.date_from) {
      params.append('date_from', filters.date_from);
    }

    if (filters.date_to) {
      params.append('date_to', filters.date_to);
    }

    // 🆕 НОВЫЕ ПАРАМЕТРЫ ФИЛЬТРАЦИИ
    if (filters.cash_desk_id) {
      params.append('cash_desk_id', filters.cash_desk_id);
    }

    if (filters.client_search) {
      params.append('client_search', filters.client_search);
    }

    if (filters.worker_search) {
      params.append('worker_search', filters.worker_search);
    }

    if (filters.category) {
      params.append('category', filters.category);
    }

    if (filters.description) {
      params.append('description', filters.description);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/finances?${queryString}` : '/finances';

    console.log('🔍 Запрос финансовых операций с фильтрами:', filters);

    return apiService.get(endpoint);
  },

  // 📊 ПОЛУЧЕНИЕ СТАТИСТИКИ С ФИЛЬТРАЦИЕЙ ПО ДАТАМ
  async getFinanceSummary(filters = {}) {
    const params = new URLSearchParams();

    // 🆕 НОВОЕ: Поддержка фильтрации по датам в статистике
    if (filters.date_from) {
      params.append('date_from', filters.date_from);
    }

    if (filters.date_to) {
      params.append('date_to', filters.date_to);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/finances/summary/stats?${queryString}` : '/finances/summary/stats';

    console.log('📊 Запрос статистики финансов с фильтрами:', filters);

    return apiService.get(endpoint);
  },

  // 💸 ПОЛУЧЕНИЕ ОПЕРАЦИЙ ПО КЛИЕНТУ
  async getClientFinances(clientId) {
    console.log('💸 Запрос операций для клиента:', clientId);
    return apiService.get(`/finances/client/${clientId}`);
  },

  // 💳 СОЗДАНИЕ НОВОЙ ОПЕРАЦИИ
  async createFinance(financeData) {
    console.log('💳 Создание новой финансовой операции:', financeData);
    return apiService.post('/finances', financeData);
  },

  // 🔄 СОЗДАНИЕ ПЕРЕВОДА МЕЖДУ КАСС
  async createTransfer(transferData) {
    console.log('🔄 Создание transfer пары:', transferData);
    return apiService.post('/finances/transfer', transferData);
  },

  // 🔄 ОБНОВЛЕНИЕ ОПЕРАЦИИ
  async updateFinance(id, financeData) {
    console.log('🔄 Обновление финансовой операции:', { id, financeData });
    return apiService.put(`/finances/${id}`, financeData);
  },

  // 🗑️ УДАЛЕНИЕ ОПЕРАЦИИ
  async deleteFinance(id) {
    console.log('🗑️ Удаление финансовой операции:', id);
    return apiService.delete(`/finances/${id}`);
  },

  // 📈 ПОЛУЧЕНИЕ КОНКРЕТНОЙ ОПЕРАЦИИ
  async getFinanceById(id) {
    console.log('📈 Запрос операции по ID:', id);
    return apiService.get(`/finances/${id}`);
  },

  // 🔧 УТИЛИТЫ ДЛЯ РАБОТЫ С ДАТАМИ

  // Форматирование даты для API (YYYY-MM-DD)
  formatDateForAPI(date) {
    if (!date) return null;

    if (typeof date === 'string') {
      // Если дата в формате DD.MM.YYYY
      if (date.includes('.')) {
        const [day, month, year] = date.split('.');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      return date;
    }

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    return null;
  },

  // Получение первого дня текущего месяца
  getFirstDayOfCurrentMonth() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.formatDateForAPI(firstDay);
  },

  // Получение текущей даты
  getCurrentDate() {
    return this.formatDateForAPI(new Date());
  },

  // 🎯 ГОТОВЫЕ ФИЛЬТРЫ ДЛЯ УДОБСТВА

  // Операции за текущий месяц
  async getFinancesForCurrentMonth() {
    const dateFrom = this.getFirstDayOfCurrentMonth();
    const dateTo = this.getCurrentDate();

    return this.getFinances({
      date_from: dateFrom,
      date_to: dateTo
    });
  },

  // Операции за последние 7 дней
  async getFinancesForLastWeek() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.getFinances({
      date_from: this.formatDateForAPI(lastWeek),
      date_to: this.formatDateForAPI(now)
    });
  },

  // Операции за последние 30 дней
  async getFinancesForLastMonth() {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.getFinances({
      date_from: this.formatDateForAPI(lastMonth),
      date_to: this.formatDateForAPI(now)
    });
  },

  // Фактические операции за период
  async getActualFinancesForPeriod(dateFrom, dateTo) {
    return this.getFinances({
      status: 'actual',
      date_from: this.formatDateForAPI(dateFrom),
      date_to: this.formatDateForAPI(dateTo)
    });
  },

  // Планируемые операции за период
  async getPlannedFinancesForPeriod(dateFrom, dateTo) {
    return this.getFinances({
      status: 'planned',
      date_from: this.formatDateForAPI(dateFrom),
      date_to: this.formatDateForAPI(dateTo)
    });
  },

  // 🆕 МЕТОД ДЛЯ ПОЛУЧЕНИЯ ФИНАНСОВОЙ АНАЛИТИКИ
  async getFinanceAnalytics(params = {}) {
    try {
      const { period = 30, start_date, end_date } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('period', period);
      
      if (start_date) queryParams.append('start_date', start_date);
      if (end_date) queryParams.append('end_date', end_date);

      const response = await apiService.get(`/finances/analytics?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Ошибка получения финансовой аналитики:', error);
      throw error;
    }
  },

  // 🆕 МЕТОД ДЛЯ ПОЛУЧЕНИЯ ИСТОРИИ БАЛАНСА
  async getBalanceHistory(params = {}) {
    try {
      const { period = 30, start_date, end_date } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('period', period);
      
      if (start_date) queryParams.append('start_date', start_date);
      if (end_date) queryParams.append('end_date', end_date);

      const response = await apiService.get(`/finances/balance-history?${queryParams}`);
      return response;
    } catch (error) {
      console.error('Ошибка получения истории баланса:', error);
      throw error;
    }
  }
};

export default financesService;