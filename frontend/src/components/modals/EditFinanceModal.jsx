import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../../constants';

// Импортируем все UI компоненты
import IncomeExpenseSlider from '../ui/IncomeExpenseSlider';
import ActualPlannedSlider from '../ui/ActualPlannedSlider';
import InputField from '../ui/InputField';
import DropdownField from '../ui/DropdownField';
import DatePicker from '../ui/DatePicker';
import ActionButton from '../ui/ActionButton';
import CancelButton from '../ui/CancelButton';

// Импортируем AuthContext для правильного получения токена
import { useAuthContext } from '../../context/AuthContext';

const EditFinanceModal = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  finance
}) => {
  // Получаем функцию для формирования заголовков авторизации
  const { getAuthHeader } = useAuthContext();

  // Определяем тип операции (зарплата или обычная)
  const isSalary = finance?.category === 'Зарплата';

  // Состояния формы
  const [formData, setFormData] = useState({
    type: 'income', // income/expense (только для обычных операций)
    status: 'actual', // actual/planned
    amount: '',
    category: '',
    email: '',
    employee: '', // сотрудник для зарплаты (TelegramID)
    cashDesk: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [buttonState, setButtonState] = useState('inactive');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Опции для выпадающих списков - получаем из API
  const [cashDeskOptions, setCashDeskOptions] = useState([]);

  // Загружаем дополнительные данные при открытии модалки
  useEffect(() => {
    const loadAdditionalData = async () => {
      if (!isOpen || !finance) return;

      console.log('🔍 Инициализация формы с данными:', finance);
      console.log('🔍 client_id:', finance.client_id);
      console.log('🔍 worker_id:', finance.worker_id);
      console.log('🔍 category:', finance.category);
      
      let clientEmail = '';
      let workerTelegram = '';

      try {
        const authHeaders = await getAuthHeader();
        console.log('🔍 Auth headers available:', !!authHeaders.Authorization);

        // Получаем email клиента, если есть client_id
        if (finance.client_id) {
          console.log('🔄 Загружаем клиента с ID:', finance.client_id);
          
          if (!authHeaders.Authorization) {
            console.error('❌ Нет токена авторизации для загрузки клиента');
          } else {
            try {
                          const clientResponse = await fetch(`${API_BASE_URL}/clients/${finance.client_id}`, {
              headers: authHeaders
            });
              console.log('🔍 Client response status:', clientResponse.status);
              
              if (clientResponse.ok) {
                const clientResult = await clientResponse.json();
                console.log('🔍 Client response data:', clientResult);
                // 🔧 ИСПРАВЛЕНИЕ: API возвращает данные в корне, а не в data
                clientEmail = clientResult.email || '';
                console.log('✅ Email клиента загружен:', clientEmail);
              } else {
                const errorText = await clientResponse.text();
                console.error('❌ Client API error:', clientResponse.status, errorText);
              }
            } catch (error) {
              console.warn('⚠️ Не удалось загрузить email клиента:', error);
            }
          }
        } else {
          console.log('⚠️ client_id отсутствует в объекте finance');
        }

        // Получаем telegram работника, если есть worker_id
        if (finance.worker_id) {
          console.log('🔄 Загружаем работника с ID:', finance.worker_id);
          
          if (!authHeaders.Authorization) {
            console.error('❌ Нет токена авторизации для загрузки работника');
          } else {
            try {
                          const workerResponse = await fetch(`${API_BASE_URL}/workers/${finance.worker_id}`, {
              headers: authHeaders
            });
              console.log('🔍 Worker response status:', workerResponse.status);
              
              if (workerResponse.ok) {
                const workerResult = await workerResponse.json();
                console.log('🔍 Worker response data:', workerResult);
                // 🔧 ИСПРАВЛЕНИЕ: API возвращает данные в корне, а не в data
                workerTelegram = workerResult.telegram_username || '';
                console.log('✅ Telegram работника загружен:', workerTelegram);
              } else {
                const errorText = await workerResponse.text();
                console.error('❌ Worker API error:', workerResponse.status, errorText);
              }
            } catch (error) {
              console.warn('⚠️ Не удалось загрузить telegram работника:', error);
            }
          }
        } else {
          console.log('⚠️ worker_id отсутствует в объекте finance');
        }
      } catch (error) {
        console.warn('⚠️ Ошибка при загрузке дополнительных данных:', error);
      }

      // Инициализируем форму с загруженными данными
      setFormData({
        type: Number(finance.amount) >= 0 ? 'income' : 'expense',
        status: finance.status || 'actual',
        amount: Math.abs(Number(finance.amount)).toString(),
        category: finance.category || '',
        email: clientEmail,
        employee: workerTelegram,
        cashDesk: finance.cash_desk_id?.toString() || finance.cashDeskId?.toString() || '',
        date: finance.date ? finance.date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: finance.description || ''
      });
      
      console.log('✅ Форма инициализирована:', {
        email: clientEmail,
        employee: workerTelegram,
        category: finance.category,
        client_id: finance.client_id,
        worker_id: finance.worker_id,
        formData: {
          email: clientEmail,
          employee: workerTelegram
        }
      });
    };

    loadAdditionalData();
  }, [isOpen, finance]); // Убрали getAuthHeader из зависимостей

  // Загружаем список касс при открытии модалки
  useEffect(() => {
    const loadCashDesks = async () => {
      try {
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

    if (isSalary) {
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
  }, [formData, loading, isSalary]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

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

    if (isSalary) {
      // Валидация для зарплаты
      if (!formData.employee.trim()) {
        newErrors.employee = 'Укажите Telegram ID сотрудника';
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

      const authHeaders = await getAuthHeader();

      // 🆕 НОВОЕ: Поиск ID клиента и работника перед отправкой
      let finalClientId = null;
      let finalWorkerId = null;

      // Ищем клиента по email (если указан email)
      if (formData.email && formData.email.trim()) {
        console.log('🔍 Поиск клиента по email:', formData.email);
        // 🔧 ИСПРАВЛЕНИЕ: Указываем filter=email для поиска по email полю
        const searchUrl = `${API_BASE_URL}/clients?search=${encodeURIComponent(formData.email)}&filter=email`;
        console.log('🔍 Search URL:', searchUrl);
        
        try {
          const clientsResponse = await fetch(searchUrl, {
            headers: authHeaders
          });
          
          console.log('🔍 Clients search response status:', clientsResponse.status);
          
          if (clientsResponse.ok) {
            const clientsResult = await clientsResponse.json();
            console.log('🔍 Clients search result (RAW):', clientsResult);
            
            // Извлекаем данные клиентов из ответа
            const clientsData = clientsResult.data || clientsResult;
            console.log('🔍 Final clients data array:', clientsData);
            
            if (Array.isArray(clientsData) && clientsData.length > 0) {
              console.log('🔍 All found clients:', clientsData.map(c => ({ 
                id: c.id, 
                email: c.email, 
                name: c.name 
              })));
              
              // Ищем точное совпадение по email
              const foundClient = clientsData.find(client => {
                const clientEmail = client.email?.toLowerCase?.();
                const searchEmail = formData.email.toLowerCase();
                console.log('🔍 Comparing emails:', { clientEmail, searchEmail, match: clientEmail === searchEmail });
                return clientEmail === searchEmail;
              });
              
              if (foundClient) {
                finalClientId = foundClient.id;
                console.log('✅ Клиент найден по email:', { 
                  email: formData.email, 
                  clientId: finalClientId, 
                  clientName: foundClient.name 
                });
              } else {
                console.log('⚠️ Клиент с точным email не найден в результатах поиска');
              }
            } else {
              console.log('⚠️ Нет клиентов в ответе');
            }
          } else {
            const errorText = await clientsResponse.text();
            console.error('❌ Clients search API error:', clientsResponse.status, errorText);
          }
        } catch (error) {
          console.warn('⚠️ Ошибка поиска клиента:', error);
        }
      } else {
        console.log('⚠️ Email не указан или пустой:', formData.email);
      }

      // Ищем работника по telegram (если указан employee для зарплаты)
      if (isSalary && formData.employee && formData.employee.trim()) {
        console.log('🔍 Поиск работника по telegram:', formData.employee);
        // 🔧 ИСПРАВЛЕНИЕ: Указываем filter=telegram для поиска по telegram полю
        const searchUrl = `${API_BASE_URL}/workers?search=${encodeURIComponent(formData.employee)}&filter=telegram`;
        console.log('🔍 Worker search URL:', searchUrl);
        
        try {
          const workersResponse = await fetch(searchUrl, {
            headers: authHeaders
          });
          
          console.log('🔍 Workers search response status:', workersResponse.status);
          
          if (workersResponse.ok) {
            const workersResult = await workersResponse.json();
            console.log('🔍 Workers search result (RAW):', workersResult);
            
            const workersData = workersResult.data || workersResult;
            
            if (Array.isArray(workersData) && workersData.length > 0) {
              console.log('🔍 All found workers:', workersData.map(w => ({ 
                id: w.id, 
                telegram_username: w.telegram_username, 
                full_name: w.full_name 
              })));
              
              const foundWorker = workersData.find(worker => {
                if (!worker.telegram_username) return false;
                
                const cleanWorkerTelegram = worker.telegram_username.replace(/^@/, '').toLowerCase();
                const cleanSearchTelegram = formData.employee.replace(/^@/, '').toLowerCase();
                
                console.log('🔍 Comparing telegrams:', { 
                  workerTelegram: cleanWorkerTelegram, 
                  searchTelegram: cleanSearchTelegram, 
                  match: cleanWorkerTelegram === cleanSearchTelegram 
                });
                
                return cleanWorkerTelegram === cleanSearchTelegram;
              });
              
              if (foundWorker) {
                finalWorkerId = foundWorker.id;
                console.log('✅ Работник найден по telegram:', { 
                  employee: formData.employee, 
                  workerId: finalWorkerId,
                  workerName: foundWorker.full_name
                });
              } else {
                console.log('⚠️ Работник с точным telegram не найден в результатах поиска');
              }
            } else {
              console.log('⚠️ Нет работников в ответе');
            }
          } else {
            const errorText = await workersResponse.text();
            console.error('❌ Workers search API error:', workersResponse.status, errorText);
          }
        } catch (error) {
          console.warn('⚠️ Ошибка поиска работника:', error);
        }
      }

      console.log('🔍 Финальные найденные ID:', { finalClientId, finalWorkerId });

      // Подготавливаем данные для отправки
      let submitData = {};

      if (isSalary) {
        // Данные для зарплатной операции
        submitData = {
          type: 'expense', // Зарплата всегда расход
          status: formData.status,
          amount: Math.abs(Number(formData.amount)),
          cash_desk_id: Number(formData.cashDesk),
          cashDeskId: Number(formData.cashDesk), // 🔧 Дублируем для App.jsx
          date: formData.date,
          description: formData.description,
          category: 'Зарплата'
        };

        // Добавляем worker_id только если нашли работника
        if (finalWorkerId) {
          submitData.worker_id = finalWorkerId;
          submitData.workerId = finalWorkerId; // 🔧 Дублируем для App.jsx
          console.log('✅ Добавлен worker_id в данные:', finalWorkerId);
        }
      } else {
        // Обычная финансовая операция
        submitData = {
          type: formData.type,
          status: formData.status,
          amount: Math.abs(Number(formData.amount)),
          category: formData.category,
          cash_desk_id: Number(formData.cashDesk),
          date: formData.date,
          description: formData.description
        };

        // Добавляем client_id только если нашли клиента
        if (finalClientId) {
          submitData.client_id = finalClientId;
          console.log('✅ Добавлен client_id в данные:', finalClientId);
        }
      }

      console.log('🔍 Отправляемые данные для редактирования:', submitData);
      console.log('🔍 submitData.client_id:', submitData.client_id);
      console.log('🔍 Полная структура submitData:', JSON.stringify(submitData, null, 2));

      // Передаем данные родительскому компоненту
      await onSuccess?.(submitData);

      setButtonState('success');
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error) {
      console.error('❌ Ошибка при редактировании операции:', error);
      setButtonState('error');
      onError?.(error.message || 'Ошибка при редактировании операции');

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
      amount: '',
      category: '',
      email: '',
      employee: '',
      cashDesk: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setCashDeskOptions([]); // Очищаем загруженные кассы
    setButtonState('inactive');
    setErrors({});
    setLoading(false);
    onClose?.();
  };

  if (!isOpen || !finance) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2
            className="text-2xl font-semibold text-gray-800"
            style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}
          >
            Редактировать
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

          {/* Переключатель Доход/Расход - показываем только для обычных операций */}
          {!isSalary && (
            <IncomeExpenseSlider
              value={formData.type}
              onChange={(value) => handleInputChange('type', value)}
              disabled={loading}
            />
          )}

          {/* Переключатель Факт/План */}
          <ActualPlannedSlider
            value={formData.status}
            onChange={(value) => handleInputChange('status', value)}
            disabled={loading}
          />

          {/* Поля для зарплаты */}
          {isSalary ? (
            <>
              <div className="flex justify-center">
                <InputField
                  label="TelegramID"
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
                  placeholder="Введите описание"
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
                  placeholder="Введите почту"
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
                  placeholder="Введите описание"
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
              text="Сохранить"
              loadingText="Сохранение..."
              successText="Сохранено!"
              errorText="Повторить"
              disabled={loading}
            />
          </div>

          {/* Информация об операции */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Информация об операции:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>ID: {finance.id}</div>
              <div>Создана: {new Date(finance.created_at).toLocaleDateString('ru-RU')}</div>
              {finance.updated_at && finance.updated_at !== finance.created_at && (
                <div>Изменена: {new Date(finance.updated_at).toLocaleDateString('ru-RU')}</div>
              )}
              {finance.cash_desk_name && (
                <div>Текущая касса: {finance.cash_desk_name}</div>
              )}
              {finance.client_name && (
                <div>Текущий клиент: {finance.client_name}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFinanceModal;
