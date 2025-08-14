import { useState } from 'react';

const IncomeExpenseSlider = ({
  value = 'income', // 'income' или 'expense'
  onChange,
  disabled = false
}) => {
  const handleToggle = () => {
    if (disabled) return;
    const newValue = value === 'income' ? 'expense' : 'income';
    onChange?.(newValue);
  };

  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: '400px' }}>
        <div
          className={`relative w-full border-4 border-gray-200 bg-gray-100 cursor-pointer overflow-hidden transition-all duration-300 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
          }`}
          style={{
            width: '400px',
            height: '60px',
            borderRadius: '16px',
            border: '2px solid #E5E7EB',
            background: '#F3F4F6'
          }}
          onClick={handleToggle}
        >
          {/* Подвижный слайдер */}
          <div
            className={`absolute top-1 transition-all duration-300 shadow-xl flex items-center justify-center ${
              value === 'income' 
                ? 'left-1 bg-green-500' 
                : 'bg-red-600'
            }`}
            style={{
              width: '190px',
              height: '48px',
              borderRadius: '10px',
              left: value === 'income' ? '5px' : '200px',
              background: value === 'income' ? '#16A34A' : '#DC2626',
              boxShadow: '2px 2px 8px 0px rgba(0, 0, 0, 0.25)'
            }}
          />

          {/* Текстовые лейблы */}
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="flex-1 flex items-center justify-center">
              <span
                className={`text-4xl font-semibold transition-colors duration-300 ${
                  value === 'income' ? 'text-white' : 'text-gray-400'
                }`}
                style={{
                  fontFamily: '"Noto Sans Devanagari", sans-serif',
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '100%'
                }}
              >
                Доход
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span
                className={`text-4xl font-semibold transition-colors duration-300 ${
                  value === 'expense' ? 'text-white' : 'text-gray-400'
                }`}
                style={{
                  fontFamily: '"Noto Sans Devanagari", sans-serif',
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '100%'
                }}
              >
                Расход
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseSlider;