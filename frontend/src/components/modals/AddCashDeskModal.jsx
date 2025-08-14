// src/components/modals/AddCashDeskModal.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState } from 'react';
import { X, Wallet, Loader2, DollarSign } from 'lucide-react';

const AddCashDeskModal = ({ isOpen, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    current_balance: '0',
    description: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Валидация
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название кассы обязательно';
    }

    if (isNaN(formData.current_balance) || Number(formData.current_balance) < 0) {
      newErrors.current_balance = 'Начальный баланс должен быть положительным числом';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const cashDeskData = {
        name: formData.name.trim(),
        current_balance: parseFloat(formData.current_balance),
        description: formData.description.trim(),
        is_active: formData.is_active
      };

      // 🔧 ИСПРАВЛЕНИЕ: Передаем данные через onSuccess вместо прямого API вызова
      // НЕ делаем await apiService.post('/cash-desks', cashDeskData);
      // Вместо этого передаем данные в родительский компонент
      await onSuccess(cashDeskData);

      handleClose();
    } catch (error) {
      console.error('Ошибка создания кассы:', error);

      if (error.message?.includes('уже существует')) {
        setErrors({ name: 'Касса с таким названием уже существует' });
      } else {
        onError(error.message || 'Ошибка при создании кассы');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      current_balance: '0',
      description: '',
      is_active: true
    });
    setErrors({});
    setLoading(false);
    onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Создать кассу</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Название */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Название кассы *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Введите название кассы"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Начальный баланс */}
          <div>
            <label htmlFor="current_balance" className="block text-sm font-medium text-gray-700 mb-1">
              Начальный баланс
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="number"
                id="current_balance"
                value={formData.current_balance}
                onChange={(e) => handleInputChange('current_balance', e.target.value)}
                step="0.01"
                min="0"
                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.current_balance ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            {errors.current_balance && (
              <p className="mt-1 text-sm text-red-600">{errors.current_balance}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Опишите назначение кассы (необязательно)"
              disabled={loading}
            />
          </div>

          {/* Активность */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Активная касса
            </label>
          </div>

          {/* Кнопки */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Создание...
                </>
              ) : (
                'Создать кассу'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCashDeskModal;