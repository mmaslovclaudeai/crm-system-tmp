// src/components/client-card/sections/ClientStats.jsx
import { TrendingUp, DollarSign, FileText, Calendar } from 'lucide-react';
import { formatAmount, formatDate } from '../../../utils/formatters';

const ClientStats = ({ clientStats }) => {
  const stats = [
    {
      icon: FileText,
      label: 'Всего операций',
      value: clientStats.totalOperations || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: DollarSign,
      label: 'Общая сумма',
      value: formatAmount(clientStats.totalAmount || 0),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: TrendingUp,
      label: 'Средний чек',
      value: formatAmount(clientStats.averageCheck || 0),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Calendar,
      label: 'Последняя операция',
      value: clientStats.lastOperation
        ? formatDate(clientStats.lastOperation.date)
        : 'Нет операций',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Статистика клиента
        </h3>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;

            return (
              <div
                key={index}
                className="flex items-center space-x-4"
              >
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Дополнительная информация о последней операции */}
        {clientStats.lastOperation && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Детали последней операции
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Тип</p>
                  <p className="font-medium text-gray-900">
                    {clientStats.lastOperation.type === 'income' ? 'Доход' : 'Расход'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Сумма</p>
                  <p className={`font-medium ${
                    clientStats.lastOperation.type === 'income' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatAmount(clientStats.lastOperation.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Категория</p>
                  <p className="font-medium text-gray-900">
                    {clientStats.lastOperation.category || 'Не указана'}
                  </p>
                </div>
              </div>

              {clientStats.lastOperation.description && (
                <div className="mt-3">
                  <p className="text-gray-500">Описание</p>
                  <p className="text-gray-900 text-sm">
                    {clientStats.lastOperation.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Если нет операций */}
        {clientStats.totalOperations === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Пока нет операций с этим клиентом</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientStats;