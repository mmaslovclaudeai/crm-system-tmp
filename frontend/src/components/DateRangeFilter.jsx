// src/components/DateRangeFilter.jsx - ОБНОВЛЕННАЯ ВЕРСИЯ
import { useState, useEffect, useRef } from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

const DateRangeFilter = ({ onApplyFilter, loading = false, initialDateFrom = null, initialDateTo = null }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const fromCalendarRef = useRef(null);
  const toCalendarRef = useRef(null);
  const fromButtonRef = useRef(null);
  const toButtonRef = useRef(null);

  // Получение первого и последнего дня текущего месяца
  const getCurrentMonthRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      firstDay: formatDateForInput(firstDay),
      lastDay: formatDateForInput(lastDay)
    };
  };

  // Инициализация дат
  useEffect(() => {
    if (isInitialized) return;

    if (initialDateFrom && initialDateTo) {
      // Используем переданные даты
      setDateFrom(formatDateForInput(initialDateFrom));
      setDateTo(formatDateForInput(initialDateTo));
    } else {
      // Устанавливаем даты текущего месяца по умолчанию
      const { firstDay, lastDay } = getCurrentMonthRange();
      setDateFrom(firstDay);
      setDateTo(lastDay);

      // Автоматически применяем фильтр при первой загрузке
      setTimeout(() => {
        onApplyFilter({
          date_from: firstDay,
          date_to: lastDay
        });
      }, 100);
    }

    setIsInitialized(true);
  }, [initialDateFrom, initialDateTo, isInitialized, onApplyFilter]);

  // Форматирование даты для input[type="date"] (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';

    if (typeof date === 'string') {
      // Если дата в формате DD.MM.YYYY
      if (date.includes('.')) {
        const [day, month, year] = date.split('.');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Если дата уже в формате YYYY-MM-DD
      if (date.includes('-')) {
        return date;
      }
      return date;
    }

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    return '';
  };

  // Форматирование даты для отображения (DD.MM.YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  // Закрытие календарей при клике вне их
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromCalendarRef.current && !fromCalendarRef.current.contains(event.target) &&
          fromButtonRef.current && !fromButtonRef.current.contains(event.target)) {
        setShowFromCalendar(false);
      }

      if (toCalendarRef.current && !toCalendarRef.current.contains(event.target) &&
          toButtonRef.current && !toButtonRef.current.contains(event.target)) {
        setShowToCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обработка изменения даты "от"
  const handleFromDateChange = (value) => {
    setDateFrom(value);
    setShowFromCalendar(false);
  };

  // Обработка изменения даты "до"
  const handleToDateChange = (value) => {
    setDateTo(value);
    setShowToCalendar(false);
  };

  // Применение фильтра
  const handleApplyFilter = () => {
    // Валидация дат
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);

      if (fromDate > toDate) {
        alert('Дата "от" не может быть больше даты "до"');
        return;
      }
    }

    console.log('📅 Применяем фильтр по датам:', { dateFrom, dateTo });

    onApplyFilter({
      date_from: dateFrom,
      date_to: dateTo
    });
  };

  // Сброс к текущему месяцу
  const handleResetFilter = () => {
    const { firstDay, lastDay } = getCurrentMonthRange();

    setDateFrom(firstDay);
    setDateTo(lastDay);

    onApplyFilter({
      date_from: firstDay,
      date_to: lastDay
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Поле "от:" */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          от:
        </label>
        <button
          ref={fromButtonRef}
          onClick={() => {
            setShowFromCalendar(!showFromCalendar);
            setShowToCalendar(false);
          }}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">
            {formatDateForDisplay(dateFrom) || 'Выберите дату'}
          </span>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showFromCalendar && (
          <div
            ref={fromCalendarRef}
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3"
          >
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Поле "до:" */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          до:
        </label>
        <button
          ref={toButtonRef}
          onClick={() => {
            setShowToCalendar(!showToCalendar);
            setShowFromCalendar(false);
          }}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">
            {formatDateForDisplay(dateTo) || 'Выберите дату'}
          </span>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showToCalendar && (
          <div
            ref={toCalendarRef}
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3"
          >
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleToDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Кнопка применить */}
      <button
        onClick={handleApplyFilter}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Загрузка...
          </>
        ) : (
          <>
            <Filter className="w-4 h-4" />
            Применить
          </>
        )}
      </button>

      {/* Кнопка сброса */}
      <button
        onClick={handleResetFilter}
        disabled={loading}
        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-4 h-4" />
        Сбросить
      </button>
    </div>
  );
};

export default DateRangeFilter;