// src/services/api.js
import { API_BASE_URL } from '../constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/tokenManager';

class ApiService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    this.requestCache = new Map(); // Кеш для предотвращения дублирования
  }

  // Генерация ключа для кеширования запросов
  generateRequestKey(endpoint, options) {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${endpoint}:${body}`;
  }

  // Обработка очереди запросов при обновлении токена
  processQueue(error, token = null) {
    this.failedQueue.forEach(({resolve, reject}) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // Обновление токена
  async refreshAccessToken() {
    if (this.isRefreshing) {
      // Если уже обновляем токен, добавляем запрос в очередь
      return new Promise((resolve, reject) => {
        this.failedQueue.push({resolve, reject});
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Прямой запрос для обновления токена, чтобы избежать циклической зависимости
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({refreshToken}),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const {accessToken} = data;

      saveTokens(accessToken, refreshToken);
      this.processQueue(null, accessToken);

      return accessToken;
    } catch (error) {
      this.processQueue(error);
      clearTokens();

      // Перенаправляем на страницу входа
      if (typeof window !== 'undefined') {
        window.location.reload();
      }

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    let accessToken = getAccessToken();

    // Генерируем ключ для предотвращения дублирования POST запросов
    const requestKey = this.generateRequestKey(endpoint, options);

    // Для POST запросов проверяем, не выполняется ли уже такой же запрос
    if (options.method === 'POST' && this.requestCache.has(requestKey)) {
      console.log('Duplicate POST request detected, returning cached promise');
      return this.requestCache.get(requestKey);
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Добавляем токен авторизации если он есть
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Создаем промис для выполнения запроса
    const requestPromise = this.executeRequest(url, config);

    // Кешируем POST запросы для предотвращения дублирования
    if (options.method === 'POST') {
      this.requestCache.set(requestKey, requestPromise);

      // Удаляем из кеша через 5 секунд
      setTimeout(() => {
        this.requestCache.delete(requestKey);
      }, 5000);
    }

    return requestPromise;
  }

  async executeRequest(url, config) {
    try {
      console.log(`Making request: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);

      // Если токен истек, пробуем обновить
      if (response.status === 401 || response.status === 403) {
        const accessToken = getAccessToken();
        if (accessToken && !this.isRefreshing) {
          try {
            console.log('Token expired, refreshing...');
            const newAccessToken = await this.refreshAccessToken();

            // Повторяем запрос с новым токеном
            config.headers.Authorization = `Bearer ${newAccessToken}`;
            console.log(`Retrying request with new token: ${config.method || 'GET'} ${url}`);
            const retryResponse = await fetch(url, config);

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json();
              throw new Error(errorData.error || 'Network error after token refresh');
            }

            return await retryResponse.json();
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            throw refreshError;
          }
        } else {
          // Нет токена или уже обновляем - отклоняем запрос
          const errorData = await response.json();
          throw new Error(errorData.error || 'Authentication required');
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network error');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  // Метод для принудительного обновления данных (с timestamp)
  async getFresh(endpoint) {
    const timestamp = Date.now();
    const separator = endpoint.includes('?') ? '&' : '?';
    const freshEndpoint = `${endpoint}${separator}_t=${timestamp}`;
    
    return this.request(freshEndpoint, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Метод для очистки кеша (может быть полезен для отладки)
  clearCache() {
    this.requestCache.clear();
  }
}

export const apiService = new ApiService();