// src/components/charts/FinanceAnalytics.jsx
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { useFinances } from '../../hooks/useFinances';
import BalanceChart from './BalanceChart';

const FinanceAnalytics = () => {
  const { getAnalytics, loading } = useFinances();
  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [error, setError] = useState(null);

  const periods = [
    { value: 7, label: '7 дней' },
    { value: 14, label: '14 дней' },
    { value: 30, label: '30 дней' },
    { value: 60, label: '60 дней' },
    { value: 90, label: '90 дней' },
    { value: 180, label: '180 дней' },
    { value: 365, label: '365 дней' }
  ];

  const formatAmount = (amount) => {
    return Math.abs(Number(amount)).toLocaleString('ru-RU') + ' ₽';
  };

  const getAmountColor = (amount) => {
    const value = Number(amount);
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const loadAnalytics = async (period) => {
    try {
      setError(null);
      const data = await getAnalytics({ period });
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" />
        <p>Загрузка аналитики...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p className="text-lg font-medium mb-2">Ошибка загрузки аналитики</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-gray-500">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>Нет данных для отображения</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Селектор периода */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Финансовая аналитика</h3>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Период:</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {analytics.start_date} - {analytics.end_date}
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Доходы */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-green-900">Доходы</h4>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900">
            {formatAmount(analytics.metrics.total_income)}
          </div>
          <div className="text-sm text-green-700 mt-2">
            {analytics.metrics.total_operations} операций
          </div>
        </div>

        {/* Расходы */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-red-900">Расходы</h4>
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-900">
            {formatAmount(analytics.metrics.total_expense)}
          </div>
          <div className="text-sm text-red-700 mt-2">
            {analytics.metrics.total_operations} операций
          </div>
        </div>

        {/* Прибыль */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-blue-900">Прибыль</h4>
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <div className={`text-2xl font-bold ${getAmountColor(analytics.metrics.profit)}`}>
            {formatAmount(analytics.metrics.profit)}
          </div>
          <div className="text-sm text-blue-700 mt-2">
            EBITDA
          </div>
        </div>

        {/* Рентабельность */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-purple-900">Рентабельность</h4>
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {analytics.metrics.profit_margin ? `${analytics.metrics.profit_margin}%` : 'N/A'}
          </div>
          <div className="text-sm text-purple-700 mt-2">
            Доход/Расход: {analytics.metrics.income_expense_ratio || 'N/A'}
          </div>
        </div>
      </div>

      {/* Детализация по категориям */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Доходы по категориям */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Доходы по категориям</h4>
          {Object.keys(analytics.categories.income).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.categories.income).map(([category, data]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-green-900">{category}</div>
                    <div className="text-sm text-green-700">{data.operations_count} операций</div>
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {formatAmount(data.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Нет доходов за выбранный период</p>
            </div>
          )}
        </div>

        {/* Расходы по категориям */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Расходы по категориям</h4>
          {Object.keys(analytics.categories.expense).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.categories.expense).map(([category, data]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium text-red-900">{category}</div>
                    <div className="text-sm text-red-700">{data.operations_count} операций</div>
                  </div>
                  <div className="text-lg font-bold text-red-900">
                    {formatAmount(data.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingDown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Нет расходов за выбранный период</p>
            </div>
          )}
        </div>
      </div>

      {/* График общего баланса */}
      <div className="mt-8">
        <BalanceChart selectedPeriod={selectedPeriod} />
      </div>
    </div>
  );
};

export default FinanceAnalytics;
