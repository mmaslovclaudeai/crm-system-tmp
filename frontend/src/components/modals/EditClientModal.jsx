// src/components/modals/EditClientModal.jsx - ОБНОВЛЕННАЯ ВЕРСИЯ С ПОДДЕРЖКОЙ ВСЕХ СТАТУСОВ
import { useState, useEffect } from 'react';
import { X, Target, Users, Edit3 } from 'lucide-react';
import ClientForm from '../forms/ClientForm';
import { STATUS_GROUPS } from '../../constants';
import { getStatusGroup, getRecordTypeName } from '../../utils/statusUtils';

const EditClientModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  client
}) => {
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(0);

  // 🔧 ИСПРАВЛЕНО: Теперь всегда используем context = ALL для редактирования
  // Это позволяет выбирать любой статус, включая перевод лидов в клиенты
  const context = STATUS_GROUPS.ALL;
  const recordType = client ? getRecordTypeName(client.status) : 'Запись';

  // 🔧 ОБНОВЛЕНО: Определяем конфигурацию модального окна в зависимости от типа записи
  const getModalConfig = () => {
    if (!client) {
      return {
        title: 'Редактировать запись',
        icon: Edit3,
        iconColor: 'text-gray-600',
        submitText: 'Сохранить изменения'
      };
    }

    const statusGroup = getStatusGroup(client.status);

    switch (statusGroup) {
      case 'lead':
        return {
          title: `Редактировать лида`,
          subtitle: 'Можно перевести в статус клиента',
          icon: Target,
          iconColor: 'text-blue-600',
          submitText: 'Сохранить изменения'
        };
      case 'client':
        return {
          title: `Редактировать клиента`,
          subtitle: 'Можно изменить статус обучения',
          icon: Users,
          iconColor: 'text-green-600',
          submitText: 'Сохранить изменения'
        };
      default:
        return {
          title: 'Редактировать запись',
          subtitle: 'Можно выбрать любой статус',
          icon: Edit3,
          iconColor: 'text-gray-600',
          submitText: 'Сохранить изменения'
        };
    }
  };

  const config = getModalConfig();
  const IconComponent = config.icon;

  // Подготовка данных для формы
  const getInitialData = () => {
    if (!client) {
      return {
        fullName: '',
        email: '',
        phone: '',
        status: 'CREATED'
      };
    }

    return {
      fullName: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      status: client.status || 'CREATED'
    };
  };

  // Обработка сохранения
  const handleSave = async (formData) => {
    setLoading(true);
    try {
      console.log('🔄 Сохранение клиента:', { id: client.id, formData });

      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('crm_access_token')}`
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сохранении');
      }

      const updatedClient = await response.json();
      console.log('✅ Клиент обновлен:', updatedClient);

      onSuccess(updatedClient, `${recordType} успешно обновлен`);
      onClose();
    } catch (error) {
      console.error('❌ Ошибка при обновлении клиента:', error);
      onError(`Ошибка при обновлении: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Сброс формы при смене клиента
  useEffect(() => {
    if (isOpen && client) {
      setKey(prev => prev + 1);
    }
  }, [isOpen, client?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gray-100 ${config.iconColor}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {config.title}
              </h3>
              {config.subtitle && (
                <p className="text-sm text-gray-500 mt-1">
                  {config.subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Форма */}
        <div className="p-6">
          <ClientForm
            key={key}
            initialData={getInitialData()}
            onSubmit={handleSave}
            onCancel={onClose}
            loading={loading}
            submitText={config.submitText}
            context={context} // 🔧 ВАЖНО: Используем STATUS_GROUPS.ALL для доступа ко всем статусам
          />
        </div>

        {/* 🆕 НОВОЕ: Информационное сообщение о возможностях */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-medium">💡</span>
                </div>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Подсказка:</p>
                <ul className="text-xs space-y-1">
                  <li>• Можно изменить любой статус</li>
                  <li>• Лидов можно переводить в клиенты</li>
                  <li>• Клиенты могут менять статус обучения</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClientModal;
