// src/components/modals/AddWorkerModal.jsx - Модальное окно добавления работника
import { useState } from 'react';
import { X, User, Briefcase, Phone, MessageCircle, Building2, CreditCard, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { BANKS, COMMON_POSITIONS } from '../../constants';

const AddWorkerModal = ({ isOpen, onClose, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    telegram_username: '',
    phone: '',
    bank: '',
    card_number: '',
    hire_date: new Date().toISOString().split('T')[0] // Сегодняшняя дата по умолчанию
  });

  const [errors, setErrors] = useState({});

  // Сброс формы при закрытии
  const handleClose = () => {
    setFormData({
      full_name: '',
      position: '',
      telegram_username: '',
      phone: '',
      bank: '',
      card_number: '',
      hire_date: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    onClose();
  };

  // Обработка изменений в полях
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};

    // Обязательные поля
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'ФИО обязательно для заполнения';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'ФИО должно содержать минимум 2 символа';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Должность обязательна для заполнения';
    }

    if (!formData.hire_date) {
      newErrors.hire_date = 'Дата трудоустройства обязательна';
    } else if (new Date(formData.hire_date) > new Date()) {
      newErrors.hire_date = 'Дата трудоустройства не может быть в будущем';
    }

    // Валидация телефона (если заполнен)
    if (formData.phone && !/^7[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Телефон должен быть в формате 79991234567';
    }

    // Валидация Telegram (если заполнен)
    if (formData.telegram_username && !/^@[a-zA-Z0-9_]{4,31}$/.test(formData.telegram_username)) {
      newErrors.telegram_username = 'Telegram должен быть в формате @username';
    }

    // Валидация номера карты (если заполнен)
    if (formData.card_number && !/^[0-9]{16,19}$/.test(formData.card_number.replace(/\s/g, ''))) {
      newErrors.card_number = 'Номер карты должен содержать от 16 до 19 цифр';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Подготавливаем данные для отправки
      const submitData = {
        ...formData,
        full_name: formData.full_name.trim(),
        position: formData.position.trim(),
        telegram_username: formData.telegram_username.trim() || null,
        phone: formData.phone.trim() || null,
        bank: formData.bank.trim() || null,
        card_number: formData.card_number.replace(/\s/g, '') || null
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error('Ошибка создания работника:', error);
    }
  };

  // Форматирование номера карты
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Форматирование телефона
  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned;
    }
    return cleaned.slice(0, 11);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Добавить работника
                  </h3>
                  <p className="text-sm text-gray-500">
                    Заполните информацию о новом работнике
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ФИО */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  ФИО *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Иванов Иван Иванович"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Должность */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Должность *
                </label>
                <input
                  type="text"
                  list="positions"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.position ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Выберите или введите должность"
                />
                <datalist id="positions">
                  {COMMON_POSITIONS.map(position => (
                    <option key={position} value={position} />
                  ))}
                </datalist>
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.position}
                  </p>
                )}
              </div>

              {/* Дата трудоустройства */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Дата трудоустройства *
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleChange('hire_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.hire_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hire_date && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.hire_date}
                  </p>
                )}
              </div>

              {/* Телефон */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="79991234567"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Telegram */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  Telegram
                </label>
                <input
                  type="text"
                  value={formData.telegram_username}
                  onChange={(e) => handleChange('telegram_username', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.telegram_username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="@username"
                />
                {errors.telegram_username && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.telegram_username}
                  </p>
                )}
              </div>

              {/* Банк */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Банк
                </label>
                <input
                  type="text"
                  list="banks"
                  value={formData.bank}
                  onChange={(e) => handleChange('bank', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Выберите или введите банк"
                />
                <datalist id="banks">
                  {BANKS.map(bank => (
                    <option key={bank} value={bank} />
                  ))}
                </datalist>
              </div>

              {/* Номер карты */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Номер карты
                </label>
                <input
                  type="text"
                  value={formatCardNumber(formData.card_number)}
                  onChange={(e) => handleChange('card_number', e.target.value.replace(/\s/g, ''))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono ${
                    errors.card_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1234 5678 9012 3456"
                  maxLength="23" // 19 цифр + 4 пробела
                />
                {errors.card_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.card_number}
                  </p>
                )}
              </div>

              {/* Кнопки */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Создать работника
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWorkerModal;