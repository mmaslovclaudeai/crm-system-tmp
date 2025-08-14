// src/components/tables/WorkersTable.jsx - Таблица работников
import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  User,
  Phone,
  Calendar,
  CreditCard,
  Building2,
  MessageCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { WORKER_SEARCH_FILTERS } from '../../constants';

const WorkersTable = ({
  workers = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  onAddWorker,
  onEditWorker,
  onDeleteWorker,
  onViewWorkerStats,
  onViewWorkerFinances
}) => {
  const { user } = useAuthContext();
  const [searchFilter, setSearchFilter] = useState(WORKER_SEARCH_FILTERS.NAME);

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Форматирование стажа работы
  const formatWorkExperience = (hireDate, fireDate = null) => {
    const startDate = new Date(hireDate);
    const endDate = fireDate ? new Date(fireDate) : new Date();

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0) {
      return `${years} лет ${months} мес.`;
    } else if (months > 0) {
      return `${months} мес.`;
    } else {
      return `${diffDays} дн.`;
    }
  };

  // Форматирование суммы
  const formatAmount = (amount) => {
    const formatted = Number(amount).toLocaleString('ru-RU');
    return `${formatted} ₽`;
  };

  // Получение статуса работника
  const getWorkerStatusBadge = (worker) => {
    if (worker.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Активен
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Уволен
        </span>
      );
    }
  };

  // Проверка прав доступа
  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  // Обработчик удаления с подтверждением
  const handleDelete = (worker) => {
    if (worker.transactions_count > 0) {
      alert(`Невозможно удалить работника ${worker.full_name}. У него есть ${worker.transactions_count} связанных финансовых операций.`);
      return;
    }

    if (confirm(`Вы уверены, что хотите удалить работника "${worker.full_name}"?`)) {
      onDeleteWorker(worker.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Загрузка работников...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🔍 ПОИСКОВАЯ ПАНЕЛЬ */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center space-x-4">
          {/* Поле поиска */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Поиск работников..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Фильтр поиска */}
          <div className="relative">
            <select
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={WORKER_SEARCH_FILTERS.NAME}>По имени</option>
              <option value={WORKER_SEARCH_FILTERS.POSITION}>По должности</option>
              <option value={WORKER_SEARCH_FILTERS.TELEGRAM}>По Telegram</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Кнопка добавления */}
        {canEdit && (
          <button
            onClick={onAddWorker}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить работника
          </button>
        )}
      </div>

      {/* 📊 СТАТИСТИКА */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Всего работников
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {workers.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Активных
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {workers.filter(w => w.is_active).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Общая зарплата
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatAmount(workers.reduce((sum, w) => sum + (w.total_salary_paid || 0), 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 ТАБЛИЦА РАБОТНИКОВ */}
      {workers.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Нет работников</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'По вашему запросу ничего не найдено.' : 'Начните с добавления первого работника.'}
          </p>
          {canEdit && !searchTerm && (
            <div className="mt-6">
              <button
                onClick={onAddWorker}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить работника
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Работник
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Должность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контакты
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Банк
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стаж
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Финансы
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    {/* Работник */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {worker.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {worker.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Должность */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{worker.position}</div>
                    </td>

                    {/* Контакты */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {worker.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-3 h-3 mr-1" />
                            {worker.phone}
                          </div>
                        )}
                        {worker.telegram_username && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {worker.telegram_username}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Банк */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {worker.bank && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Building2 className="w-3 h-3 mr-1" />
                            {worker.bank}
                          </div>
                        )}
                        {worker.masked_card_number && (
                          <div className="flex items-center text-sm text-gray-400">
                            <CreditCard className="w-3 h-3 mr-1" />
                            {worker.masked_card_number}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Стаж */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(worker.hire_date)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatWorkExperience(worker.hire_date, worker.fire_date)}
                        </div>
                        {worker.fire_date && (
                          <div className="text-xs text-red-500">
                            Уволен: {formatDate(worker.fire_date)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Статус */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getWorkerStatusBadge(worker)}
                    </td>

                    {/* Финансы */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {worker.transactions_count || 0} операций
                        </div>
                        {worker.total_salary_paid > 0 && (
                          <div className="text-xs text-red-600">
                            Выплачено: {formatAmount(worker.total_salary_paid)}
                          </div>
                        )}
                        {worker.total_income_brought > 0 && (
                          <div className="text-xs text-green-600">
                            Принес: {formatAmount(worker.total_income_brought)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Действия */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Статистика */}
                        <button
                          onClick={() => onViewWorkerStats(worker)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Статистика работника"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>

                        {/* Финансы */}
                        <button
                          onClick={() => onViewWorkerFinances(worker)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Финансовые операции"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>

                        {/* Редактирование */}
                        {canEdit && (
                          <button
                            onClick={() => onEditWorker(worker)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Удаление */}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(worker)}
                            className="text-red-600 hover:text-red-900 transition-colors"
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
        </div>
      )}
    </div>
  );
};

export default WorkersTable;