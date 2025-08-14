import { useState, useEffect, useRef } from 'react';

const DropdownField = ({
  label,
  placeholder = "Выберите опцию",
  value = '',
  onChange,
  options = [],
  disabled = false,
  error = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (option) => {
    onChange?.(option.value);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
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
            : isOpen 
              ? 'border-blue-600' 
              : 'border-gray-300 hover:border-gray-400'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          width: '400px',
          height: '56px',
          borderRadius: '12px',
          border: error ? '2px solid #EF4444' : isOpen ? '2px solid #3B82F6' : '2px solid #E5E7EB',
          background: '#FDFDFD',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
        onClick={handleToggle}
      >
        <span
          className={selectedOption ? 'text-gray-900' : 'text-gray-400'}
          style={{
            fontSize: '16px',
            fontWeight: '400',
            fontFamily: '"Noto Sans Devanagari", sans-serif'
          }}
        >
          {displayText}
        </span>

        {/* Иконка меню - НОВАЯ ИКОНКА СТРЕЛКИ */}
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Выпадающее меню - УМЕНЬШИЛИ РАЗМЕРЫ */}
      {isOpen && !disabled && (
        <div
          className="absolute top-full left-0 mt-2 w-full bg-white border-2 border-gray-300 rounded-2xl shadow-lg z-30 max-h-60 overflow-y-auto"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          {options.length === 0 ? (
            <div
              className="px-4 py-8 text-gray-500 text-center"
              style={{
                fontSize: '16px', // 🔧 УМЕНЬШИЛИ С 36px ДО 16px
                fontWeight: '400',
                fontFamily: '"Noto Sans Devanagari", sans-serif'
              }}
            >
              Нет доступных опций
            </div>
          ) : (
            options.map((option, index) => (
              <div
                key={option.value || index}
                className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                onClick={() => handleSelect(option)}
                style={{
                  fontSize: '16px', // 🔧 УМЕНЬШИЛИ С 36px ДО 16px
                  fontWeight: '400',
                  fontFamily: '"Noto Sans Devanagari", sans-serif'
                }}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <p
          className="mt-2 text-red-600 px-4"
          style={{
            fontFamily: '"Noto Sans Devanagari", sans-serif',
            fontSize: '14px', // 🔧 УМЕНЬШИЛИ С 20px ДО 14px
            fontWeight: '400'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default DropdownField;