// src/components/modals/StatementExportModal.jsx
import React, { useState, useEffect } from 'react';
import { Download, X, AlertCircle, Calendar } from 'lucide-react';
import { useStatementExport } from '../../hooks/useStatementExport';

// Примечание: Для календаря с выбором диапазона рекомендую использовать react-date-range
// Но поскольку его нет в проекте, создам простой интерфейс с двумя input[type="date"]
// При необходимости можно заменить на полноценный календарь

const StatementExportModal = ({ isOpen, onClose, onError }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [localErrors, setLocalErrors] = useState({});

  const { isLoading, error, generateStatement, clearError, validateDates } = useStatementExport();

  // Сброс состояния при открытии/закрытии модального окна
  useEffect(() => {
    if (isOpen) {
      setDateFrom('');
      setDateTo('');
      setLocalErrors({});
      clearError();
    }
  }, [isOpen, clearError]);

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};

    if (!dateFrom) {
      newErrors.dateFrom = 'Дата "от" обязательна';
    }

    if (!dateTo) {
      newErrors.dateTo = 'Дата "до" обязательна';
    }

    if (dateFrom && dateTo) {
      try {
        validateDates(dateFrom, dateTo);
      } catch (err) {
        newErrors.dateRange = err.message;
      }
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчик изменения даты "от"
  const handleDateFromChange = (e) => {
    const newDateFrom = e.target.value;
    setDateFrom(newDateFrom);

    // Автоматически устанавливаем дату "до" если она не задана или меньше даты "от"
    if (newDateFrom && (!dateTo || new Date(newDateFrom) > new Date(dateTo))) {
      setDateTo(newDateFrom);
    }

    // Очищаем ошибки при изменении
    if (localErrors.dateFrom || localErrors.dateRange) {
      setLocalErrors(prev => ({
        ...prev,
        dateFrom: undefined,
        dateRange: undefined
      }));
    }
  };

  // Обработчик изменения даты "до"
  const handleDateToChange = (e) => {
    const newDateTo = e.target.value;
    setDateTo(newDateTo);

    // Очищаем ошибки при изменении
    if (localErrors.dateTo || localErrors.dateRange) {
      setLocalErrors(prev => ({
        ...prev,
        dateTo: undefined,
        dateRange: undefined
      }));
    }
  };

  // Генерация выписки
  const handleGenerate = async () => {
    if (!validateForm()) return;

    try {
      await generateStatement(dateFrom, dateTo);
      handleClose();
    } catch (err) {
      // Ошибка уже обработана в хуке, передаем в родительский компонент
      onError?.(err.message || 'Ошибка при генерации выписки');
    }
  };

  // Закрытие модального окна
  const handleClose = () => {
    if (!isLoading) {
      setDateFrom('');
      setDateTo('');
      setLocalErrors({});
      clearError();
      onClose?.();
    }
  };

  // Форматирование предварительного имени файла
  const getPreviewFilename = () => {
    if (!dateFrom || !dateTo) return '';

    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    const fromFormatted = `${fromDate.getDate().toString().padStart(2, '0')}.${(fromDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const toFormatted = `${toDate.getDate().toString().padStart(2, '0')}.${(toDate.getMonth() + 1).toString().padStart(2, '0')}`;

    return `statement_${fromFormatted}_${toFormatted}.csv`;
  };

  if (!isOpen) return null;

  const hasErrors = Object.keys(localErrors).length > 0 || error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Генерация выписки
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Контент */}
        <div className="p-6 space-y-4">
          {/* Период выбора */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Выберите период для выписки
            </h3>

            {/* Дата от */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата от *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    localErrors.dateFrom ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {localErrors.dateFrom && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {localErrors.dateFrom}
                </p>
              )}
            </div>

            {/* Дата до */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата до *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={handleDateToChange}
                  disabled={isLoading}
                  min={dateFrom} // Не позволяем выбрать дату до "даты от"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    localErrors.dateTo ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {localErrors.dateTo && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {localErrors.dateTo}
                </p>
              )}
            </div>

            {/* Ошибка диапазона дат */}
            {localErrors.dateRange && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {localErrors.dateRange}
                </p>
              </div>
            )}

            {/* Общая ошибка */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Информация о выписке */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Что будет включено в выписку:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Только фактические операции (actual)</li>
              <li>• Доходы и расходы за выбранный период</li>
              <li>• Переводы между кассами</li>
              <li>• Расчетный баланс касс</li>
            </ul>

            {getPreviewFilename() && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  <strong>Имя файла:</strong> {getPreviewFilename()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || hasErrors || !dateFrom || !dateTo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Генерация...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Скачать выписку</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatementExportModal;