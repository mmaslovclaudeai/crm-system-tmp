import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../../constants';

// Импортируем все UI компоненты
import IncomeExpenseSlider from '../ui/IncomeExpenseSlider';
import ActualPlannedSlider from '../ui/ActualPlannedSlider';
import IosToggleFirst from '../ui/IosToggleFirst';
import IosToggleSecond from '../ui/IosToggleSecond';
import InputField from '../ui/InputField';
import DropdownField from '../ui/DropdownField';
import DatePicker from '../ui/DatePicker';
import ActionButton from '../ui/ActionButton';
import CancelButton from '../ui/CancelButton';

// Импортируем AuthContext для правильного получения токена
import { useAuthContext } from '../../context/AuthContext';

const AddFinanceModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  // Получаем функцию для формирования заголовков авторизации
  const { getAuthHeader } = useAuthContext();

  // Состояния формы
  const [formData, setFormData] = useState({
    type: 'income', // income/expense
    status: 'actual', // actual/planned
    isTransfer: false,
    isSalary: false,
    amount: '',
    category: '',
    email: '',
    employee: '', // сотрудник для зарплаты
    cashDesk: '',
    cashDeskFrom: '', // касса отправитель
    cashDeskTo: '', // касса получатель
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [buttonState, setButtonState] = useState('inactive');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Опции для выпадающих списков - получаем из API
  const [cashDeskOptions, setCashDeskOptions] = useState([]);

  // Загружаем список касс при открытии модалки
  useEffect(() => {
    const loadCashDesks = async () => {
      try {
        // 🔧 ЛУЧШЕЕ РЕШЕНИЕ: Используем AuthContext для получения заголовков
        const authHeaders = await getAuthHeader();
        console.log('🔍 Auth headers:', authHeaders);

        if (!authHeaders.Authorization) {
          console.warn('⚠️ Токен авторизации недоступен');
          // Используем fallback данные при отсутствии токена
          setCashDeskOptions([
            { value: '1', label: 'Основная касса' },
            { value: '2', label: 'Касса №2' },
            { value: '3', label: 'Наличные' },
            { value: '4', label: 'Банковская карта' },
            { value: '5', label: 'Онлайн касса' },
            { value: '6', label: 'Резервная касса' }
          ]);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/cash-desks`, {
          method: 'GET',
          headers: authHeaders
        });

        console.log('🔍 API response status:', response.status);

        if (response.ok) {
          const cashDesks = await response.json();
          console.log('✅ Кассы загружены:', cashDesks);

          const options = cashDesks.map(desk => ({
            value: desk.id.toString(),
            label: desk.name
          }));
          setCashDeskOptions(options);
        } else {
          const errorText = await response.text();
          console.error('❌ Ошибка API:', response.status, errorText);
          
          // Если токен недействителен, логируем ошибку
          if (response.status === 403) {
            console.error('❌ Токен недействителен, используем fallback данные');
            // Не делаем редирект, используем fallback данные
          }
          
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки касс:', error);
        // Fallback данные при ошибке API
        setCashDeskOptions([
          { value: '1', label: 'Основная касса' },
          { value: '2', label: 'Касса №2' },
          { value: '3', label: 'Наличные' },
          { value: '4', label: 'Банковская карта' },
          { value: '5', label: 'Онлайн касса' },
          { value: '6', label: 'Резервная касса' }
        ]);
      }
    };

    if (isOpen) {
      loadCashDesks();
    }
  }, [isOpen]); // Убрали getAuthHeader из зависимостей

  // Проверяем валидность формы и обновляем состояние кнопки
  useEffect(() => {
    let isFormValid = false;

    if (formData.isTransfer) {
      // Для перевода между кассами нужны: касса отправитель, касса получатель, сумма, дата
      isFormValid = formData.cashDeskFrom &&
                   formData.cashDeskTo &&
                   formData.amount &&
                   formData.date;
    } else if (formData.isSalary) {
      // Для зарплаты нужны: сотрудник, касса, сумма, дата
      isFormValid = formData.employee &&
                   formData.cashDesk &&
                   formData.amount &&
                   formData.date;
    } else {
      // Для обычной операции нужны: сумма, категория, касса, дата
      isFormValid = formData.amount &&
                   formData.category &&
                   formData.cashDesk &&
                   formData.date;
    }

    if (loading) {
      setButtonState('loading');
    } else if (isFormValid) {
      setButtonState('active');
    } else {
      setButtonState('inactive');
    }
  }, [formData, loading]);

  const handleInputChange = (field, value) => {
    // Взаимоисключающая логика для переключателей
    if (field === 'isTransfer' && value === true) {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        isSalary: false // деактивируем зарплату при активации перевода
      }));
    } else if (field === 'isSalary' && value === true) {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        isTransfer: false // деактивируем перевод при активации зарплаты
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Введите корректную сумму';
    }

    if (formData.isTransfer) {
      // Валидация для перевода между кассами
      if (!formData.cashDeskFrom) {
        newErrors.cashDeskFrom = 'Выберите кассу отправителя';
      }

      if (!formData.cashDeskTo) {
        newErrors.cashDeskTo = 'Выберите кассу получателя';
      }

      if (formData.cashDeskFrom === formData.cashDeskTo && formData.cashDeskFrom) {
        newErrors.cashDeskTo = 'Касса получатель должна отличаться от кассы отправителя';
      }
    } else if (formData.isSalary) {
      // Валидация для зарплаты
      if (!formData.employee.trim()) {
        newErrors.employee = 'Укажите сотрудника';
      }

      if (!formData.cashDesk) {
        newErrors.cashDesk = 'Выберите кассу';
      }
    } else {
      // Валидация для обычной операции
      if (!formData.category.trim()) {
        newErrors.category = 'Категория обязательна';
      }

      if (!formData.cashDesk) {
        newErrors.cashDesk = 'Выберите кассу';
      }
    }

    if (!formData.date) {
      newErrors.date = 'Дата обязательна';
    }

    // Описание больше не обязательно - убрали проверку

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (buttonState === 'inactive' || loading) return;

    if (!validateForm()) {
      setButtonState('error');
      setTimeout(() => setButtonState('active'), 2000);
      return;
    }

    try {
      setLoading(true);
      setButtonState('loading');

      // Подготавливаем данные для отправки
      let submitData = {};

      if (formData.isTransfer) {
        // 🆕 НОВЫЕ ДАННЫЕ: для эндпоинта /api/finances/transfer
        submitData = {
          isTransfer: true, // флаг для App.jsx чтобы понять что это transfer
          amount: Math.abs(Number(formData.amount)),
          cashDeskFromId: Number(formData.cashDeskFrom), // используем числовые ID
          cashDeskToId: Number(formData.cashDeskTo),
          date: formData.date,
          description: formData.description || 'Перевод между кассами'
        };
      } else if (formData.isSalary) {
        // Данные для зарплатной операции (без изменений)
        submitData = {
          type: 'expense',
          status: formData.status,
          amount: Math.abs(Number(formData.amount)),
          employee: formData.employee,
          cash_desk_id: Number(formData.cashDesk),
          date: formData.date,
          description: formData.description,
          category: 'Зарплата'
        };
      } else {
        // Обычная финансовая операция (без изменений)
        submitData = {
          type: formData.type,
          status: formData.status,
          amount: Math.abs(Number(formData.amount)),
          category: formData.category,
          cash_desk_id: Number(formData.cashDesk),
          date: formData.date,
          description: formData.description
        };

        // Добавляем email только если он заполнен
        if (formData.email && formData.email.trim()) {
          submitData.email = formData.email.trim();
        }
      }

      console.log('🔍 Отправляемые данные:', submitData);

      // Передаем данные родительскому компоненту
      await onSuccess?.(submitData);

      setButtonState('success');
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error) {
      console.error('❌ Ошибка при создании операции:', error);
      setButtonState('error');
      onError?.(error.message || 'Ошибка при создании операции');

      // Возвращаем в активное состояние через 2 секунды
      setTimeout(() => {
        if (validateForm()) {
          setButtonState('active');
        } else {
          setButtonState('inactive');
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'income',
      status: 'actual',
      isTransfer: false,
      isSalary: false,
      amount: '',
      category: '',
      email: '',
      employee: '',
      cashDesk: '',
      cashDeskFrom: '',
      cashDeskTo: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setCashDeskOptions([]); // Очищаем загруженные кассы
    setButtonState('inactive');
    setErrors({});
    setLoading(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-450 max-w-5xl max-h-[90vh] overflow-y-auto">

        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2
            className="text-2xl font-semibold text-gray-800"
            style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}
          >
            Добавить операцию
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Содержимое модалки */}
        <div className="p-8 space-y-8">

          {/* iOS Toggles - вертикально друг под другом как на скрине */}
          <div className="flex flex-col gap-4">
            <IosToggleFirst
              value={formData.isTransfer}
              onChange={(value) => handleInputChange('isTransfer', value)}
              disabled={loading}
            />
            <IosToggleSecond
              value={formData.isSalary}
              onChange={(value) => handleInputChange('isSalary', value)}
              disabled={loading}
            />
          </div>

          {/* Переключатель Доход/Расход - скрываем при переводе между кассами И при зарплате */}
          {!formData.isTransfer && !formData.isSalary && (
            <IncomeExpenseSlider
              value={formData.type}
              onChange={(value) => handleInputChange('type', value)}
              disabled={loading}
            />
          )}

          {/* Переключатель Факт/План - скрываем при переводе между кассами, показываем для зарплаты */}
          {!formData.isTransfer && (
            <ActualPlannedSlider
              value={formData.status}
              onChange={(value) => handleInputChange('status', value)}
              disabled={loading}
            />
          )}

          {/* Поля для перевода между кассами */}
          {formData.isTransfer ? (
            <>
              <div className="flex justify-center">
                <DropdownField
                  label="Касса отправитель"
                  placeholder="Выберите кассу отправителя"
                  value={formData.cashDeskFrom}
                  onChange={(value) => handleInputChange('cashDeskFrom', value)}
                  options={cashDeskOptions}
                  disabled={loading}
                  error={errors.cashDeskFrom}
                />
              </div>

              <div className="flex justify-center">
                <DropdownField
                  label="Касса получатель"
                  placeholder="Выберите кассу получателя"
                  value={formData.cashDeskTo}
                  onChange={(value) => handleInputChange('cashDeskTo', value)}
                  options={cashDeskOptions}
                  disabled={loading}
                  error={errors.cashDeskTo}
                />
              </div>

              <div className="flex justify-center">
                <InputField
                  label="Сумма"
                  placeholder="Введите сумму"
                  type="number"
                  value={formData.amount}
                  onChange={(value) => handleInputChange('amount', value)}
                  disabled={loading}
                  error={errors.amount}
                />
              </div>

              <div className="flex justify-center">
                <DatePicker
                  label="Дата"
                  value={formData.date}
                  onChange={(value) => handleInputChange('date', value)}
                  disabled={loading}
                  error={errors.date}
                />
              </div>

              <div className="flex justify-center">
                <InputField
                  label="Описание"
                  placeholder="Введите описание перевода"
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  disabled={loading}
                  error={errors.description}
                />
              </div>
            </>
          ) : formData.isSalary ? (
            /* Поля для зарплаты */
            <>
              <div className="flex justify-center">
                <InputField
                  label="Telegram ID"
                  placeholder="@username"
                  value={formData.employee}
                  onChange={(value) => handleInputChange('employee', value)}
                  disabled={loading}
                  error={errors.employee}
                />
              </div>

              <div className="flex justify-center">
                <DropdownField
                  label="Касса"
                  placeholder="Выберите кассу"
                  value={formData.cashDesk}
                  onChange={(value) => handleInputChange('cashDesk', value)}
                  options={cashDeskOptions}
                  disabled={loading}
                  error={errors.cashDesk}
                />
              </div>

              <div className="flex justify-center">
                <InputField
                  label="Сумма"
                  placeholder="Введите сумму зарплаты"
                  type="number"
                  value={formData.amount}
                  onChange={(value) => handleInputChange('amount', value)}
                  disabled={loading}
                  error={errors.amount}
                />
              </div>

              <div className="flex justify-center">
                <DatePicker
                  label="Дата"
                  value={formData.date}
                  onChange={(value) => handleInputChange('date', value)}
                  disabled={loading}
                  error={errors.date}
                />
              </div>

              <div className="flex justify-center">
                <InputField
                  label="Описание"
                  placeholder="Дополнительное описание"
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  disabled={loading}
                  error={errors.description}
                />
              </div>
            </>
          ) : (
            /* Поля для обычных операций */
            <>
              <div className="flex justify-center">
                <InputField
                  label="Категория"
                  placeholder="Введите категорию"
                  value={formData.category}
                  onChange={(value) => handleInputChange('category', value)}
                  disabled={loading}
                  error={errors.category}
                />
              </div>

              <div className="flex justify-center">
                <InputField
                  label="Почта"
                  placeholder="example@email.ru"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  disabled={loading}
                  error={errors.email}
                />
              </div>

              <div className="flex justify-center">
                <DropdownField
                  label="Касса"
                  placeholder="Выберите кассу"
                  value={formData.cashDesk}
                  onChange={(value) => handleInputChange('cashDesk', value)}
                  options={cashDeskOptions}
                  disabled={loading}
                  error={errors.cashDesk}
                />
              </div>

              <div className="flex justify-center">
                <InputField
                  label="Сумма"
                  placeholder="Введите сумму"
                  type="number"
                  value={formData.amount}
                  onChange={(value) => handleInputChange('amount', value)}
                  disabled={loading}
                  error={errors.amount}
                />
              </div>

              <div className="flex justify-center">
                <DatePicker
                  label="Дата"
                  value={formData.date}
                  onChange={(value) => handleInputChange('date', value)}
                  disabled={loading}
                  error={errors.date}
                />
              </div>

              <div className="flex justify-center">
                <InputField
                  label="Описание"
                  placeholder="Введите описание операции"
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  disabled={loading}
                  error={errors.description}
                />
              </div>
            </>
          )}

          {/* Кнопки */}
          <div className="flex justify-center gap-12">
            <CancelButton
              onClick={handleClose}
              disabled={loading}
            />

            <ActionButton
              state={buttonState}
              onClick={handleSubmit}
              text="Добавить"
              loadingText="Отправка..."
              successText="Успешно!"
              errorText="Повторить"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFinanceModal;