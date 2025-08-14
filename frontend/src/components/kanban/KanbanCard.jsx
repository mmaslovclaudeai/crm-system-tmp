// src/components/kanban/KanbanCard.jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Mail, MessageCircle, Calendar, ExternalLink } from 'lucide-react';

const KanbanCard = ({ lead, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  // Получение инициалов из имени
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Цвет аватара на основе имени
  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-100 text-red-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-orange-100 text-orange-700'
    ];

    const index = name.length % colors.length;
    return colors[index];
  };

  const handleCardClick = (e) => {
    // Предотвращаем клик во время перетаскивания
    if (isSortableDragging || isDragging) {
      e.preventDefault();
      return;
    }
    onClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg border border-gray-200 p-3 cursor-pointer 
        transition-all duration-200 hover:shadow-md hover:border-gray-300
        ${(isSortableDragging || isDragging) ? 'opacity-50 rotate-2 shadow-lg' : ''}
        ${isDragging ? 'z-50' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Верхняя часть карточки */}
      <div className="flex items-start justify-between mb-3">
        {/* Аватар с инициалами */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          text-sm font-semibold ${getAvatarColor(lead.name)}
        `}>
          {getInitials(lead.name)}
        </div>

        {/* Дата создания */}
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(lead.created_at)}
        </div>
      </div>

      {/* Основная информация */}
      <div className="space-y-2">
        {/* ФИО */}
        <div className="flex items-start">
          <User className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
            {lead.name}
          </h4>
        </div>

        {/* Email */}
        <div className="flex items-center">
          <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <span className="text-xs text-gray-600 truncate">
            {lead.email}
          </span>
        </div>

        {/* Telegram (если есть) */}
        {lead.telegram && (
          <div className="flex items-center">
            <MessageCircle className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
            <span className="text-xs text-blue-600 truncate">
              {lead.telegram}
            </span>
          </div>
        )}
      </div>

      {/* Нижняя часть - индикатор клика */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-end text-xs text-gray-400">
          <ExternalLink className="w-3 h-3 mr-1" />
          <span>Открыть карточку</span>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;