// src/components/charts/ChartStats.jsx - УЛУЧШЕННАЯ ВЕРСИЯ
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

const ChartStats = ({ statistics, cashDeskName }) => {
  if (!statistics) return null;

  // Форматирование чисел
  const formatAmount = (amount) => {
    if (Math.abs(amount) >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('ru-RU');
  };

  const formatPercentage = (percentage) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  // Получение иконки и цвета для тренда
  const getTrendInfo = (trend, changeAmount) => {
    switch (trend) {
      case 'growing':
        return {
          icon: TrendingUp,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          text: 'Рост'
        };
      case 'declining':
        return {
          icon: TrendingDown,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          text: 'Снижение'
        };
      default:
        return {
          icon: Minus,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          text: 'Стабильно'
        };
    }
  };

  const trendInfo = getTrendInfo(statistics.trend, statistics.total_change);
  const TrendIcon = trendInfo.icon;

  const statsData = [
    {
      label: 'Баланс',
      value: `${statistics.last_balance?.toLocaleString('ru-RU')} ₽`,
      subValue: null,
      icon: null,
      highlight: true
    },
    {
      label: 'Изменение',
      value: formatPercentage(statistics.change_percentage),
      subValue: `${statistics.total_change > 0 ? '+' : ''}${statistics.total_change?.toLocaleString('ru-RU')} ₽`,
      icon: TrendIcon,
      iconColor: trendInfo.color,
      highlight: Math.abs(statistics.change_percentage) > 10
    },
    {
      label: 'Операций',
      value: statistics.total_transactions?.toString(),
      subValue: `за ${statistics.period_days} дн.`,
      icon: Activity,
      iconColor: 'text-blue-600'
    },
    {
      label: 'Среднее',
      value: `${formatAmount(statistics.average_balance)} ₽`,
      subValue: 'за период',
      icon: null
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stats-grid">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className={`
            stats-card bg-gray-50 rounded-xl p-4 text-center cursor-default fade-in-up
            ${stat.highlight ? 'ring-2 ring-blue-100 bg-blue-50' : ''}
            hover:shadow-lg transition-all duration-200
          `}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          {/* Иконка */}
          {stat.icon && (
            <div className="flex justify-center mb-2">
              <stat.icon className={`w-5 h-5 ${stat.iconColor || 'text-gray-600'}`} />
            </div>
          )}

          {/* Основное значение */}
          <div className={`
            text-lg font-semibold mb-1
            ${stat.highlight ? 'text-blue-700' : 'text-gray-900'}
          `}>
            {stat.value}
          </div>

          {/* Подзначение */}
          {stat.subValue && (
            <div className="text-xs text-gray-500 font-medium">
              {stat.subValue}
            </div>
          )}

          {/* Лейбл */}
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChartStats;