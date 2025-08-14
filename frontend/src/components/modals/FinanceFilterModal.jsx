// src/components/modals/FinanceFilterModal.jsx
import { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import InputField from '../ui/InputField';
import DropdownField from '../ui/DropdownField';
import ActionButton from '../ui/ActionButton';
import CancelButton from '../ui/CancelButton';
import SingleDateRangeFilter from '../ui/SingleDateRangeFilter';
import { apiService } from '../../services/api';

const FinanceFilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  finances = [],
  cashDesks = [],
  clients = [],
  workers = [],
  initialFilters = {}
}) => {
  // Состояние фильтров
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    cash_desk_id: '',
    client_search: '',
    worker_search: '',
    category: '',
    description: ''
  });

  const [buttonState, setButtonState] = useState('inactive');
  const [localCashDesks, setLocalCashDesks] = useState([]);
  const [cashDesksLoading, setCashDesksLoading] = useState(false);

  // Инициализация фильтров при открытии модалки
  useEffect(() => {
    if (isOpen) {
      setFilters({ ...filters, ...initialFilters });
    }
  }, [isOpen, initialFilters]);

  // Проверка активности кнопки "Применить"
  useEffect(() => {
    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
      return value && value.trim() !== '';
    });

    setButtonState(hasActiveFilters ? 'active' : 'inactive');
  }, [filters]);

  // Ленивая подгрузка касс при открытии модалки, если их нет в пропсах
  useEffect(() => {
    const loadCashDesksIfNeeded = async () => {
      if (!isOpen) return;
      if (cashDesks && cashDesks.length > 0) return;
      try {
        setCashDesksLoading(true);
        const response = await apiService.get('/cash-desks');
        const list = response?.data || response || [];
        setLocalCashDesks(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Не удалось загрузить кассы для фильтров:', e);
      } finally {
        setCashDesksLoading(false);
      }
    };
    loadCashDesksIfNeeded();
  }, [isOpen, cashDesks]);

  // Обработка изменений в полях
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Обработка изменения дат
  const handleDateFilterChange = (dateFilter) => {
    setFilters(prev => ({
      ...prev,
      date_from: dateFilter.date_from || '',
      date_to: dateFilter.date_to || ''
    }));
  };

  // Применение фильтров
  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    const resetFilters = {
      date_from: '',
      date_to: '',
      cash_desk_id: '',
      client_search: '',
      worker_search: '',
      category: '',
      description: ''
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  // Закрытие модалки
  const handleClose = () => {
    onClose();
  };

  // Получение уникальных категорий
  const getUniqueCategories = () => {
    const categories = new Set();
    finances.forEach(finance => {
      if (finance.category && finance.category.trim() !== '') {
        categories.add(finance.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Опции для касс (с fallback из списка операций, если список касс ещё не подгружен)
  const sourceCashDesks = (cashDesks && cashDesks.length > 0) ? cashDesks : localCashDesks;

  const cashDeskOptions = (sourceCashDesks && sourceCashDesks.length > 0)
    ? sourceCashDesks.map(cashDesk => ({
        value: cashDesk.id != null ? cashDesk.id.toString() : '',
        label: cashDesk.name || ''
      }))
    : (() => {
        const map = new Map();
        finances.forEach(f => {
          const id = f.cash_desk_id;
          const name = f.cash_desk_name;
          if (id != null && name && !map.has(id)) {
            map.set(id, { value: id.toString(), label: name });
          }
        });
        return Array.from(map.values());
      })();

  // Debug: посмотреть, что в опциях
  if (isOpen) {
    try { console.debug('FinanceFilterModal cashDeskOptions:', cashDeskOptions); } catch (_) {}
  }

  // Опции для категорий
  const categoryOptions = getUniqueCategories().map(category => ({
    value: category,
    label: category
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Filter className="w-6 h-6 text-blue-600" />
            <h2
              className="text-2xl font-semibold text-gray-800"
              style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}
            >
              Фильтры финансов
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Содержимое модалки */}
        <div className="p-8 space-y-6">

          {/* Период */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Период
            </label>
            <SingleDateRangeFilter
              onApplyFilter={handleDateFilterChange}
              initialDateFrom={filters.date_from}
              initialDateTo={filters.date_to}
              loading={false}
            />
          </div>

          {/* Касса */}
          <DropdownField
            label="Касса"
            value={filters.cash_desk_id}
            onChange={(value) => handleFilterChange('cash_desk_id', value)}
            options={cashDeskOptions}
            placeholder="Выберите кассу"
          />

          {/* Клиент */}
          <InputField
            label="Клиент"
            placeholder="ФИО, email, телефон, телеграм"
            value={filters.client_search}
            onChange={(value) => handleFilterChange('client_search', value)}
          />

          {/* Работник */}
          <InputField
            label="Работник"
            placeholder="ФИО, должность, телефон, телеграм"
            value={filters.worker_search}
            onChange={(value) => handleFilterChange('worker_search', value)}
          />

          {/* Категория */}
          <DropdownField
            label="Категория"
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            options={categoryOptions}
            placeholder="Выберите категорию"
          />

          {/* Описание */}
          <InputField
            label="Описание"
            placeholder="Поиск по описанию операции"
            value={filters.description}
            onChange={(value) => handleFilterChange('description', value)}
          />

          {/* Кнопки */}
          <div className="flex justify-center gap-12 pt-4">
            <CancelButton
              onClick={handleResetFilters}
              text="Сбросить"
            />

            <ActionButton
              state={buttonState}
              onClick={handleApplyFilters}
              text="Применить"
              loadingText="Применение..."
              successText="Применено!"
              errorText="Ошибка"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceFilterModal;
