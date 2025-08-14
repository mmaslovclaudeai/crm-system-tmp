// src/components/kanban/KanbanColumn.jsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ id, title, count, leads = [], onCardClick }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  // Цвета для разных статусов (пастельные тона)
  const getColumnColor = (status) => {
    const colors = {
      'CREATED': 'border-blue-200 bg-blue-50',
      'DISTRIBUTION': 'border-indigo-200 bg-indigo-50',
      'GIVE_ACCESS': 'border-emerald-200 bg-emerald-50'
    };
    return colors[status] || 'border-gray-200 bg-gray-50';
  };


  const getBadgeColor = (status) => {
    const colors = {
      'CREATED': 'bg-blue-100 text-blue-700',
      'DISTRIBUTION': 'bg-indigo-100 text-indigo-700',
      'GIVE_ACCESS': 'bg-emerald-100 text-emerald-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        min-w-80 w-80 border-2 rounded-lg transition-all duration-200 flex flex-col h-full
        ${getColumnColor(id)}
        ${isOver ? 'border-blue-400 bg-blue-100' : ''}
      `}
    >
      {/* Заголовок столбца */}
      <div className="p-4 border-b border-white/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 truncate pr-2">
            {title}
          </h3>
          <span className={`
            px-2.5 py-1 rounded-full text-sm font-medium
            ${getBadgeColor(id)}
          `}>
            {count}
          </span>
        </div>
      </div>

      {/* Список карточек */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        <SortableContext
          items={leads.map(lead => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onClick={() => onCardClick(lead)}
            />
          ))}
        </SortableContext>

        {/* Пустое состояние столбца */}
        {leads.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm">Перетащите карточку сюда</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;