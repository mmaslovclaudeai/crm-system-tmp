// src/components/tables/FinancesTable.jsx - ОБНОВЛЕННАЯ ВЕРСИЯ С ПАГИНАЦИЕЙ
import { DollarSign, TrendingUp, TrendingDown, Edit2, Trash2,
         Loader2, CheckCircle, Clock, ArrowRight, Plus, Download, ChevronLeft, ChevronRight, Filter, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { FINANCE_TABS, PAYMENT_STATUS } from '../../constants';
import { useAuthContext } from '../../context/AuthContext';
import { getFinanceParticipants } from '../../utils/financeUtils';
import { groupTransferPayments, getTransferParticipants } from '../../utils/transferGroupingUtils';
import { ParticipantCell } from '../ui/ParticipantCell';
import FinanceSubTabs from '../layout/FinanceSubTabs';
import StatementExportModal from '../modals/StatementExportModal';
import FinanceFilterModal from '../modals/FinanceFilterModal';
import FinanceAnalytics from '../charts/FinanceAnalytics';

const formatAmount = (amount) => {
  return Math.abs(Number(amount)).toLocaleString('ru-RU') + ' ₽';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getAmountColor = (amount) => {
  const value = Number(amount);
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

const FinancesTable = ({
  finances = [],
  clients = [],
  cashDesks = [],
  workers = [],
  financeSummary = { total_income: 0, total_expense: 0, balance: 0 },
  loading = false,
  onAddFinance,
  onEditFinance,
  onDeleteFinance,
  onError,
  activeSubTab = FINANCE_TABS.ACTUAL,
  onSubTabChange,
  onApplyFilters,
  isClientCard = false // 🆕 НОВЫЙ пропс для работы в карточке клиента
}) => {
  const { user } = useAuthContext();
  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  // СОСТОЯНИЕ ПАГИНАЦИИ (по аналогии с ClientsTable)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 🔍 СОСТОЯНИЕ ФИЛЬТРОВ
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    date_from: '',
    date_to: '',
    cash_desk_id: '',
    client_search: '',
    worker_search: '',
    category: '',
    description: ''
  });

  // НОВОЕ СОСТОЯНИЕ: Модальное окно для генерации выписки
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Проверка прав доступа для генерации выписки
  const canGenerateStatement = user?.role === 'admin' || user?.role === 'manager';

  // НОВЫЕ ОБРАБОТЧИКИ: Для модального окна генерации выписки
  const handleOpenStatementModal = () => {
    setIsStatementModalOpen(true);
  };

  const handleCloseStatementModal = () => {
    setIsStatementModalOpen(false);
  };

  const handleStatementError = (errorMessage) => {
    onError?.(errorMessage);
  };

  // 🔍 ОБРАБОТЧИКИ ФИЛЬТРОВ
  const handleOpenFilterModal = () => {
    setIsFilterModalOpen(true);
  };

  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleApplyFilters = (newFilters) => {
    setActiveFilters(newFilters);
    setCurrentPage(1); // Сбрасываем на первую страницу при применении фильтров
    
    if (onApplyFilters) {
      const fullFilters = {
        ...newFilters,
        status: activeSubTab === FINANCE_TABS.ACTUAL ? 
          PAYMENT_STATUS.ACTUAL : PAYMENT_STATUS.PLANNED
      };
      onApplyFilters(fullFilters);
    }
  };

  // Подсчет активных фильтров
  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter(value => 
      value && value.toString().trim() !== ''
    ).length;
  };

  // ✅ ГРУППИРУЕМ ПЕРЕВОДЫ МЕЖДУ КАССАМИ
  const groupedFinances = groupTransferPayments(finances, cashDesks);

  console.log('🔍 Данные для группировки:', {
    исходныеФинансы: finances.length,
    касс: cashDesks.length,
    сгруппированныеФинансы: groupedFinances.length
  });

  // Фильтруем финансы по активной подвкладке (в карточке клиента показываем все)
  const filteredFinances = groupedFinances.filter(finance => {
    if (isClientCard) {
      return true; // В карточке клиента показываем все операции
    }
    if (activeSubTab === FINANCE_TABS.ACTUAL) {
      return finance.status === PAYMENT_STATUS.ACTUAL;
    } else {
      return finance.status === PAYMENT_STATUS.PLANNED;
    }
  }).sort((a, b) => {
    // Сортировка: для карточки клиента и "Факт" - от новых к старым, для "План" - от старых к новым
    if (isClientCard || activeSubTab === FINANCE_TABS.ACTUAL) {
      return new Date(b.date) - new Date(a.date); // От новых к старым (DESC)
    } else {
      return new Date(a.date) - new Date(b.date); // От старых к новым (ASC)
    }
  });

  // РАСЧЕТЫ ДЛЯ ПАГИНАЦИИ (по аналогии с ClientsTable)
  const totalItems = filteredFinances.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // В карточке клиента показываем все операции без пагинации
  const currentFinances = isClientCard ? filteredFinances : filteredFinances.slice(startIndex, endIndex);

  // ФУНКЦИИ ПАГИНАЦИИ (по аналогии с ClientsTable)
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Сбрасываем на первую страницу
  };

  const getPaginationRange = () => {
    const delta = 2; // Количество страниц слева и справа от текущей
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  // СБРОС ПАГИНАЦИИ ПРИ ИЗМЕНЕНИИ ДАННЫХ
  useState(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredFinances.length, itemsPerPage]);

  // Подсчитываем количество для бейджей (используем исходный массив без группировки для корректного подсчета)
  const actualCount = finances.filter(f => f.status === PAYMENT_STATUS.ACTUAL).length;
  const plannedCount = finances.filter(f => f.status === PAYMENT_STATUS.PLANNED).length;

  // Подсчитываем сводку для текущей подвкладки
  const getFilteredSummary = () => {
    const filtered = filteredFinances;

    // Доходы: обычные доходы + переводы не учитываются (внутренние операции)
    const totalIncome = filtered
      .filter(f => f.type === 'income' && !f.is_grouped_transfer)
      .reduce((sum, f) => sum + Number(f.amount), 0);

    // Расходы: обычные расходы без переводов (переводы - внутренние операции)
    const totalExpense = filtered
      .filter(f => f.type === 'expense' && !f.is_grouped_transfer)
      .reduce((sum, f) => sum + Math.abs(Number(f.amount)), 0);

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense
    };
  };

  const currentSummary = getFilteredSummary();





  // ✅ ОБРАБОТКА РЕДАКТИРОВАНИЯ ПЕРЕВОДОВ (из оригинального кода)
  const handleEditFinance = (finance) => {
    if (finance.is_grouped_transfer) {
      // Для сгруппированных переводов можно открыть модал с информацией
      // или передать исходные операции для редактирования
      console.log('Редактирование перевода:', finance.original_payments);
      // Здесь можно открыть специальный модал для редактирования переводов
      // или передать первую операцию из пары
      onEditFinance(finance.original_payments[0]);
    } else {
      onEditFinance(finance);
    }
  };

  // ✅ ОБРАБОТКА УДАЛЕНИЯ ПЕРЕВОДОВ (из оригинального кода)
  const handleDeleteFinance = (financeId) => {
    const finance = filteredFinances.find(f => f.id === financeId);

    if (finance?.is_grouped_transfer) {
      // Для сгруппированных переводов нужно удалить обе операции
      console.log('Удаление перевода:', finance.original_payments);
      // Здесь можно показать подтверждение и удалить обе операции
      if (confirm('Удалить перевод между кассами? Будут удалены обе связанные операции.')) {
        finance.original_payments.forEach(payment => {
          onDeleteFinance(payment.id);
        });
      }
    } else {
      onDeleteFinance(financeId);
    }
  };

  // ✅ РЕНДЕР СТАТУС БЕЙДЖА (из оригинального кода)
  const renderStatusBadge = (finance) => {
    if (finance.is_grouped_transfer) {
      // Для переводов показываем специальный бейдж
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <ArrowRight className="w-3 h-3 mr-1" />
          Перевод
        </span>
      );
    }

    const isOverdue = finance.status === PAYMENT_STATUS.PLANNED && new Date(finance.date) < new Date();

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        finance.status === PAYMENT_STATUS.ACTUAL
          ? 'bg-green-100 text-green-800'
          : isOverdue
          ? 'bg-red-100 text-red-800' 
          : 'bg-orange-100 text-orange-800'
      }`}>
        <Clock className="w-3 h-3 mr-1" />
        {finance.status === PAYMENT_STATUS.ACTUAL ? 'Выполнен' : isOverdue ? 'Просрочен' : 'План'}
      </span>
    );
  };



  return (
    <div className="space-y-6">
      {/* Подвкладки - скрываем в карточке клиента */}
      {!isClientCard && (
        <FinanceSubTabs
          activeSubTab={activeSubTab}
          onSubTabChange={onSubTabChange}
          actualCount={actualCount}
          plannedCount={plannedCount}
        />
      )}

      {/* Сводка - показываем только для Факт и План, но не в карточке клиента */}
      {activeSubTab !== FINANCE_TABS.STATISTICS && !isClientCard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  {activeSubTab === FINANCE_TABS.ACTUAL ? 'Доходы (факт)' : 'Доходы (план)'}
                </p>
                <p className="text-2xl font-semibold text-green-600">
                  {formatAmount(currentSummary.total_income)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  {activeSubTab === FINANCE_TABS.ACTUAL ? 'Расходы (факт)' : 'Расходы (план)'}
                </p>
                <p className="text-2xl font-semibold text-red-600">
                  -{Number(currentSummary.total_expense).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeSubTab === FINANCE_TABS.ACTUAL ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <DollarSign className={`w-5 h-5 ${
                  activeSubTab === FINANCE_TABS.ACTUAL ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">
                  {activeSubTab === FINANCE_TABS.ACTUAL ? 'Баланс (факт)' : 'Баланс (план)'}
                </p>
                <p className={`text-2xl font-semibold ${getAmountColor(currentSummary.balance)}`}>
                  {formatAmount(currentSummary.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Таблица операций */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Заголовок таблицы с кнопками */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {isClientCard ? 
                `Операции (${filteredFinances.length})` :
                activeSubTab === FINANCE_TABS.ACTUAL ?
                  `Фактические операции (${actualCount})` :
                  activeSubTab === FINANCE_TABS.PLANNED ?
                    `Планируемые операции (${plannedCount})` :
                    'Статистика финансов'
              }
            </h2>
          </div>

          {/* Кнопки действий - скрываем в карточке клиента */}
          {activeSubTab !== FINANCE_TABS.STATISTICS && !isClientCard && (
            <div className="flex items-center space-x-3">
              {/* Кнопка фильтров */}
              <button
                onClick={handleOpenFilterModal}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  getActiveFiltersCount() > 0
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Фильтры"
              >
                <Filter className="w-4 h-4 mr-2" />
                Фильтры
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              {/* НОВАЯ КНОПКА: Генерация выписки - показываем только для фактических операций и только для admin/manager */}
              {activeSubTab === FINANCE_TABS.ACTUAL && canGenerateStatement && (
                <button
                  onClick={handleOpenStatementModal}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  title="Скачать выписку"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Выписка
                </button>
              )}

              {/* Существующая кнопка добавления операции */}
              <button
                onClick={onAddFinance}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить операцию
              </button>
            </div>
          )}
        </div>

        {activeSubTab === FINANCE_TABS.STATISTICS ? (
          <FinanceAnalytics />
        ) : loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" />
            <p>Загрузка...</p>
          </div>
        ) : filteredFinances.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            {isClientCard ? (
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            ) : activeSubTab === FINANCE_TABS.ACTUAL ? (
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            ) : (
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            )}
            <p>
              {isClientCard 
                ? 'Операции по клиенту не найдены'
                : activeSubTab === FINANCE_TABS.ACTUAL
                  ? 'Фактические операции не найдены'
                  : 'Планируемые операции не найдены'
              }
            </p>
            <p className="text-sm mt-2">
              {isClientCard 
                ? 'Операции появятся здесь после их добавления'
                : 'Добавьте первую операцию, нажав кнопку выше'
              }
            </p>
          </div>
        ) : (
          <>
            {/* СЕЛЕКТОР КОЛИЧЕСТВА ЗАПИСЕЙ НА СТРАНИЦЕ - скрываем в карточке клиента */}
            {!isClientCard && (
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Показывать по:</span>
                  <div className="flex space-x-1">
                    {[10, 20, 40].map((count) => (
                      <button
                        key={count}
                        onClick={() => handleItemsPerPageChange(count)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          itemsPerPage === count
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Показано {startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems}
                </div>
              </div>
            )}

            {/* ТАБЛИЦА */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Отправитель
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Получатель
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentFinances.map((finance) => {
                    // ✅ ОПРЕДЕЛЯЕМ УЧАСТНИКОВ ДЛЯ ПЕРЕВОДОВ И ОБЫЧНЫХ ОПЕРАЦИЙ
                    const { sender, recipient } = finance.is_grouped_transfer
                      ? getTransferParticipants(finance, cashDesks)
                      : getFinanceParticipants(finance, clients, cashDesks, workers);

                    return (
                      <tr key={finance.id || `${finance.date}-${finance.amount}-${Math.random()}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(finance.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            finance.is_grouped_transfer 
                              ? 'text-blue-600' 
                              : finance.type === 'income' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                          }`}>
                            {finance.is_grouped_transfer
                              ? '→'
                              : finance.type === 'income'
                                ? '+'
                                : '-'}{formatAmount(finance.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ParticipantCell participant={sender} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ParticipantCell participant={recipient} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div>
                            {/* Категория жирным шрифтом сверху */}
                            {finance.category && (
                              <div className="font-semibold text-gray-900 truncate" title={finance.category}>
                                {finance.category}
                              </div>
                            )}
                            {/* Описание обычным шрифтом снизу */}
                            {finance.description && (
                              <div className="truncate text-gray-600" title={finance.description}>
                                {finance.description}
                              </div>
                            )}
                            {/* Если нет ни категории, ни описания */}
                            {!finance.category && !finance.description && (
                              <span className="text-gray-400 italic">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusBadge(finance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Показываем кнопку редактирования только для обычных операций */}
                            {!finance.is_grouped_transfer && (
                              <button
                                onClick={() => handleEditFinance(finance)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Редактировать"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteFinance(finance.id || finance.transfer_id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title={finance.is_grouped_transfer ? "Удалить перевод" : "Удалить"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ПАГИНАЦИЯ - скрываем в карточке клиента */}
            {totalPages > 1 && !isClientCard && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-2 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {getPaginationRange().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                        disabled={page === '...'}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : page === '...'
                            ? 'text-gray-400 cursor-default'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-2 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-700">
                  Страница {currentPage} из {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* НОВОЕ МОДАЛЬНОЕ ОКНО: Генерация выписки - скрываем в карточке клиента */}
      {!isClientCard && (
        <StatementExportModal
          isOpen={isStatementModalOpen}
          onClose={handleCloseStatementModal}
          onError={handleStatementError}
        />
      )}

      {/* МОДАЛЬНОЕ ОКНО ФИЛЬТРОВ - скрываем в карточке клиента */}
      {!isClientCard && (
        <FinanceFilterModal
          isOpen={isFilterModalOpen}
          onClose={handleCloseFilterModal}
          onApplyFilters={handleApplyFilters}
          finances={finances}
          cashDesks={cashDesks}
          clients={clients}
          workers={workers}
          initialFilters={activeFilters}
        />
      )}
    </div>
  );
};

export default FinancesTable;