// src/components/client-card/components/EditableSection.jsx
import { Edit, Save, X, Loader2 } from 'lucide-react';

const EditableSection = ({
  title,
  icon: Icon,
  isEditing,
  isSaving = false,
  onEdit,
  onSave,
  onCancel,
  children,
  className = "",
  headerClassName = "",
  contentClassName = "",
  showEditButton = true,
  editButtonText = "Редактировать",
  saveButtonText = "Сохранить",
  cancelButtonText = "Отмена"
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            {Icon && <Icon className="w-5 h-5 mr-2 text-blue-600" />}
            {title}
          </h3>

          {showEditButton && (
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center space-x-1 px-3 py-1.5 text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saveButtonText}</span>
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={isSaving}
                    className="flex items-center space-x-1 px-3 py-1.5 text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>{cancelButtonText}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onEdit}
                  className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>{editButtonText}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default EditableSection;