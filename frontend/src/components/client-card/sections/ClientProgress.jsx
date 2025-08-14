// src/components/client-card/sections/ClientProgress.jsx
import { User, FileText, TrendingUp } from 'lucide-react';
import ProgressIndicator from '../components/ProgressIndicator.jsx';

const ClientProgress = ({ client }) => {
  // Вычисляем заполненность основных данных
  const getBasicDataProgress = () => {
    const fields = [client?.name, client?.email, client?.phone, client?.telegram];
    const filledFields = fields.filter(Boolean).length;
    return { current: filledFields, total: 4 };
  };

  // Вычисляем заполненность документов
  const getDocumentsProgress = () => {
    const docs = client?.documents || {};
    const fields = [
      docs.inn,
      docs.passport?.serial && docs.passport?.number,
      docs.konturLink
    ];
    const filledFields = fields.filter(Boolean).length;
    return { current: filledFields, total: 3 };
  };

  // Общая заполненность профиля
  const getTotalProgress = () => {
    const basicProgress = getBasicDataProgress();
    const docsProgress = getDocumentsProgress();

    const currentTotal = basicProgress.current + docsProgress.current;
    const maxTotal = basicProgress.total + docsProgress.total;

    return { current: currentTotal, total: maxTotal };
  };

  const basicProgress = getBasicDataProgress();
  const docsProgress = getDocumentsProgress();
  const totalProgress = getTotalProgress();

  // Определяем общий статус профиля
  const getProfileStatus = () => {
    const percentage = Math.round((totalProgress.current / totalProgress.total) * 100);

    if (percentage === 100) {
      return { text: "Профиль полностью заполнен", variant: "success" };
    } else if (percentage >= 70) {
      return { text: "Профиль почти заполнен", variant: "warning" };
    } else if (percentage >= 30) {
      return { text: "Профиль частично заполнен", variant: "warning" };
    } else {
      return { text: "Требуется заполнение профиля", variant: "danger" };
    }
  };

  const profileStatus = getProfileStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Заполненность профиля
        </h3>
      </div>

      <div className="p-6">
        {/* Общий прогресс */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              Общий прогресс
            </h4>
            <span className={`text-xs px-2 py-1 rounded-full ${
              profileStatus.variant === 'success' ? 'bg-green-100 text-green-800' :
              profileStatus.variant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {profileStatus.text}
            </span>
          </div>

          <ProgressIndicator
            current={totalProgress.current}
            total={totalProgress.total}
            size="md"
            variant={profileStatus.variant}
            className="mt-2"
          />
        </div>

        {/* Детализация по секциям */}
        <div className="space-y-4">
          {/* Основные данные */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Основные данные
                </p>
                <p className="text-xs text-gray-500">
                  Имя, email, телефон, telegram
                </p>
              </div>
            </div>

            <ProgressIndicator
              current={basicProgress.current}
              total={basicProgress.total}
              size="sm"
            />
          </div>

          {/* Документы */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Документы
                </p>
                <p className="text-xs text-gray-500">
                  ИНН, паспорт, ссылка на Контур
                </p>
              </div>
            </div>

            <ProgressIndicator
              current={docsProgress.current}
              total={docsProgress.total}
              size="sm"
            />
          </div>
        </div>

        {/* Подсказки для улучшения */}
        {totalProgress.current < totalProgress.total && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Для улучшения профиля добавьте:
            </h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {!client?.name && <li>• Имя клиента</li>}
              {!client?.email && <li>• Email адрес</li>}
              {!client?.phone && <li>• Номер телефона</li>}
              {!client?.telegram && <li>• Telegram username</li>}
              {!client?.documents?.inn && <li>• ИНН</li>}
              {!(client?.documents?.passport?.serial && client?.documents?.passport?.number) && <li>• Паспортные данные</li>}
              {!client?.documents?.konturLink && <li>• Ссылка на Контур</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProgress;