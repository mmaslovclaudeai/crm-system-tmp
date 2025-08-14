// src/components/client-card/sections/ClientHeader.jsx
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext.jsx';

const ClientHeader = ({
  onBack,
  onDelete,
  client,
  title = "Карточка клиента"
}) => {
  const { canDelete } = useAuthContext();

  const handleDelete = () => {
    if (onDelete && client) {
      onDelete(client);
    }
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Левая часть - навигация и заголовок */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Вернуться к списку клиентов"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к списку</span>
            </button>

            <div className="h-6 w-px bg-gray-300"></div>

            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>

            {/* Имя клиента, если доступно */}
            {client?.name && (
              <>
                <div className="h-6 w-px bg-gray-300"></div>
                <span className="text-lg text-gray-700">
                  {client.name}
                </span>
              </>
            )}
          </div>

          {/* Правая часть - кнопки действий */}
          <div className="flex items-center space-x-3">
            {canDelete() && (
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                title="Удалить клиента"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientHeader;