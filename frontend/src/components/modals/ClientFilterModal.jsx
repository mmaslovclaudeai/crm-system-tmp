// src/components/modals/ClientFilterModal.jsx
import { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import InputField from '../ui/InputField';
import DropdownField from '../ui/DropdownField';
import ActionButton from '../ui/ActionButton';
import CancelButton from '../ui/CancelButton';
import { CLIENT_STATUS_LABELS } from '../../constants';

const ClientFilterModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  clients = [],
  initialFilters = {}
}) => {
  // Состояние фильтров
  const [filters, setFilters] = useState({
    name: '',
    nameFilter: 'any', // 'any', 'filled', 'empty'
    telegram: '',
    telegramFilter: 'any',
    phone: '',
    phoneFilter: 'any',
    flow: '',
    direction: '',
    group: '',
    status: ''
  });

  const [buttonState, setButtonState] = useState('inactive');

  // Инициализация фильтров при открытии модалки
  useEffect(() => {
    if (isOpen) {
      setFilters({ ...filters, ...initialFilters });
    }
  }, [isOpen, initialFilters]);

  // Проверка активности кнопки "Применить"
  useEffect(() => {
    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
      if (key.endsWith('Filter')) return value !== 'any';
      return value && value.trim() !== '';
    });

    setButtonState(hasActiveFilters ? 'active' : 'inactive');
  }, [filters]);

  // Обработка изменений в полях
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Применение фильтров
  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    const resetFilters = {
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
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  // Закрытие модалки
  const handleClose = () => {
    onClose();
  };

  // Получение уникальных значений для выпадающих списков
  const getUniqueValues = (field) => {
    const values = new Set();

    clients.forEach(client => {
      let value;
      if (field === 'status') {
        value = client.status;
      } else {
        value = client.data?.[field];
      }

      if (value && value.trim() !== '') {
        values.add(value);
      }
    });

    return Array.from(values).sort();
  };

  // Опции для фильтров заполненности
  const fillFilterOptions = [
    { value: 'any', label: 'Любые' },
    { value: 'filled', label: 'Только заполненные' },
    { value: 'empty', label: 'Только пустые' }
  ];

  // Опции для статусов
  const statusOptions = Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label
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
              Фильтры
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

          {/* ФИО */}
          <div className="space-y-3">
            <InputField
              label="ФИО"
              placeholder="Введите ФИО"
              value={filters.name}
              onChange={(value) => handleFilterChange('name', value)}
            />
          </div>

          {/* Телеграм */}
          <div className="space-y-3">
            <InputField
              label="Телеграм"
              placeholder="Введите Telegram"
              value={filters.telegram}
              onChange={(value) => handleFilterChange('telegram', value)}
            />
          </div>

          {/* Номер телефона */}
          <div className="space-y-3">
            <InputField
              label="Номер телефона"
              placeholder="Введите номер телефона"
              value={filters.phone}
              onChange={(value) => handleFilterChange('phone', value)}
            />
          </div>

          {/* Поток */}
          <DropdownField
            label="Поток"
            value={filters.flow}
            onChange={(value) => handleFilterChange('flow', value)}
            options={getUniqueValues('flow').map(value => ({ value, label: value }))}
            placeholder="Выберите поток"
          />

          {/* Направление */}
          <DropdownField
            label="Направление"
            value={filters.direction}
            onChange={(value) => handleFilterChange('direction', value)}
            options={getUniqueValues('direction').map(value => ({ value, label: value }))}
            placeholder="Выберите направление"
          />

          {/* Группа */}
          <DropdownField
            label="Группа"
            value={filters.group}
            onChange={(value) => handleFilterChange('group', value)}
            options={getUniqueValues('group').map(value => ({ value, label: value }))}
            placeholder="Выберите группу"
          />

          {/* Статус */}
          <DropdownField
            label="Статус"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={statusOptions}
            placeholder="Выберите статус"
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

export default ClientFilterModal;