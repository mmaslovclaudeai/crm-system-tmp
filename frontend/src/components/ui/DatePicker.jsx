import { useState, useEffect, useRef } from 'react';

const DatePicker = ({
  label = "Дата",
  value = '',
  onChange,
  disabled = false,
  error = ''
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());
  const datePickerRef = useRef(null);

  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleCalendar = () => {
    if (disabled) return;
    setIsCalendarOpen(!isCalendarOpen);
    if (!isCalendarOpen && value) {
      setDisplayDate(new Date(value));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const selectDate = (date) => {
    setSelectedDate(date);
    const formattedDate = date.toISOString().split('T')[0];
    onChange?.(formattedDate);
    setIsCalendarOpen(false);
  };

  const previousMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  };

  const createDayElement = (day, isOtherMonth = false) => {
    const dayDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    const isToday = dayDate.toDateString() === new Date().toDateString();
    const isSelected = value && dayDate.toDateString() === new Date(value).toDateString();

    return (
      <div
        key={`${day}-${isOtherMonth}`}
        className={`aspect-square flex items-center justify-center text-sm cursor-pointer rounded-lg transition-all duration-200 ${
          isOtherMonth
            ? 'text-gray-300'
            : isSelected
              ? 'bg-blue-600 text-white font-semibold'
              : isToday
                ? 'bg-blue-500 text-white font-semibold'
                : 'text-gray-700 hover:bg-blue-100'
        }`}
        onClick={() => !isOtherMonth && selectDate(dayDate)}
      >
        {day}
      </div>
    );
  };

  const renderCalendar = () => {
    const firstDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
    const lastDay = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);

    // Получаем день недели первого дня месяца (понедельник = 0)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days = [];

    // Добавляем дни предыдущего месяца
    const prevMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(createDayElement(prevMonth.getDate() - i, true));
    }

    // Добавляем дни текущего месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(createDayElement(day, false));
    }

    // Добавляем дни следующего месяца
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push(createDayElement(day, true));
    }

    return days;
  };

  return (
    <div className="relative" ref={datePickerRef}>
      {/* Подпись на границе */}
      <label
        className="absolute -top-3 left-4 bg-white px-2 text-gray-500 z-20"
        style={{
          fontFamily: '"Noto Sans Devanagari", sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          color: '#6B7280'
        }}
      >
        {label}
      </label>

      {/* Основное поле */}
      <div
        className={`w-full border-2 bg-gray-50 rounded-full px-10 flex items-center justify-between cursor-pointer outline-none transition-colors duration-200 ${
          error 
            ? 'border-red-500' 
            : isCalendarOpen 
              ? 'border-blue-600' 
              : 'border-gray-300 hover:border-gray-400'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          width: '400px',
          height: '56px',
          borderRadius: '12px',
          border: error ? '2px solid #EF4444' : isCalendarOpen ? '2px solid #3B82F6' : '2px solid #E5E7EB',
          background: '#FDFDFD',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
        onClick={handleToggleCalendar}
      >
        <span
          className="text-gray-900"
          style={{
            fontSize: '16px',
            fontWeight: '400',
            fontFamily: '"Noto Sans Devanagari", sans-serif'
          }}
        >
          {value ? formatDate(new Date(value)) : 'Выберите дату'}
        </span>

        {/* Иконка календаря */}
        <svg
          className="w-6 h-6 text-gray-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
        </svg>
      </div>

      {/* Календарь - УМЕНЬШИЛИ РАЗМЕР */}
      {isCalendarOpen && !disabled && (
        <div
          className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-2xl shadow-lg z-30 p-4"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            width: '280px' // 🔧 УМЕНЬШИЛИ С 350px ДО 280px
          }}
        >
          {/* Заголовок календаря */}
          <div className="flex items-center justify-between mb-3">
            <button
              className="text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors text-lg"
              onClick={previousMonth}
              type="button"
            >
              ‹
            </button>
            <div className="text-lg font-semibold text-gray-900">
              {months[displayDate.getMonth()]} {displayDate.getFullYear()}
            </div>
            <button
              className="text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors text-lg"
              onClick={nextMonth}
              type="button"
            >
              ›
            </button>
          </div>

          {/* Сетка календаря */}
          <div className="grid grid-cols-7 gap-1">
            {/* Заголовки дней недели */}
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                {day}
              </div>
            ))}

            {/* Дни месяца */}
            {renderCalendar()}
          </div>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <p
          className="mt-2 text-red-600 px-4"
          style={{
            fontFamily: '"Noto Sans Devanagari", sans-serif',
            fontSize: '14px',
            fontWeight: '400'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default DatePicker;