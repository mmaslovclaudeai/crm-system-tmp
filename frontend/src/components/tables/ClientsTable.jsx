// src/components/tables/ClientsTable.jsx - ВЕРСИЯ С КНОПКОЙ ФИЛЬТРА
import { useState, useMemo } from 'react';
import { Users, Target, Plus, User, Loader2, MessageSquare, BookOpen, Users as GroupIcon, ArrowUp, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, STATUS_GROUPS } from '../../constants';
import { getRecordTypeName } from '../../utils/statusUtils';
import ClientFilterModal from '../modals/ClientFilterModal';

const ClientsTable = ({
  clients = [],
  loading = false,
  showResults = true,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onClientCardOpen,
  statusGroup = STATUS_GROUPS.ALL
}) => {
  const { canDelete } = useAuthContext();

  // 📄 СОСТОЯНИЕ ПАГИНАЦИИ
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 🔍 СОСТОЯНИЕ ФИЛЬТРОВ
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    name: '',
    nameFilter: 'any',
    telegram: '',
    telegramFilter: 'any',
    phone: '',
    phoneFilter: 'any',
    flow: '',
    direction: '',
    group: '',
    status: ''
  });

  // 🔍 ПРИМЕНЕНИЕ ФИЛЬТРОВ
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Фильтр по ФИО
      if (activeFilters.name.trim()) {
        const hasName = client.name && client.name.toLowerCase().includes(activeFilters.name.toLowerCase());
        if (!hasName) return false;
      }
      if (activeFilters.nameFilter === 'filled' && (!client.name || !client.name.trim())) return false;
      if (activeFilters.nameFilter === 'empty' && client.name && client.name.trim()) return false;

      // Фильтр по Телеграм
      if (activeFilters.telegram.trim()) {
        const hasTelegram = client.telegram && client.telegram.toLowerCase().includes(activeFilters.telegram.toLowerCase());
        if (!hasTelegram) return false;
      }
      if (activeFilters.telegramFilter === 'filled' && (!client.telegram || !client.telegram.trim())) return false;
      if (activeFilters.telegramFilter === 'empty' && client.telegram && client.telegram.trim()) return false;

      // Фильтр по телефону
      if (activeFilters.phone.trim()) {
        const hasPhone = client.phone && client.phone.includes(activeFilters.phone);
        if (!hasPhone) return false;
      }
      if (activeFilters.phoneFilter === 'filled' && (!client.phone || !client.phone.trim())) return false;
      if (activeFilters.phoneFilter === 'empty' && client.phone && client.phone.trim()) return false;

      // Фильтр по потоку
      if (activeFilters.flow && client.data?.flow !== activeFilters.flow) return false;

      // Фильтр по направлению
      if (activeFilters.direction && client.data?.direction !== activeFilters.direction) return false;

      // Фильтр по группе
      if (activeFilters.group && client.data?.group !== activeFilters.group) return false;

      // Фильтр по статусу
      if (activeFilters.status && client.status !== activeFilters.status) return false;

      return true;
    });
  }, [clients, activeFilters]);

  // 🔧 НОВОЕ: Определяем заголовки и кнопки в зависимости от группы статусов
  const getTableConfig = () => {
    switch (statusGroup) {
      case STATUS_GROUPS.LEADS:
        return {
          title: 'Список лидов',
          addButtonText: 'Добавить лида',
          icon: Target,
          emptyMessage: 'Лидов пока нет. Добавьте первого лида!',
          noResultsMessage: 'Лиды не найдены'
        };
      case STATUS_GROUPS.CLIENTS:
        return {
          title: 'Список клиентов',
          addButtonText: 'Добавить клиента',
          icon: Users,
          emptyMessage: 'Клиентов пока нет. Добавьте первого клиента!',
          noResultsMessage: 'Клиенты не найдены'
        };
      default:
        return {
          title: 'Список записей',
          addButtonText: 'Добавить запись',
          icon: Users,
          emptyMessage: 'Записей пока нет. Добавьте первую запись!',
          noResultsMessage: 'Записи не найдены'
        };
    }
  };

  const config = getTableConfig();
  const IconComponent = config.icon;

  // 📄 РАСЧЕТЫ ДЛЯ ПАГИНАЦИИ (используем отфильтрованные данные)
  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // 📄 ФУНКЦИИ ПАГИНАЦИИ
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

  // 📄 СБРОС ПАГИНАЦИИ ПРИ ИЗМЕНЕНИИ КЛИЕНТОВ
  useState(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredClients.length, itemsPerPage]);

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
  };

  // 🔧 ОБРАБОТЧИКИ СОБЫТИЙ
  const handleDelete = async (e, client) => {
    e.stopPropagation();
    const recordType = getRecordTypeName(client.status);
    console.log(`🗑️ ClientsTable.handleDelete вызван с ${recordType.toLowerCase()}:`, client);

    if (onDeleteClient) {
      await onDeleteClient(client.id);
    }
  };

  const handleEdit = (e, client) => {
    e.stopPropagation();
    if (onEditClient) {
      onEditClient(client);
    }
  };

  const handleRowClick = (client) => {
    // Открываем в новой вкладке
    window.open(`/client/${client.id}`, '_blank');
  };

  // 🎨 ФУНКЦИИ ДЛЯ СТИЛИЗАЦИИ
  const getStatusLabel = (status) => {
    return CLIENT_STATUS_LABELS[status] || status;
  };

  const getStatusColor = (status) => {
    return CLIENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  };

  // 🎯 ФУНКЦИИ ИЗВЛЕЧЕНИЯ ДАННЫХ ИЗ CLIENT
  const getEducationData = (client) => {
    return {
      flow: client.data?.flow || '—',
      direction: client.data?.direction || '—',
      group: client.data?.group || '—'
    };
  };

  const getDirectionBadgeColor = (direction) => {
    switch (direction) {
      case 'QA':
        return 'bg-blue-100 text-blue-800';
      case 'AQA':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* ЗАГОЛОВОК С КНОПКАМИ */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <IconComponent className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">{config.title}</h2>
          {showResults && totalItems > 0 && (
            <span className="text-sm text-gray-500">
              ({totalItems} {totalItems === 1 ? 'запись' : totalItems < 5 ? 'записи' : 'записей'})
            </span>
          )}
        </div>

        {/* КНОПКИ */}
        <div className="flex items-center space-x-3">
          {/* Кнопка фильтра */}
          <button
            onClick={handleOpenFilterModal}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span></span>
          </button>

          {/* Кнопка добавления */}
          <button
            onClick={onAddClient}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{config.addButtonText}</span>
          </button>
        </div>
      </div>

      {/* КОНТЕНТ */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" />
          <p>Загрузка...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <IconComponent className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {clients.length === 0 ? config.emptyMessage : config.noResultsMessage}
          </p>
          {clients.length === 0 && (
            <p className="text-sm">
              Используйте кнопку "{config.addButtonText}" для добавления первой записи.
            </p>
          )}
          {clients.length > 0 && filteredClients.length === 0 && (
            <p className="text-sm">
              Попробуйте изменить параметры фильтрации.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* СЕЛЕКТОР КОЛИЧЕСТВА ЗАПИСЕЙ НА СТРАНИЦЕ */}
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

          {/* ТАБЛИЦА */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* ИМЯ */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Имя</span>
                    </div>
                  </th>

                  {/* ТЕЛЕГРАМ */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>Телеграм</span>
                    </div>
                  </th>

                  {/* ТЕЛЕФОН */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>Телефон</span>
                    </div>
                  </th>

                  {/* ПОТОК */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="w-4 h-4" />
                      <span>Поток</span>
                    </div>
                  </th>

                  {/* НАПРАВЛЕНИЕ */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Направление</span>
                    </div>
                  </th>

                  {/* ГРУППА */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <GroupIcon className="w-4 h-4" />
                      <span>Группа</span>
                    </div>
                  </th>

                  {/* СТАТУС */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>

                  {/* ДЕЙСТВИЯ */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentClients.map((client) => {
                  const educationData = getEducationData(client);
                  return (
                    <tr
                      key={client.id}
                      onClick={() => handleRowClick(client)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {/* ИМЯ */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {client.id}
                        </div>
                      </td>

                      {/* ТЕЛЕГРАМ */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-800">
                          {client.telegram ? `${client.telegram}` : '—'}
                        </div>
                      </td>

                      {/* ТЕЛЕФОН */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client.phone || '—'}
                        </div>
                      </td>

                      {/* ПОТОК */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {educationData.flow}
                        </div>
                      </td>

                      {/* НАПРАВЛЕНИЕ */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {educationData.direction !== '—' ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDirectionBadgeColor(educationData.direction)}`}>
                            {educationData.direction}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>

                      {/* ГРУППА */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {educationData.group}
                        </div>
                      </td>

                      {/* СТАТУС */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                          {getStatusLabel(client.status)}
                        </span>
                      </td>

                      {/* ДЕЙСТВИЯ */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => handleEdit(e, client)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Редактировать"
                          >
                            Изменить
                          </button>
                          {canDelete && (
                            <button
                              onClick={(e) => handleDelete(e, client)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Удалить"
                            >
                              Удалить
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

          {/* ПАГИНАЦИЯ */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="hidden md:flex">
                  {getPaginationRange().map((page, index) => (
                    page === '...' ? (
                      <span key={`dots-${index}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="text-sm text-gray-700">
                Страница {currentPage} из {totalPages}
              </div>
            </div>
          )}
        </>
      )}

      {/* МОДАЛЬНОЕ ОКНО ФИЛЬТРОВ */}
      <ClientFilterModal
        isOpen={isFilterModalOpen}
        onClose={handleCloseFilterModal}
        onApplyFilters={handleApplyFilters}
        clients={clients}
        initialFilters={activeFilters}
      />
    </div>
  );
};

export default ClientsTable;