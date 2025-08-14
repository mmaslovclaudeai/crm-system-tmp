// src/utils/tokenManager.js
import { AUTH_STORAGE_KEYS } from '../constants';

// Сохранение токенов в localStorage
export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
};

// Получение access токена
export const getAccessToken = () => {
  return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
};

// Получение refresh токена
export const getRefreshToken = () => {
  return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
};

// Удаление всех токенов
export const clearTokens = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
};

// Сохранение информации о пользователе
export const saveUser = (user) => {
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
};

// Получение информации о пользователе
export const getUser = () => {
  const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
  return userStr ? JSON.parse(userStr) : null;
};

// Проверка истечения токена
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Получение времени истечения токена
export const getTokenExpiry = (token) => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Возвращаем в миллисекундах
  } catch (error) {
    return null;
  }
};