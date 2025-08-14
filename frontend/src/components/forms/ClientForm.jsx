// src/components/forms/ClientForm.jsx - УНИВЕРСАЛЬНАЯ ВЕРСИЯ
import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { CLIENT_STATUS, STATUS_GROUPS } from '../../constants';
import {
  getStatusLabelsForContext,
  getAvailableStatusesForContext,
  getDefaultStatusForContext
} from '../../utils/statusUtils';

const ClientForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'Сохранить',
  context = STATUS_GROUPS.ALL // 🔧 НОВЫЙ ПРОП: контекст (leads, clients, all)
}) => {
  // 🔧 НОВОЕ: Получаем дефолтные данные в зависимости от контекста
  const getDefaultData = () => {
    const defaultStatus = getDefaultStatusForContext(context);
    return {
      fullName: '',
      email: '',
      phone: '',
      status: defaultStatus
    };
  };

  const [formData, setFormData] = useState(initialData || getDefaultData());
  const [errors, setErrors] = useState({});
  const isSubmittingRef = useRef(false);

  // 🔧 НОВОЕ: Получаем доступные статусы и их лейблы для текущего контекста
  const availableStatuses = getAvailableStatusesForContext(context);
  const statusLabels = getStatusLabelsForContext(context);

  const isFormValid = () => {
    return formData.fullName?.trim() &&
           formData.email?.trim() &&
           formData.phone?.trim();
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Введите ФИО';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Введите телефон';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSubmittingRef.current || loading) {
      console.log('🛑 Форма уже отправляется, игнорируем...');
      return;
    }

    if (validateForm()) {
      console.log('✅ ClientForm валидна, отправляем данные:', { formData, context });
      isSubmittingRef.current = true;

      try {
        onSubmit(formData);
      } catch (error) {
        console.error('❌ Ошибка при вызове onSubmit:', error);
        isSubmittingRef.current = false;
      }

      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 2000);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 🔧 НОВОЕ: Определяем заголовок для статуса в зависимости от контекста
  const getStatusLabel = () => {
    switch (context) {
      case STATUS_GROUPS.LEADS:
        return 'Статус лида';
      case STATUS_GROUPS.CLIENTS:
        return 'Статус клиента';
      default:
        return 'Статус';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ФИО */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ФИО *</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="Иванов Иван Иванович"
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.fullName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="example@email.com"
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      {/* Телефон */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+7 (999) 123-45-67"
          disabled={loading}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      {/* 🔧 ОБНОВЛЕННОЕ: Статус с контекстными опциями */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{getStatusLabel()}</label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status] || status}
            </option>
          ))}
        </select>

        {/* 🔧 НОВОЕ: Подсказка для контекста */}
        {context !== STATUS_GROUPS.ALL && (
          <p className="text-xs text-gray-500 mt-1">
            {context === STATUS_GROUPS.LEADS
              ? 'Показаны только статусы для лидов'
              : 'Показаны только статусы для клиентов'
            }
          </p>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={!isFormValid() || loading || isSubmittingRef.current}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            submitText
          )}
        </button>
      </div>
    </form>
  );
};

export default ClientForm;