// src/components/client-card/components/StatusBadge.jsx

const StatusBadge = ({
  status,
  size = "sm", // xs, sm, md, lg
  customConfig = null // для кастомных конфигураций статусов
}) => {
  // Дефолтная конфигурация статусов клиентов
  const defaultStatusConfig = {
    'lead': { color: 'bg-blue-100 text-blue-800', label: 'Лид' },
    'client': { color: 'bg-green-100 text-green-800', label: 'Клиент' },
    'in_progress': { color: 'bg-yellow-100 text-yellow-800', label: 'В работе' },
    'blocked': { color: 'bg-red-100 text-red-800', label: 'Заблокирован' },
    'finished': { color: 'bg-gray-100 text-gray-800', label: 'Закончил обучение' }
  };

  // Используем кастомную конфигурацию или дефолтную
  const statusConfig = customConfig || defaultStatusConfig;

  // Размеры бэджа
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  // Получаем конфигурацию статуса
  const config = statusConfig[status] || {
    color: 'bg-gray-100 text-gray-800',
    label: status || 'Неизвестно'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.color} 
        ${sizeClass}
      `}
      title={`Статус: ${config.label}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;