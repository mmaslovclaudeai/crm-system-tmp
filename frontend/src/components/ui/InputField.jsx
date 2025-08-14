import { useState } from 'react';

const InputField = ({
  label,
  placeholder,
  value = '',
  onChange,
  disabled = false,
  error = '',
  type = 'text'
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="relative">
      {/* Подпись на границе */}
      <label
        className="absolute -top-3 left-4 bg-white px-2 text-gray-500 z-10"
        style={{
          fontFamily: '"Noto Sans Devanagari", sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          color: '#6B7280'
        }}
      >
        {label}
      </label>

      {/* Поле ввода */}
      <input
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full border-2 bg-gray-50 rounded-xl px-4 outline-none transition-colors duration-200 ${
          error 
            ? 'border-red-500 focus:border-red-600' 
            : isFocused
              ? 'border-blue-600'
              : 'border-gray-300 hover:border-gray-400'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          width: '400px',
          height: '56px',
          borderRadius: '12px',
          border: error
            ? '2px solid #EF4444'
            : isFocused
              ? '2px solid #3B82F6'
              : '2px solid #E5E7EB',
          background: '#FDFDFD',
          fontSize: '16px',
          fontWeight: '400',
          fontFamily: '"Noto Sans Devanagari", sans-serif',
          color: '#1F2937',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      />

      {/* Стили для placeholder */}
      <style>{`
        input::placeholder {
          color: #A4AEC1;
          font-family: "Noto Sans Devanagari", sans-serif;
          font-size: 16px;
          font-weight: 400;
          line-height: normal;
        }
      `}</style>

      {/* Сообщение об ошибке */}
      {error && (
        <p
          className="mt-2 text-red-600 px-4"
          style={{
            fontFamily: '"Noto Sans Devanagari", sans-serif',
            fontSize: '20px',
            fontWeight: '400'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;