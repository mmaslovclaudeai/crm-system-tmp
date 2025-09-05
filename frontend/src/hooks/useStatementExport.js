// src/hooks/useStatementExport.js
import { useState, useCallback } from 'react';
import { financesService } from '../services/financesService';
import { getAccessToken } from '../utils/tokenManager';

export const useStatementExport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Валидация дат
  const validateDates = useCallback((dateFrom, dateTo) => {
    if (!dateFrom || !dateTo) {
      throw new Error('Даты "от" и "до" обязательны');
    }

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    if (fromDate > toDate) {
      throw new Error('Дата "от" не может быть больше даты "до"');
    }

    // Проверка на максимальный период (1 год)
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (toDate - fromDate > oneYearInMs) {
      throw new Error('Максимальный период выписки - 1 год');
    }

    // Проверка на будущие даты
    const now = new Date();
    now.setHours(23, 59, 59, 999); // Конец текущего дня

    if (toDate > now) {
      throw new Error('Дата "до" не может быть в будущем');
    }

    return true;
  }, []);

  // Генерация выписки
  const generateStatement = useCallback(async (dateFrom, dateTo) => {
    try {
      setIsLoading(true);
      setError(null);

      // Валидация дат
      validateDates(dateFrom, dateTo);

      // Форматирование дат для API
      const formattedDateFrom = financesService.formatDateForAPI(dateFrom);
      const formattedDateTo = financesService.formatDateForAPI(dateTo);

      // Запрос к API
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error('Необходима авторизация для генерации выписки');
      }

      const response = await fetch(`/api/finances/statement?date_from=${formattedDateFrom}&date_to=${formattedDateTo}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'text/csv'
        }
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        // Пытаемся получить детали ошибки из ответа
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Если не удалось распарсить JSON, используем стандартное сообщение
        }

        throw new Error(errorMessage);
      }

      // Получаем имя файла из заголовков
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'statement.csv';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Получаем содержимое файла
      const csvContent = await response.text();

      // Создаем Blob и инициируем скачивание
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Освобождаем память
      URL.revokeObjectURL(url);

      console.log('📋 Выписка успешно скачана:', filename);

      return {
        success: true,
        filename,
        dateFrom: formattedDateFrom,
        dateTo: formattedDateTo
      };

    } catch (err) {
      console.error('❌ Ошибка при генерации выписки:', err);
      const errorMessage = err.message || 'Неизвестная ошибка при генерации выписки';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [validateDates]);

  // Сброс ошибки
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    generateStatement,
    clearError,
    validateDates
  };
};