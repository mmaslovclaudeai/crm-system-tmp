// src/components/client-card/sections/ClientDocuments.jsx
import { FileText, CreditCard, ExternalLink } from 'lucide-react';
import EditableSection from '../components/EditableSection';
import CopyButton from '../components/CopyButton';
import InputField from '../../ui/InputField';

const ClientDocuments = ({
  client,
  isEditing,
  isSaving,
  formData,
  onEdit,
  onSave,
  onCancel,
  onChange
}) => {
  const handleInputChange = (field, value) => {
    if (onChange) {
      onChange(field, value);
    }
  };

  // Получаем документы из client
  const docs = client?.documents || {};
  const passport = docs.passport || {};

  return (
    <EditableSection
      title="Документы"
      icon={FileText}
      isEditing={isEditing}
      isSaving={isSaving}
      onEdit={onEdit}
      onSave={onSave}
      onCancel={onCancel}
    >
      {isEditing ? (
        /* Режим редактирования */
        <div className="space-y-4">
          <InputField
            label="ИНН"
            value={formData.inn}
            onChange={(value) => handleInputChange('inn', value)}
            placeholder="123456789012"
            maxLength={12}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Серия паспорта"
              value={formData.passportSerial}
              onChange={(value) => handleInputChange('passportSerial', value)}
              placeholder="1234"
              maxLength={4}
            />

            <InputField
              label="Номер паспорта"
              value={formData.passportNumber}
              onChange={(value) => handleInputChange('passportNumber', value)}
              placeholder="123456"
              maxLength={6}
            />
          </div>

          <InputField
            label="Ссылка на Контур"
            value={formData.konturLink}
            onChange={(value) => handleInputChange('konturLink', value)}
            placeholder="https://focus.kontur.ru/entity?query=..."
          />
        </div>
      ) : (
        /* Режим просмотра */
        <div className="space-y-4">
          {/* ИНН */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {docs.inn || 'Не указан'}
                </p>
                <p className="text-xs text-gray-500">ИНН</p>
              </div>
            </div>
            {docs.inn && (
              <CopyButton
                text={docs.inn}
                fieldName="inn"
              />
            )}
          </div>

          {/* Паспорт */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {passport.serial && passport.number
                    ? `${passport.serial} ${passport.number}`
                    : 'Не указан'
                  }
                </p>
                <p className="text-xs text-gray-500">Паспорт</p>
              </div>
            </div>
            {passport.serial && passport.number && (
              <CopyButton
                text={`${passport.serial} ${passport.number}`}
                fieldName="passport"
              />
            )}
          </div>

          {/* Ссылка на Контур */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ExternalLink className="w-5 h-5 text-gray-400" />
              <div>
                {docs.konturLink ? (
                  <a
                    href={docs.konturLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors underline"
                  >
                    Открыть в Контуре
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    Не указана
                  </p>
                )}
                <p className="text-xs text-gray-500">Ссылка на Контур</p>
              </div>
            </div>
            {docs.konturLink && (
              <CopyButton
                text={docs.konturLink}
                fieldName="konturLink"
              />
            )}
          </div>

          {/* Если нет документов */}
          {!docs.inn && !passport.serial && !passport.number && !docs.konturLink && (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Документы не заполнены</p>
            </div>
          )}
        </div>
      )}
    </EditableSection>
  );
};

export default ClientDocuments;