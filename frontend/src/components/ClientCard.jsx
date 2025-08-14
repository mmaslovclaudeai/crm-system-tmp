// src/components/ClientCard.jsx
import { Loader2, XCircle } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext.jsx';

// Хуки
import { useClientData } from './client-card/hooks/useClientData.js';
import { useClientEdit } from './client-card/hooks/useClientEdit.js';

// Секции
import ClientHeader from './client-card/sections/ClientHeader.jsx';
import ClientBasicInfo from './client-card/sections/ClientBasicInfo.jsx';
import ClientStats from './client-card/sections/ClientStats.jsx';
import ClientProgress from './client-card/sections/ClientProgress.jsx';
import ClientNotes from './client-card/sections/ClientNotes.jsx';

// Таблицы
import FinancesTable from './tables/FinancesTable.jsx';

// Константы
import { FINANCE_TABS, PAYMENT_STATUS } from '../constants';

const ClientCard = ({
  clientId,
  onBack,
  onEdit,
  onDelete,
  onError,
  onSuccess
}) => {
  const { canDelete } = useAuthContext();

  // Хук для работы с данными клиента
  const {
    client,
    clientFinances,
    clientStats,
    loading,
    error,
    updateClientData
  } = useClientData(clientId, onError);

  // Хук для редактирования клиента
  const {
    editingBasic,
    savingBasic,
    basicFormData,
    handleEditBasic,
    handleCancelBasic,
    handleSaveBasic,
    handleBasicChange
  } = useClientEdit(client, handleEditSuccess, onError);

  // Обработчик успешного редактирования
  function handleEditSuccess(message, updatedClient) {
    if (updatedClient) {
      updateClientData(updatedClient);
    }
    if (onSuccess) {
      onSuccess(message);
    }
  }

  // Обработчик удаления клиента
  const handleDelete = () => {
    if (onDelete && client) {
      onDelete(client);
    }
  };

  // Состояние загрузки
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Загрузка данных клиента...</span>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">{error || 'Клиент не найден'}</p>
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
      {/* Заголовок */}
      <ClientHeader
        onBack={onBack}
        onDelete={canDelete() ? handleDelete : null}
        client={client}
      />

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Основная информация */}
          <ClientBasicInfo
            client={client}
            isEditing={editingBasic}
            isSaving={savingBasic}
            formData={basicFormData}
            onEdit={handleEditBasic}
            onSave={handleSaveBasic}
            onCancel={handleCancelBasic}
            onChange={handleBasicChange}
          />

          {/* Операции по клиенту */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Операции по клиенту
                {clientFinances && clientFinances.length > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {clientFinances.length}
                  </span>
                )}
              </h3>
            </div>
            <div className="p-6">
              <FinancesTable
                finances={clientFinances || []}
                clients={[client]}
                cashDesks={[]}
                workers={[]}
                loading={loading}
                activeSubTab={FINANCE_TABS.ACTUAL}
                onError={onError}
                isClientCard={true}
              />
            </div>
          </div>
        </div>

        {/* Заметки - на всю ширину внизу */}
        <div className="mt-8">
          <ClientNotes
            client={client}
            onError={onError}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientCard;