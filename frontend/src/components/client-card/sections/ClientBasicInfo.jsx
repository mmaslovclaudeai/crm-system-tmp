// src/components/client-card/sections/ClientBasicInfo.jsx - ОБНОВЛЕН С ФИКСИРОВАННЫМИ ВЫПАДАЮЩИМИ МЕНЮ
import { User, Mail, Phone, MessageCircle, UserCheck, GraduationCap, Calendar, Users, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import EditableSection from '../components/EditableSection';
import CopyButton from '../components/CopyButton';
import StatusBadge from '../components/StatusBadge';
import InputField from '../../ui/InputField';
import DropdownField from '../../ui/DropdownField';
import SimpleDatePicker from '../../ui/SimpleDatePicker';

const ClientBasicInfo = ({
  client,
  isEditing,
  isSaving,
  formData,
  onEdit,
  onSave,
  onCancel,
  onChange
}) => {
  // Состояние для списка кураторов
  const [curators, setCurators] = useState([]);
  const [loadingCurators, setLoadingCurators] = useState(false);

  // 🆕 ФИКСИРОВАННЫЕ ОПЦИИ ДЛЯ ПОТОКОВ И ГРУПП
  const flowOptions = [
    { value: 'КП3.0', label: 'КП3.0' },
    { value: 'КП4.0', label: 'КП4.0' },
    { value: 'Межсезонье', label: 'Межсезонье' }
  ];

  const groupOptions = [
    { value: 'РГ-1', label: 'РГ-1' },
    { value: 'РГ-2', label: 'РГ-2' },
    { value: 'РГ-3', label: 'РГ-3' },
    { value: 'РГ-4', label: 'РГ-4' },
    { value: 'РГ-5', label: 'РГ-5' },
    { value: 'АГ-1', label: 'АГ-1' },
    { value: 'АГ-2', label: 'АГ-2' },
    { value: 'АГ-3', label: 'АГ-3' }
  ];

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    if (isEditing) {
      loadCurators();
    }
  }, [isEditing]);

  // Функция загрузки активных кураторов
  const loadCurators = async () => {
    try {
      setLoadingCurators(true);

      // Импортируем API сервис динамически
      const { apiService } = await import('../../../services/api');

      // Загружаем только активных работников
      const response = await apiService.get('/workers?active_only=true');
      const workers = Array.isArray(response) ? response : [];

      // Преобразуем в формат для dropdown
      const curatorOptions = workers.map(worker => ({
        value: worker.id,
        label: `${worker.full_name} (${worker.position})`
      }));

      setCurators(curatorOptions);
    } catch (error) {
      console.error('Ошибка загрузки кураторов:', error);
      setCurators([]);
    } finally {
      setLoadingCurators(false);
    }
  };



  // Опции статусов для выпадающего списка
  const statusOptions = [
    // Приемка
    { value: 'CREATED', label: 'Создан' },
    { value: 'DISTRIBUTION', label: 'Распределение' },
    { value: 'GIVE_ACCESS', label: 'Выдача доступов' },
    // Ученики
    { value: 'IN_PROGRESS', label: 'Обучается' },
    { value: 'SEARCH_OFFER', label: 'Ищет работу' },
    { value: 'ACCEPT_OFFER', label: 'Принял оффер' },
    { value: 'PAYING_OFFER', label: 'Выплачивает процент' },
    { value: 'FINISH', label: 'Закончил обучение' }
  ];

  // Опции направлений
  const directionOptions = [
    { value: 'QA', label: 'QA (Ручное тестирование)' },
    { value: 'AQA', label: 'AQA (Автоматизированное тестирование)' }
  ];

  const handleInputChange = (field, value) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  // Обработчики для изменения данных обучения
  const handleEducationChange = (field, value) => {
    const currentData = formData.data || {};
    const updatedData = { ...currentData, [field]: value };
    handleInputChange('data', updatedData);
  };

  // Получаем данные обучения из formData или client
  const educationData = isEditing ? (formData.data || {}) : (client?.data || {});

  return (
    <EditableSection
      title="Основная информация"
      icon={User}
      isEditing={isEditing}
      isSaving={isSaving}
      onEdit={onEdit}
      onSave={onSave}
      onCancel={onCancel}
    >
      {isEditing ? (
        /* Режим редактирования */
        <div className="space-y-6">
          {/* Основные данные */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Личные данные</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Имя клиента"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                placeholder="Введите имя клиента"
                required
              />

              <InputField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                placeholder="client@example.com"
                required
              />

              <InputField
                label="Телефон"
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                placeholder="+7 (999) 123-45-67"
              />

              <InputField
                label="Telegram"
                value={formData.telegram}
                onChange={(value) => handleInputChange('telegram', value)}
                placeholder="@username"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DropdownField
                label="Статус"
                value={formData.status}
                onChange={(value) => handleInputChange('status', value)}
                options={statusOptions}
                placeholder="Выберите статус"
              />

              <DropdownField
                label="Куратор"
                value={formData.worker_id}
                onChange={(value) => handleInputChange('worker_id', value)}
                options={[
                  { value: null, label: 'Без куратора' },
                  ...curators
                ]}
                placeholder={loadingCurators ? "Загрузка..." : "Выберите куратора"}
                disabled={loadingCurators}
              />
            </div>
          </div>

          {/* Данные обучения */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span>Данные обучения</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DropdownField
                label="Поток"
                value={educationData.flow || ''}
                onChange={(value) => handleEducationChange('flow', value)}
                options={[
                  { value: '', label: 'Не выбрано' },
                  ...flowOptions
                ]}
                placeholder="Выберите поток"
              />

              <DropdownField
                label="Направление"
                value={educationData.direction || ''}
                onChange={(value) => handleEducationChange('direction', value)}
                options={[
                  { value: '', label: 'Не выбрано' },
                  ...directionOptions
                ]}
                placeholder="Выберите направление"
              />

              <DropdownField
                label="Группа"
                value={educationData.group || ''}
                onChange={(value) => handleEducationChange('group', value)}
                options={[
                  { value: '', label: 'Не выбрано' },
                  ...groupOptions
                ]}
                placeholder="Выберите группу"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SimpleDatePicker
                label="Дата начала обучения"
                value={educationData.start_date || ''}
                onChange={(value) => handleEducationChange('start_date', value)}
                placeholder="YYYY-MM-DD"
              />

              <SimpleDatePicker
                label="Дата окончания обучения"
                value={educationData.end_date || ''}
                onChange={(value) => handleEducationChange('end_date', value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Режим просмотра */
        <div className="space-y-6">
          {/* Личные данные */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2 pb-2 border-b">
              <User className="w-4 h-4" />
              <span>Личные данные</span>
            </h4>

            {/* Имя */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {client?.name || 'Не указано'}
                  </p>
                  <p className="text-xs text-gray-500">Имя клиента</p>
                </div>
              </div>
              {client?.name && (
                <CopyButton
                  text={client.name}
                  fieldName="name"
                />
              )}
            </div>

            {/* Email */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {client?.email || 'Не указан'}
                  </p>
                  <p className="text-xs text-gray-500">Email</p>
                </div>
              </div>
              {client?.email && (
                <CopyButton
                  text={client.email}
                  fieldName="email"
                />
              )}
            </div>

            {/* Телефон */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {client?.phone || 'Не указан'}
                  </p>
                  <p className="text-xs text-gray-500">Телефон</p>
                </div>
              </div>
              {client?.phone && (
                <CopyButton
                  text={client.phone}
                  fieldName="phone"
                />
              )}
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {client?.telegram || 'Не указан'}
                  </p>
                  <p className="text-xs text-gray-500">Telegram</p>
                </div>
              </div>
              {client?.telegram && (
                <CopyButton
                  text={client.telegram}
                  fieldName="telegram"
                />
              )}
            </div>

            {/* Статус */}
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-xs text-gray-500">Статус</p>
                </div>
                <StatusBadge status={client?.status} />
              </div>
            </div>

            {/* Куратор */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {client?.curator ? (
                      <span>
                        {client.curator.name}
                        <span className="text-xs text-gray-500 ml-1">
                          ({client.curator.position})
                        </span>
                      </span>
                    ) : (
                      'Не назначен'
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Куратор</p>
                </div>
              </div>
              {client?.curator && (
                <CopyButton
                  text={client.curator.name}
                  fieldName="curator"
                />
              )}
            </div>
          </div>

          {/* Данные обучения */}
          {(educationData.flow || educationData.direction || educationData.group ||
            educationData.start_date || educationData.end_date) && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2 pb-2 border-b">
                <GraduationCap className="w-4 h-4" />
                <span>Данные обучения</span>
              </h4>

              {/* Поток */}
              {educationData.flow && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {educationData.flow}
                      </p>
                      <p className="text-xs text-gray-500">Поток</p>
                    </div>
                  </div>
                  <CopyButton
                    text={educationData.flow}
                    fieldName="flow"
                  />
                </div>
              )}

              {/* Направление */}
              {educationData.direction && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          educationData.direction === 'QA' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {educationData.direction}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">Направление</p>
                    </div>
                  </div>
                  <CopyButton
                    text={educationData.direction}
                    fieldName="direction"
                  />
                </div>
              )}

              {/* Группа */}
              {educationData.group && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {educationData.group}
                      </p>
                      <p className="text-xs text-gray-500">Группа</p>
                    </div>
                  </div>
                  <CopyButton
                    text={educationData.group}
                    fieldName="group"
                  />
                </div>
              )}

              {/* Даты обучения */}
              {(educationData.start_date || educationData.end_date) && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {educationData.start_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(educationData.start_date).toLocaleDateString('ru-RU')}
                          </p>
                          <p className="text-xs text-gray-500">Начало</p>
                        </div>
                      )}
                      {educationData.start_date && educationData.end_date && (
                        <span className="text-gray-400">→</span>
                      )}
                      {educationData.end_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(educationData.end_date).toLocaleDateString('ru-RU')}
                          </p>
                          <p className="text-xs text-gray-500">Окончание</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Период обучения</p>
                  </div>
                  {(educationData.start_date || educationData.end_date) && (
                    <CopyButton
                      text={`${educationData.start_date || ''} - ${educationData.end_date || ''}`}
                      fieldName="dates"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </EditableSection>
  );
};

export default ClientBasicInfo;