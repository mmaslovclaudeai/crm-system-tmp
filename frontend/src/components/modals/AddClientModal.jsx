// src/components/modals/AddClientModal.jsx - ОБНОВЛЕННАЯ ВЕРСИЯ С КОНТЕКСТАМИ
import { useState, useEffect } from 'react';
import { X, Target, Users } from 'lucide-react';
import ClientForm from '../forms/ClientForm';
import { STATUS_GROUPS } from '../../constants';
import { getDefaultStatusForContext } from '../../utils/statusUtils';

const AddClientModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  context = STATUS_GROUPS.ALL // 🔧 НОВЫЙ ПРОП: контекст (leads, clients, all)
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  // 🔧 НОВОЕ: Определяем конфигурацию модального окна в зависимости от контекста
  const getModalConfig = () => {
    switch (context) {
      case STATUS_GROUPS.LEADS:
        return {
          title: 'Добавить лида',
          icon: Target,
          iconColor: 'text-blue-600',
          submitText: 'Добавить лида'
        };
      case STATUS_GROUPS.CLIENTS:
        return {
          title: 'Добавить клиента',
          icon: Users,
          iconColor: 'text-green-600',
          submitText: 'Добавить клиента'
        };
      default:
        return {
          title: 'Добавить запись',
          icon: Users,
          iconColor: 'text-gray-600',
          submitText: 'Добавить запись'
        };
    }
  };

  const config = getModalConfig();
  const IconComponent = config.icon;

  // 🔧 НОВОЕ: Получаем начальные данные с правильным дефолтным статусом
  const getInitialData = () => {
    const defaultStatus = getDefaultStatusForContext(context);
    return {
      fullName: '',
      email: '',
      phone: '',
      status: defaultStatus
    };
  };

  const handleSubmit = async (formData) => {
    console.log('🟢 AddClientModal.handleSubmit - передаем данные наверх:', { formData, context });

    setLoading(true);
    try {
      // Передаем данные в родительский компонент
      onSuccess(formData);
      onClose();
    } catch (error) {
      console.error('❌ Ошибка в AddClientModal:', error);
      onError('Ошибка при обработке данных формы');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <ClientForm
            initialData={getInitialData()}
            onSubmit={handleSubmit}
            onCancel={onClose}
            loading={loading}
            submitText={config.submitText}
            context={context} // 🔧 ПЕРЕДАЕМ КОНТЕКСТ В ФОРМУ
          />
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;