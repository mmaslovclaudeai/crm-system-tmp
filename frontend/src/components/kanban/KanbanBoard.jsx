// src/components/kanban/KanbanBoard.jsx - ВЕРСИЯ С ФИЛЬТРАЦИЕЙ
import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Target, Plus, Filter } from 'lucide-react';

import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { CLIENT_STATUS, LEAD_STATUSES, CLIENT_STATUS_LABELS } from '../../constants';
import ClientFilterModal from '../modals/ClientFilterModal';

const KanbanBoard = ({
  leads = [],
  loading = false,
  onCardClick,
  onUpdateStatus,
  onAddLead,
  searchTerm = '',
  onSearch
}) => {
  const [activeId, setActiveId] = useState(null);
  const [columns, setColumns] = useState({});

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
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Фильтр по ФИО
      if (activeFilters.name.trim()) {
        const hasName = lead.name && lead.name.toLowerCase().includes(activeFilters.name.toLowerCase());
        if (!hasName) return false;
      }
      if (activeFilters.nameFilter === 'filled' && (!lead.name || !lead.name.trim())) return false;
      if (activeFilters.nameFilter === 'empty' && lead.name && lead.name.trim()) return false;

      // Фильтр по Телеграм
      if (activeFilters.telegram.trim()) {
        const hasTelegram = lead.telegram && lead.telegram.toLowerCase().includes(activeFilters.telegram.toLowerCase());
        if (!hasTelegram) return false;
      }
      if (activeFilters.telegramFilter === 'filled' && (!lead.telegram || !lead.telegram.trim())) return false;
      if (activeFilters.telegramFilter === 'empty' && lead.telegram && lead.telegram.trim()) return false;

      // Фильтр по телефону
      if (activeFilters.phone.trim()) {
        const hasPhone = lead.phone && lead.phone.includes(activeFilters.phone);
        if (!hasPhone) return false;
      }
      if (activeFilters.phoneFilter === 'filled' && (!lead.phone || !lead.phone.trim())) return false;
      if (activeFilters.phoneFilter === 'empty' && lead.phone && lead.phone.trim()) return false;

      // Фильтр по потоку
      if (activeFilters.flow && lead.data?.flow !== activeFilters.flow) return false;

      // Фильтр по направлению
      if (activeFilters.direction && lead.data?.direction !== activeFilters.direction) return false;

      // Фильтр по группе
      if (activeFilters.group && lead.data?.group !== activeFilters.group) return false;

      // Фильтр по статусу
      if (activeFilters.status && lead.status !== activeFilters.status) return false;

      return true;
    });
  }, [leads, activeFilters]);

  // Настройка сенсоров для drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Группируем отфильтрованных лидов по статусам при изменении данных
  useEffect(() => {
    const groupedLeads = LEAD_STATUSES.reduce((acc, status) => {
      acc[status] = filteredLeads.filter(lead => lead.status === status);
      return acc;
    }, {});
    setColumns(groupedLeads);
  }, [filteredLeads]);

  // Обработчик начала перетаскивания
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Обработчик завершения перетаскивания
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Находим активную карточку
    const activeLead = leads.find(lead => lead.id === activeId);
    if (!activeLead) {
      setActiveId(null);
      return;
    }

    // Определяем новый статус
    let newStatus = null;

    // Если перетаскиваем на столбец
    if (LEAD_STATUSES.includes(overId)) {
      newStatus = overId;
    } else {
      // Если перетаскиваем на другую карточку, найдем статус того столбца
      const targetLead = leads.find(lead => lead.id === overId);
      if (targetLead) {
        newStatus = targetLead.status;
      }
    }

    // Если статус изменился, обновляем
    if (newStatus && newStatus !== activeLead.status) {
      try {
        await onUpdateStatus(activeId, newStatus);
      } catch (error) {
        console.error('Ошибка обновления статуса:', error);
      }
    }

    setActiveId(null);
  };

  // Обработчик отмены перетаскивания
  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Найти активную карточку для DragOverlay
  const activeCard = activeId ? leads.find(lead => lead.id === activeId) : null;

  // Фильтрация лидов по поисковому запросу (для обратной совместимости)
  const filterLeads = (leadsArray) => {
    if (!searchTerm) return leadsArray;

    const term = searchTerm.toLowerCase();
    return leadsArray.filter(lead =>
      lead.name.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      (lead.telegram && lead.telegram.toLowerCase().includes(term))
    );
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
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка канбан доски...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      {/* Заголовок с кнопками */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center">
          <Target className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            Новые ученики
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredLeads.length} {filteredLeads.length === 1 ? 'лид' : filteredLeads.length < 5 ? 'ученика' : 'учеников'})
            </span>
          </h2>
        </div>

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
            onClick={onAddLead}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить ученика</span>
          </button>
        </div>
      </div>

      {/* Канбан доска */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex-1 flex space-x-6 overflow-x-auto overflow-y-hidden">
            {LEAD_STATUSES.map((status) => {
              const columnLeads = filterLeads(columns[status] || []);

              return (
                <KanbanColumn
                  key={status}
                  id={status}
                  title={CLIENT_STATUS_LABELS[status]}
                  count={columnLeads.length}
                  leads={columnLeads}
                  onCardClick={onCardClick}
                />
              );
            })}
          </div>

          {/* Overlay для перетаскиваемой карточки */}
          <DragOverlay>
            {activeCard ? (
              <KanbanCard
                lead={activeCard}
                isDragging={true}
                onClick={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Пустое состояние */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {leads.length === 0 ? 'Нет лидов' : 'Лиды не найдены'}
          </h3>
          <p className="text-gray-500 mb-6">
            {leads.length === 0
              ? 'Добавьте первого ученика, чтобы начать работу с канбан доской'
              : 'Попробуйте изменить параметры фильтрации.'
            }
          </p>
          {leads.length === 0 && (
            <button
              onClick={onAddLead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Добавить первого ученика</span>
            </button>
          )}
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ФИЛЬТРОВ */}
      <ClientFilterModal
        isOpen={isFilterModalOpen}
        onClose={handleCloseFilterModal}
        onApplyFilters={handleApplyFilters}
        clients={leads}
        initialFilters={activeFilters}
      />
    </div>
  );
};

export default KanbanBoard;