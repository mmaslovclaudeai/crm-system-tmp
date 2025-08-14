// src/components/forms/FinanceForm.jsx
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, User, Phone, FileText, Tag, DollarSign, Wallet, Loader2 } from 'lucide-react';
import { PAYMENT_STATUS } from '../../constants';

const FinanceForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitText = 'Сохранить',
  showClientPhone = true,
  showDateAndStatus = true,
  showCashDesk = true
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [cashDesks, setCashDesks] = useState([]);
  const [loadingCashDesks, setLoadingCashDesks] = useState(false);

  // Загружаем список касс при монтировании компонента
  useEffect(() => {
    if (showCashDesk) {
      loadCashDesks();
    }
  }, [showCashDesk]);

  // Автоматическое переключение статуса при изменении даты
  useEffect(() => {
    if (showDateAndStatus && formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Сбрасываем время для корректного сравнения

      if (selectedDate > today) {
        // Если дата в будущем - автоматически ставим "План"
        setFormData(prev => ({ ...prev, status: PAYMENT_STATUS.PLANNED }));
      } else {
        // Если дата сегодня или в прошлом - ставим "Факт"
        setFormData(prev => ({ ...prev, status: PAYMENT_STATUS.ACTUAL }));
      }
    }
  }, [formData.date, showDateAndStatus]);

  const loadCashDesks = async () => {
    try {
      setLoadingCashDesks(true);

      // Импортируем API сервис динамически
      const { apiService } = await import('../../services/api');

      // Загружаем только активные кассы
      const response = await apiService.get('/cash-desks?active_only=true');
      setCashDesks(response || []);
    } catch (error) {
      console.error('Ошибка загрузки касс:', error);
    } finally {
      setLoadingCashDesks(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Введите корректную сумму';
    }

    if (showDateAndStatus && !formData.date) {
      newErrors.date = 'Дата обязательна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Тип операции */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Тип операции *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleInputChange('isIncome', true)}
            className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              formData.isIncome
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            disabled={loading}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Доход</span>
          </button>
          <button
            type="button"
            onClick={() => handleInputChange('isIncome', false)}
            className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              !formData.isIncome
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            disabled={loading}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Расход</span>
          </button>
        </div>
      </div>

      {/* Сумма */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Сумма *
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.amount ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="0.00"
            disabled={loading}
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">₽</span>
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
      </div>

      {/* Описание */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Описание *
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Опишите операцию"
            disabled={loading}
          />
        </div>
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Категория */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Категория
        </label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Например: Аренда, Реклама, Зарплата"
            disabled={loading}
          />
        </div>
      </div>

      {/* Касса */}
      {showCashDesk && (
        <div>
          <label htmlFor="cashDeskId" className="block text-sm font-medium text-gray-700 mb-1">
            Касса
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              id="cashDeskId"
              value={formData.cashDeskId}
              onChange={(e) => handleInputChange('cashDeskId', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading || loadingCashDesks}
            >
              <option value="">Выберите кассу (необязательно)</option>
              {cashDesks.map(cashDesk => (
                <option key={cashDesk.id} value={cashDesk.id}>
                  {cashDesk.name} ({Number(cashDesk.current_balance).toLocaleString('ru-RU')} ₽)
                </option>
              ))}
            </select>
          </div>
          {loadingCashDesks && (
            <p className="mt-1 text-sm text-gray-500">Загрузка касс...</p>
          )}
        </div>
      )}

      {/* Номер телефона клиента */}
      {showClientPhone && (
        <div>
          <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Телефон клиента
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              id="clientPhone"
              value={formData.clientPhone}
              onChange={(e) => handleInputChange('clientPhone', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+7 (999) 123-45-67"
              disabled={loading}
            />
          </div>
        </div>
      )}

      {/* Дата и статус */}
      {showDateAndStatus && (
        <>
          {/* Дата */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Дата *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.date ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Статус операции */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус операции
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('status', PAYMENT_STATUS.ACTUAL)}
                className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  formData.status === PAYMENT_STATUS.ACTUAL
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <span>Факт</span>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('status', PAYMENT_STATUS.PLANNED)}
                className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  formData.status === PAYMENT_STATUS.PLANNED
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <span>План</span>
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              💡 Статус автоматически переключается в зависимости от выбранной даты
            </p>
          </div>
        </>
      )}

      {/* Кнопки */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center ${
            formData.isIncome
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
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

export default FinanceForm;