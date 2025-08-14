// src/components/modals/CashDeskTransactionsModal.jsx - ВЕРСИЯ С ГРАФИКОМ
import { useState, useEffect } from 'react';
import { X, Wallet, TrendingUp, TrendingDown, Calendar, User, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import { PAYMENT_STATUS } from '../../constants';
import { useCashDesks } from '../../hooks/useCashDesks';
import CashDeskChart from '../charts/CashDeskChart';

const formatAmount = (amount) => {
  const formatted = Math.abs(Number(amount)).toLocaleString('ru-RU');
  return Number(amount) >= 0 ? `+${formatted} ₽` : `-${formatted} ₽`;
};

const getAmountColor = (amount) => {
  return Number(amount) >= 0 ? 'text-green-600' : 'text-red-600';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU');
};

const getStatusBadge = (status, date) => {
  const isOverdue = status === PAYMENT_STATUS.PLANNED && new Date(date) < new Date();

  if (status === PAYMENT_STATUS.ACTUAL) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Факт
      </span>
    );
  } else {
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
        isOverdue 
          ? 'bg-red-100 text-red-800' 
          : 'bg-orange-100 text-orange-800'
      }`}>
        <Clock className="w-3 h-3 mr-1" />
        {isOverdue ? 'Просрочен' : 'План'}
      </span>
    );
  }
};

const CashDeskTransactionsModal = ({ isOpen, onClose, cashDesk }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions'); // transactions | chart
  const [filter, setFilter] = useState('all'); // all, actual, planned
  const [stats, setStats] = useState({
    total: 0,
    actual: 0,
    planned: 0,
    totalIncome: 0,
    totalExpense: 0
  });

  // 🔧 ИСПРАВЛЕНИЕ: Используем хук вместо прямого API вызова
  const { fetchCashDeskTransactions } = useCashDesks();

  useEffect(() => {
    if (isOpen && cashDesk) {
      loadTransactions();
    }
  }, [isOpen, cashDesk]);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      // 🔧 ИСПРАВЛЕНИЕ: Используем хук вместо прямого apiService
      const response = await fetchCashDeskTransactions(cashDesk.id, { limit: 100 });
      setTransactions(response || []);

      // Вычисляем статистику
      calculateStats(response || []);
    } catch (error) {
      console.error('Ошибка загрузки операций кассы:', error);
      // Можно добавить toast уведомление об ошибке
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactionsList) => {
    const total = transactionsList.length;
    const actual = transactionsList.filter(t => t.status === PAYMENT_STATUS.ACTUAL).length;
    const planned = transactionsList.filter(t => t.status === PAYMENT_STATUS.PLANNED).length;

    const totalIncome = transactionsList
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactionsList
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    setStats({
      total,
      actual,
      planned,
      totalIncome,
      totalExpense
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] md:max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-4 md:p-6 border-b border-gray-200 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
              {cashDesk?.name || 'Касса'}
            </h2>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 live-dot"></div>
                Обновлено сейчас
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end space-x-4">
            <div className="text-left sm:text-right">
              <div className="text-xl md:text-2xl font-semibold text-green-600">
                {cashDesk?.current_balance?.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-xs md:text-sm text-gray-500">Текущий баланс</div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Apple-style Tabs */}
        <div className="px-4 md:px-6 pt-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 flex items-center justify-center py-2 px-2 md:px-4 rounded-md text-xs md:text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Wallet className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden xs:inline">Операции</span>
              <span className="xs:hidden">Операц.</span>
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex-1 flex items-center justify-center py-2 px-2 md:px-4 rounded-md text-xs md:text-sm font-medium transition-all ${
                activeTab === 'chart'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              График
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'transactions' ? (
            // Существующий контент с операциями
            <>
              {/* Stats Summary */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Всего операций</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.actual}</div>
                    <div className="text-sm text-gray-500">Факт</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.planned}</div>
                    <div className="text-sm text-gray-500">План</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatAmount(stats.totalIncome)}
                    </div>
                    <div className="text-sm text-gray-500">Доходы</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      -{Math.abs(stats.totalExpense).toLocaleString('ru-RU')} ₽
                    </div>
                    <div className="text-sm text-gray-500">Расходы</div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Все ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('actual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'actual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Факт ({stats.actual})
                  </button>
                  <button
                    onClick={() => setFilter('planned')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'planned'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    План ({stats.planned})
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
                {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Загрузка операций...</p>
                    </div>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Операции не найдены</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {filter === 'all'
                          ? 'По этой кассе пока нет операций'
                          : `Нет операций со статусом "${filter === 'actual' ? 'Факт' : 'План'}"`
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              Number(transaction.amount) >= 0 ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {Number(transaction.amount) >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                              ) : (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {transaction.description}
                                </h4>
                                {getStatusBadge(transaction.status, transaction.date)}
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center text-xs text-gray-500">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(transaction.date)}
                                </div>
                                {transaction.category && (
                                  <span className="text-xs text-gray-500">
                                    {transaction.category}
                                  </span>
                                )}
                                {transaction.client_name && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <User className="w-3 h-3 mr-1" />
                                    {transaction.client_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${getAmountColor(transaction.amount)}`}>
                              {formatAmount(transaction.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            // Новый контент с графиком
            <div className="p-3 md:p-6 h-full overflow-y-auto">
              <CashDeskChart
                cashDeskId={cashDesk?.id}
                cashDeskName={cashDesk?.name}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs md:text-sm text-gray-500 text-center sm:text-left order-2 sm:order-1">
              {activeTab === 'transactions'
                ? `Показано ${filteredTransactions.length} из ${stats.total} операций`
                : `График баланса кассы "${cashDesk?.name}"`
              }
            </p>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium order-1 sm:order-2"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashDeskTransactionsModal;