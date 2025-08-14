// src/hooks/useAuth.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С getAuthHeader
import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import {
  saveTokens,
  saveUser,
  getAccessToken,
  getRefreshToken,
  getUser,
  clearTokens,
  isTokenExpired
} from '../utils/tokenManager';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔧 ДОБАВЛЯЕМ ФУНКЦИЮ getAuthHeader (синхронная версия)
  const getAuthHeader = () => {
    const accessToken = getAccessToken();
    
    if (!accessToken) {
      console.warn('No access token available');
      return {};
    }

    console.log('Using existing token for auth header');
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Проверка авторизации при загрузке
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();
        const storedUser = getUser();

        if (!accessToken || !refreshToken || !storedUser) {
          setLoading(false);
          return;
        }

        // Проверяем, не истек ли токен
        if (isTokenExpired(accessToken)) {
          // Пробуем обновить токен
          try {
            const refreshResponse = await authService.refreshToken(refreshToken);
            saveTokens(refreshResponse.accessToken, refreshToken);

            // Получаем актуальную информацию о пользователе
            const profileResponse = await authService.getProfile(refreshResponse.accessToken);
            setUser(profileResponse.user);
            saveUser(profileResponse.user);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Token refresh failed:', error);
            clearTokens();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Токен действителен, используем сохраненного пользователя
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Вход в систему
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      const { user: userData, accessToken, refreshToken } = response;

      saveTokens(accessToken, refreshToken);
      saveUser(userData);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Регистрация
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authService.register(userData);
      const { user: newUser, accessToken, refreshToken } = response;

      saveTokens(accessToken, refreshToken);
      saveUser(newUser);
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Выход из системы
  const logout = async () => {
    try {
      const accessToken = getAccessToken();
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Проверка роли пользователя
  const hasRole = (requiredRoles) => {
    if (!user) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  // Проверка прав на удаление (только админы и менеджеры)
  const canDelete = () => {
    return hasRole(['admin', 'manager']);
  };

  // Проверка админских прав
  const isAdmin = () => {
    return hasRole('admin');
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    hasRole,
    canDelete,
    isAdmin,
    getAuthHeader  // 🔧 ДОБАВЛЯЕМ В ЭКСПОРТ
  };
};