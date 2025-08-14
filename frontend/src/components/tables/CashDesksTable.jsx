// src/components/tables/CashDesksTable.jsx
import { Plus, Wallet, Edit2, Trash2, Loader2, DollarSign, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { USER_ROLES } from '../../constants';

const formatAmount = (amount) => {
  const formatted = Math.abs(Number(amount)).toLocaleString('ru-RU');
  return `${formatted} ₽`;
};

const getBalanceColor = (balance) => {
  const amount = Number(balance);
  if (amount > 0) return 'text-green-600';
  if (amount < 0) return 'text-red-600';
  return 'text-gray-600';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Не указана';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Неверная дата';
  }
};

const CashDesksTable = ({
  cashDesks,
  loading,
  showResults,
  onAddCashDesk,
  onEditCashDesk,
  onDeleteCashDesk,
  onViewTransactions
}) => {
  const { user } = useAuthContext();

  const canCreateEdit = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.MANAGER;
  const canDelete = user?.role === USER_ROLES.ADMIN;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Загрузка касс...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Заголовок таблицы */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <Wallet className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            Управление кассами
            {showResults && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({cashDesks.length} {cashDesks.length === 1 ? 'касса' : cashDesks.length < 5 ? 'кассы' : 'касс'})
              </span>
            )}
          </h2>
        </div>

        {canCreateEdit && (
          <button
            onClick={onAddCashDesk}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить кассу</span>
          </button>
        )}
      </div>

      {/* Таблица */}
      {showResults && cashDesks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Текущий баланс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Расчетный баланс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Операции
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Создана
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cashDesks.filter(cashDesk => cashDesk).map((cashDesk) => (
                <tr key={cashDesk.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {cashDesk?.name || 'Без названия'}
                      </div>
                      {cashDesk?.description && (
                        <div className="text-sm text-gray-500">
                          {cashDesk.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${getBalanceColor(cashDesk?.current_balance || 0)}`}>
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      {formatAmount(cashDesk?.current_balance || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getBalanceColor(cashDesk?.calculated_balance || 0)}`}>
                      {formatAmount(cashDesk?.calculated_balance || 0)}
                    </div>
                    {Math.abs(Number(cashDesk?.current_balance || 0) - Number(cashDesk?.calculated_balance || 0)) > 0.01 && (
                      <div className="text-xs text-orange-600">
                        Расхождение: {formatAmount(Number(cashDesk?.calculated_balance || 0) - Number(cashDesk?.current_balance || 0))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>{formatAmount(cashDesk?.actual_income || 0)}</span>
                      </div>
                      <div className="flex items-center text-red-600">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        <span>{formatAmount(Math.abs(cashDesk?.actual_expense || 0))}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Всего операций: {cashDesk?.transactions_count || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cashDesk?.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {cashDesk?.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(cashDesk?.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onViewTransactions(cashDesk)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Просмотр операций"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {canCreateEdit && (
                        <button
                          onClick={() => onEditCashDesk(cashDesk)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => onDeleteCashDesk(cashDesk.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : showResults ? (
        <div className="px-6 py-12 text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Кассы не найдены</h3>
          <p className="text-gray-500 mb-4">
            Попробуйте изменить параметры поиска или создайте новую кассу.
          </p>
          {canCreateEdit && (
            <button
              onClick={onAddCashDesk}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Создать кассу</span>
            </button>
          )}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Управление кассами</h3>
          <p className="text-gray-500 mb-4">
            Начните поиск касс или создайте новую кассу для управления финансами.
          </p>
          {canCreateEdit && (
            <button
              onClick={onAddCashDesk}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Создать кассу</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CashDesksTable;