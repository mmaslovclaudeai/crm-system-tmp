// src/components/SingleDateRangeFilter.jsx - ИСПРАВЛЕННАЯ РАБОЧАЯ ВЕРСИЯ
import { useState, useEffect, useRef } from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

const SingleDateRangeFilter = ({ onApplyFilter, loading = false, initialDateFrom = null, initialDateTo = null }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true); // true = выбираем начальную дату, false = конечную

  const calendarRef = useRef(null);
  const buttonRef = useRef(null);

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
      setDateFrom(formatDateForInput(initialDateFrom));
      setDateTo(formatDateForInput(initialDateTo));
    } else {
      const { firstDay, lastDay } = getCurrentMonthRange();
      setDateFrom(firstDay);
      setDateTo(lastDay);

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
      if (date.includes('.')) {
        const [day, month, year] = date.split('.');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      if (date.includes('-')) {
        return date;
      }
      return date;
    }

    if (date instanceof Date) {
      // ИСПРАВЛЕНО: используем локальные методы вместо UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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

  // Закрытие календаря при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowCalendar(false);
        setSelectingStart(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обработка выбора даты в календаре
  const handleDateSelect = (selectedDate) => {
    console.log('📅 Выбрана дата:', selectedDate, 'Выбираем начало:', selectingStart);

    if (selectingStart) {
      // Выбираем начальную дату
      setDateFrom(selectedDate);
      setDateTo(''); // Сбрасываем конечную дату
      setSelectingStart(false); // Переходим к выбору конечной даты
    } else {
      // Выбираем конечную дату
      const startDate = new Date(dateFrom);
      const endDate = new Date(selectedDate);

      if (endDate >= startDate) {
        setDateTo(selectedDate);
      } else {
        // Если конечная дата раньше начальной, меняем их местами
        setDateFrom(selectedDate);
        setDateTo(dateFrom);
      }

      setShowCalendar(false); // Закрываем календарь
      setSelectingStart(true); // Сбрасываем состояние для следующего использования
    }
  };

  // Открытие/закрытие календаря
  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
    setSelectingStart(true); // Всегда начинаем с выбора начальной даты
  };

  // Навигация по месяцам
  const navigateMonth = (direction, event) => {
    event.stopPropagation(); // Предотвращаем закрытие календаря
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Применение фильтра
  const handleApplyFilter = () => {
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
    setCurrentMonth(new Date());

    onApplyFilter({
      date_from: firstDay,
      date_to: lastDay
    });
  };

  // Генерация календаря
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Понедельник = 0

    const days = [];
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    // Предыдущий месяц - ИСПРАВЛЕНО
    const prevMonth = new Date(year, month - 1, 0); // Последний день предыдущего месяца
    for (let i = firstDayWeekday; i > 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonth.getDate() - i + 1);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        day: prevDate.getDate()
      });
    }

    // Текущий месяц
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        day
      });
    }

    // Следующий месяц - ИСПРАВЛЕНО (до 42 дней)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        day: nextDate.getDate()
      });
    }

    return (
      <div className="p-4 w-80">
        {/* Заголовок календаря */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={(e) => navigateMonth(-1, e)}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none"
            tabIndex={-1}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-sm font-medium">
            {monthNames[month]} {year}
          </h3>

          <button
            type="button"
            onClick={(e) => navigateMonth(1, e)}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none"
            tabIndex={-1}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="text-xs text-gray-500 text-center p-2 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayObj, index) => {
            const dateStr = formatDateForInput(dayObj.date);
            const isFromDate = dateStr === dateFrom;
            const isToDate = dateStr === dateTo;
            const isInRange = dateFrom && dateTo &&
              dateStr >= dateFrom && dateStr <= dateTo;
            const isToday = dateStr === formatDateForInput(new Date());

            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // ИСПРАВЛЕНО: теперь можно кликать на любой день
                  handleDateSelect(dateStr);
                }}
                className={`p-2 text-xs rounded hover:bg-blue-50 transition-colors focus:outline-none ${
                  !dayObj.isCurrentMonth 
                    ? 'text-gray-400 hover:bg-gray-50' // Сделали дни других месяцев доступными для клика
                    : isFromDate || isToDate
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : isInRange
                    ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    : isToday
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                tabIndex={-1}
              >
                {dayObj.day}
              </button>
            );
          })}
        </div>

        {/* Инструкция */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          {selectingStart
            ? 'Выберите дату начала периода'
            : 'Выберите дату окончания периода'
          }
        </div>

        {/* Выбранный период */}
        {dateFrom && dateTo && (
          <div className="mt-2 text-xs text-center p-2 bg-blue-50 rounded">
            <strong>Выбран период:</strong><br/>
            {formatDateForDisplay(dateFrom)} - {formatDateForDisplay(dateTo)}
          </div>
        )}
      </div>
    );
  };

  // Форматирование выбранного диапазона для отображения
  const getDisplayText = () => {
    if (!dateFrom && !dateTo) {
      return 'Выберите период';
    }

    if (dateFrom && !dateTo) {
      return `От ${formatDateForDisplay(dateFrom)}`;
    }

    if (dateFrom && dateTo) {
      if (dateFrom === dateTo) {
        return formatDateForDisplay(dateFrom);
      }
      return `${formatDateForDisplay(dateFrom)} - ${formatDateForDisplay(dateTo)}`;
    }

    return 'Выберите период';
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Кнопка выбора периода */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Период:
        </label>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleCalendarToggle}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
        >
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">
            {getDisplayText()}
          </span>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCalendar && (
          <div
            ref={calendarRef}
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {generateCalendar()}
          </div>
        )}
      </div>

      {/* Кнопка применить */}
      <button
        type="button"
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
        type="button"
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

export default SingleDateRangeFilter;