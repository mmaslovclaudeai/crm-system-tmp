// src/components/client-card/sections/ClientOperations.jsx
import { FileText, Calendar, DollarSign, Tag } from 'lucide-react';
import { formatAmount, formatDate } from '../../../utils/formatters';

const ClientOperations = ({ clientFinances, showLimit = 5 }) => {
  // Сортируем операции по дате (новые сверху)
  const sortedFinances = [...(clientFinances || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Ограничиваем количество показываемых операций
  const displayedFinances = showLimit > 0
    ? sortedFinances.slice(0, showLimit)
    : sortedFinances;

  const hasMoreOperations = showLimit > 0 && sortedFinances.length > showLimit;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          История операций
          {sortedFinances.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {sortedFinances.length}
            </span>
          )}
        </h3>
      </div>

      <div className="p-6">
        {sortedFinances.length > 0 ? (
          <>
            <div className="space-y-4">
              {displayedFinances.map((finance) => (
                <div
                  key={finance.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    {/* Заголовок операции */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-1.5 rounded-full ${
                        finance.type === 'income' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <DollarSign className="w-3 h-3" />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {finance.description || 'Без описания'}
                        </p>

                        <div className="flex items-center space-x-4 mt-1">
                          {/* Дата */}
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(finance.date)}</span>
                          </div>

                          {/* Категория */}
                          {finance.category && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Tag className="w-3 h-3" />
                              <span>{finance.category}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Сумма */}
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${
                      finance.type === 'income' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {finance.type === 'income' ? '+' : '-'}
                      {formatAmount(Math.abs(finance.amount))}
                    </span>

                    {/* Статус операции */}
                    {finance.status && (
                      <p className="text-xs text-gray-500 mt-1">
                        {finance.status === 'completed' ? 'Завершена' :
                         finance.status === 'pending' ? 'В обработке' :
                         finance.status === 'cancelled' ? 'Отменена' :
                         finance.status}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Индикатор дополнительных операций */}
            {hasMoreOperations && (
              <div className="text-center mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  И еще {sortedFinances.length - showLimit} операций...
                </p>
              </div>
            )}
          </>
        ) : (
          /* Пустое состояние */
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Нет финансовых операций</p>
            <p className="text-xs text-gray-400">
              Операции появятся здесь после их добавления
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientOperations;