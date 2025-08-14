// src/components/charts/ChartPeriodSelector.jsx
import { useState } from 'react';

const ChartPeriodSelector = ({ selectedPeriod, onPeriodChange, loading = false }) => {
  const periods = [
    { value: '7', label: '7 дней' },
    { value: '30', label: '30 дней' },
    { value: '90', label: '90 дней' }
  ];

  const handlePeriodClick = (periodValue) => {
    if (loading || periodValue === selectedPeriod) return;
    onPeriodChange(periodValue);
  };

  return (
    <div className="flex justify-center">
      <div className="flex bg-gray-100 rounded-full p-1 space-x-1">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => handlePeriodClick(period.value)}
            disabled={loading}
            className={`
              px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 
              ${selectedPeriod === period.value
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChartPeriodSelector;