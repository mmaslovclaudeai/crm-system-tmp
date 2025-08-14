// src/components/WorkerCard.jsx - Карточка работника с inline редактированием
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  MessageCircle,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  Check,
  Loader2,
  Save,
  X,
  Eye,
  EyeOff,
  Briefcase,
  Building2,
  DollarSign,
  BarChart3,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { BANKS, COMMON_POSITIONS } from '../constants';

const WorkerCard = ({
  workerId,
  onBack,
  onEdit,
  onDelete,
  onError,
  onSuccess,
  workersService, // Передаем сервис как пропс
  financesService // Передаем сервис как пропс
}) => {
  const { user, canDelete, canEdit } = useAuthContext();

  // Основные данные
  const [worker, setWorker] = useState(null);
  const [workerFinances, setWorkerFinances] = useState([]);
  const [workerStats, setWorkerStats] = useState({
    totalTransactions: 0,
    totalSalaryPaid: 0,
    totalIncomeBrought: 0,
    workMonths: 0,
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Состояния редактирования
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingContacts, setEditingContacts] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  // Состояние показа номера карты
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);

  // Данные для редактирования
  const [basicFormData, setBasicFormData] = useState({
    full_name: '',
    position: '',
    hire_date: '',
    fire_date: '',
    is_active: true
  });

  const [contactsFormData, setContactsFormData] = useState({
    phone: '',
    telegram_username: ''
  });

  const [bankFormData, setBankFormData] = useState({
    bank: '',
    card_number: ''
  });

  // Загрузка данных работника при монтировании
  // useEffect(() => {
  //   if (workerId && workersService) {
  //     loadWorkerData();
  //   }
  // }, [workerId, workersService]);

  // Загрузка данных работника при монтировании
  useEffect(() => {
    // Простая проверка на наличие workerId
    if (!workerId || !workersService) return;

    const loadWorkerData = async () => {
      setLoading(true);
      try {
        // Загружаем основные данные работника
        const workerData = await workersService.fetchWorkerById(workerId);
        setWorker(workerData);

        // Заполняем формы данными работника
        setBasicFormData({
          full_name: workerData.full_name || '',
          position: workerData.position || '',
          hire_date: workerData.hire_date || '',
          fire_date: workerData.fire_date || '',
          is_active: workerData.is_active
        });

        setContactsFormData({
          phone: workerData.phone || '',
          telegram_username: workerData.telegram_username || ''
        });

        setBankFormData({
          bank: workerData.bank || '',
          card_number: workerData.card_number || ''
        });

        // Загружаем финансовые операции работника
        if (financesService && financesService.getWorkerFinances) {
          try {
            const financesData = await financesService.getWorkerFinances(workerId);
            setWorkerFinances(Array.isArray(financesData) ? financesData : []);
          } catch (error) {
            console.warn('Не удалось загрузить финансы работника:', error);
            setWorkerFinances([]);
          }
        }

        // Загружаем статистику работника
        try {
          const statsData = await workersService.fetchWorkerStats(workerId);
          setWorkerStats(statsData || {
            totalTransactions: 0,
            totalSalaryPaid: 0,
            totalIncomeBrought: 0,
            workMonths: 0,
            monthlyStats: []
          });
        } catch (error) {
          console.warn('Не удалось загрузить статистику работника:', error);
          setWorkerStats({
            totalTransactions: 0,
            totalSalaryPaid: 0,
            totalIncomeBrought: 0,
            workMonths: 0,
            monthlyStats: []
          });
        }

      } catch (err) {
        console.error('Ошибка загрузки данных работника:', err);
        setError(err.message || 'Ошибка загрузки данных работника');
        if (onError) onError('Ошибка загрузки данных работника');
      } finally {
        setLoading(false);
      }
    };

    // Запускаем загрузку только один раз
    loadWorkerData();
  }, [workerId]); // ← ТОЛЬКО workerId в зависимостях!

  // Обработчики сохранения различных секций
  const handleSaveBasic = async () => {
    setSavingBasic(true);
    try {
      const updatedWorker = await workersService.updateWorker(workerId, basicFormData);
      setWorker(prev => ({ ...prev, ...updatedWorker }));
      setEditingBasic(false);
      onSuccess?.('Основная информация обновлена');
    } catch (err) {
      console.error('Ошибка обновления основной информации:', err);
      onError?.('Ошибка обновления основной информации');
    } finally {
      setSavingBasic(false);
    }
  };

  const handleSaveContacts = async () => {
    setSavingContacts(true);
    try {
      const updatedWorker = await workersService.updateWorker(workerId, contactsFormData);
      setWorker(prev => ({ ...prev, ...updatedWorker }));
      setEditingContacts(false);
      onSuccess?.('Контактная информация обновлена');
    } catch (err) {
      console.error('Ошибка обновления контактов:', err);
      onError?.('Ошибка обновления контактов');
    } finally {
      setSavingContacts(false);
    }
  };

  const handleSaveBank = async () => {
    setSavingBank(true);
    try {
      const updatedWorker = await workersService.updateWorker(workerId, bankFormData);
      setWorker(prev => ({ ...prev, ...updatedWorker }));
      setEditingBank(false);
      onSuccess?.('Банковская информация обновлена');
    } catch (err) {
      console.error('Ошибка обновления банковской информации:', err);
      onError?.('Ошибка обновления банковской информации');
    } finally {
      setSavingBank(false);
    }
  };

  // Копирование в буфер обмена
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  // Обработчик удаления работника
  const handleDelete = () => {
    if (worker.transactions_count > 0) {
      alert(`Невозможно удалить работника. У него есть ${worker.transactions_count} связанных финансовых операций.`);
      return;
    }

    if (confirm(`Вы уверены, что хотите удалить работника "${worker.full_name}"?`)) {
      onDelete?.(workerId);
    }
  };

  // Переключение статуса работника
  const handleToggleStatus = async () => {
    const newStatus = !worker.is_active;
    const confirmMessage = newStatus
      ? `Восстановить работника "${worker.full_name}"?`
      : `Уволить работника "${worker.full_name}"?`;

    if (confirm(confirmMessage)) {
      try {
        const updateData = {
          is_active: newStatus,
          fire_date: newStatus ? null : new Date().toISOString().split('T')[0]
        };

        const updatedWorker = await workersService.updateWorker(workerId, updateData);
        setWorker(prev => ({ ...prev, ...updatedWorker }));
        onSuccess?.(newStatus ? 'Работник восстановлен' : 'Работник уволен');
      } catch (err) {
        console.error('Ошибка изменения статуса работника:', err);
        onError?.('Ошибка изменения статуса работника');
      }
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Форматирование суммы
  const formatAmount = (amount) => {
    return Number(amount).toLocaleString('ru-RU') + ' ₽';
  };

  // Форматирование стажа работы
  const formatWorkExperience = (hireDate, fireDate = null) => {
    const startDate = new Date(hireDate);
    const endDate = fireDate ? new Date(fireDate) : new Date();

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0) {
      return `${years} лет ${months} мес.`;
    } else if (months > 0) {
      return `${months} мес.`;
    } else {
      return `${diffDays} дн.`;
    }
  };

  // Получение значка статуса
  const getStatusBadge = () => {
    if (worker.is_active) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-2" />
          Активен
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-2" />
          Уволен
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Загрузка данных работника...</span>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">{error || 'Работник не найден'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Назад к списку
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {worker.full_name}
              </h1>
              {getStatusBadge()}
            </div>

            <div className="flex items-center space-x-3">
              {/* Переключение статуса */}
              {canEdit && (
                <button
                  onClick={handleToggleStatus}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors ${
                    worker.is_active
                      ? 'text-red-700 bg-red-100 hover:bg-red-200'
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                >
                  {worker.is_active ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Уволить
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Восстановить
                    </>
                  )}
                </button>
              )}

              {/* Удаление */}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Worker Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* 👤 ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Основная информация
                  </h3>
                  {canEdit && !editingBasic && (
                    <button
                      onClick={() => setEditingBasic(true)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 py-4">
                {editingBasic ? (
                  <div className="space-y-4">
                    {/* ФИО */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ФИО
                      </label>
                      <input
                        type="text"
                        value={basicFormData.full_name}
                        onChange={(e) => setBasicFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Должность */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Должность
                      </label>
                      <input
                        type="text"
                        list="positions"
                        value={basicFormData.position}
                        onChange={(e) => setBasicFormData(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <datalist id="positions">
                        {COMMON_POSITIONS.map(position => (
                          <option key={position} value={position} />
                        ))}
                      </datalist>
                    </div>

                    {/* Дата трудоустройства */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата трудоустройства
                      </label>
                      <input
                        type="date"
                        value={basicFormData.hire_date}
                        onChange={(e) => setBasicFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Дата увольнения */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Дата увольнения
                      </label>
                      <input
                        type="date"
                        value={basicFormData.fire_date || ''}
                        onChange={(e) => setBasicFormData(prev => ({ ...prev, fire_date: e.target.value || null }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Кнопки */}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveBasic}
                        disabled={savingBasic}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {savingBasic ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingBasic(false)}
                        disabled={savingBasic}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">ФИО</label>
                      <p className="mt-1 text-sm text-gray-900">{worker.full_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Должность</label>
                      <p className="mt-1 text-sm text-gray-900">{worker.position}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Дата трудоустройства</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(worker.hire_date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Стаж работы</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatWorkExperience(worker.hire_date, worker.fire_date)}
                      </p>
                    </div>
                    {worker.fire_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Дата увольнения</label>
                        <p className="mt-1 text-sm text-red-600">{formatDate(worker.fire_date)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 📞 КОНТАКТНАЯ ИНФОРМАЦИЯ */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Контактная информация
                  </h3>
                  {canEdit && !editingContacts && (
                    <button
                      onClick={() => setEditingContacts(true)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 py-4">
                {editingContacts ? (
                  <div className="space-y-4">
                    {/* Телефон */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Телефон
                      </label>
                      <input
                        type="tel"
                        value={contactsFormData.phone}
                        onChange={(e) => setContactsFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="79991234567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Telegram */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telegram
                      </label>
                      <input
                        type="text"
                        value={contactsFormData.telegram_username}
                        onChange={(e) => setContactsFormData(prev => ({ ...prev, telegram_username: e.target.value }))}
                        placeholder="@username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Кнопки */}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveContacts}
                        disabled={savingContacts}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {savingContacts ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingContacts(false)}
                        disabled={savingContacts}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {worker.phone ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-900">{worker.phone}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(worker.phone, 'phone')}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {copiedField === 'phone' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Phone className="w-4 h-4 mr-3" />
                        <span className="text-sm">Не указан</span>
                      </div>
                    )}

                    {worker.telegram_username ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 text-blue-400 mr-3" />
                          <span className="text-sm text-gray-900">{worker.telegram_username}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(worker.telegram_username, 'telegram')}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {copiedField === 'telegram' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <MessageCircle className="w-4 h-4 mr-3" />
                        <span className="text-sm">Не указан</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 🏦 БАНКОВСКАЯ ИНФОРМАЦИЯ */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Банковская информация
                  </h3>
                  {canEdit && !editingBank && (
                    <button
                      onClick={() => setEditingBank(true)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 py-4">
                {editingBank ? (
                  <div className="space-y-4">
                    {/* Банк */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Банк
                      </label>
                      <input
                        type="text"
                        list="banks"
                        value={bankFormData.bank}
                        onChange={(e) => setBankFormData(prev => ({ ...prev, bank: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                        Номер карты
                      </label>
                      <input
                        type="text"
                        value={bankFormData.card_number}
                        onChange={(e) => setBankFormData(prev => ({ ...prev, card_number: e.target.value.replace(/\D/g, '') }))}
                        placeholder="1234567890123456"
                        maxLength="19"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Кнопки */}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveBank}
                        disabled={savingBank}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {savingBank ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Сохранить
                      </button>
                      <button
                        onClick={() => setEditingBank(false)}
                        disabled={savingBank}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {worker.bank ? (
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-900">{worker.bank}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Building2 className="w-4 h-4 mr-3" />
                        <span className="text-sm">Не указан</span>
                      </div>
                    )}

                    {worker.masked_card_number ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-900 font-mono">
                            {showFullCardNumber && worker.card_number ? worker.card_number : worker.masked_card_number}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {worker.card_number && (
                            <button
                              onClick={() => setShowFullCardNumber(!showFullCardNumber)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title={showFullCardNumber ? 'Скрыть номер' : 'Показать номер'}
                            >
                              {showFullCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(worker.card_number || worker.masked_card_number, 'card')}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {copiedField === 'card' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <CreditCard className="w-4 h-4 mr-3" />
                        <span className="text-sm">Не указан</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Statistics & Actions */}
          <div className="space-y-6">

            {/* 📊 СТАТИСТИКА */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Статистика
                </h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Общие финансы */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Всего операций</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {workerStats.totalTransactions || worker.transactions_count || 0}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  {/* Выплачено зарплаты */}
                  <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-900">Выплачено зарплаты</p>
                        <p className="text-xl font-bold text-red-900">
                          {formatAmount(workerStats.totalSalaryPaid || worker.total_salary_paid || 0)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-red-600" />
                    </div>
                  </div>

                  {/* Принес дохода */}
                  {(workerStats.totalIncomeBrought || worker.total_income_brought) > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-900">Принес дохода</p>
                          <p className="text-xl font-bold text-green-900">
                            {formatAmount(workerStats.totalIncomeBrought || worker.total_income_brought || 0)}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                  )}

                  {/* Стаж в месяцах */}
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900">Стаж работы</p>
                        <p className="text-xl font-bold text-purple-900">
                          {workerStats.workMonths || Math.ceil((new Date() - new Date(worker.hire_date)) / (1000 * 60 * 60 * 24 * 30))} мес.
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 💰 ПОСЛЕДНИЕ ОПЕРАЦИИ */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Последние операции
                </h3>
              </div>
              <div className="px-6 py-4">
                {workerFinances.length > 0 ? (
                  <div className="space-y-3">
                    {workerFinances.slice(0, 5).map((finance) => (
                      <div key={finance.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {finance.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(finance.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${
                            finance.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {finance.type === 'income' ? '+' : '-'}{formatAmount(Math.abs(finance.amount))}
                          </span>
                          <p className="text-xs text-gray-500">
                            {finance.status === 'planned' ? 'План' : 'Факт'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {workerFinances.length > 5 && (
                      <button
                        onClick={() => {/* TODO: Открыть полный список финансов */}}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
                      >
                        Показать все операции ({workerFinances.length})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Нет финансовых операций</p>
                  </div>
                )}
              </div>
            </div>

            {/* 📈 МЕСЯЧНАЯ СТАТИСТИКА */}
            {workerStats.monthlyStats && workerStats.monthlyStats.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    По месяцам
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {workerStats.monthlyStats.slice(0, 6).map((monthStat) => (
                      <div key={monthStat.month} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(monthStat.month).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long'
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {monthStat.transactions} операций
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">
                            -{formatAmount(monthStat.salary_paid || 0)}
                          </p>
                          {monthStat.income_brought > 0 && (
                            <p className="text-xs text-green-600">
                              +{formatAmount(monthStat.income_brought)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 🎯 БЫСТРЫЕ ДЕЙСТВИЯ */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Быстрые действия</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {/* Добавить финансовую операцию */}
                <button
                  onClick={() => {/* TODO: Открыть модальное окно добавления финансовой операции */}}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Добавить операцию
                </button>

                {/* Посмотреть все финансы */}
                <button
                  onClick={() => {/* TODO: Открыть модальное окно со всеми финансами работника */}}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Все операции
                </button>

                {/* Детальная статистика */}
                <button
                  onClick={() => {/* TODO: Открыть детальную статистику */}}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Детальная статистика
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;