// src/components/client-card/components/NoteItem.jsx
import { useState } from 'react';
import { Edit, Trash2, Save, X, User, Calendar } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { formatDate } from '../../../utils/formatters';

const NoteItem = ({
  note,
  currentUser,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content || '');
  const [isSaving, setIsSaving] = useState(false);

  // Проверяем, является ли текущий пользователь автором заметки
  const isAuthor = currentUser && (currentUser.id === note.authorId);

  // Получаем имя автора
  const authorName = note.authorName || 'Неизвестный автор';

  // Форматируем дату
  const createdDate = formatDate(note.createdAt);
  const updatedDate = note.updatedAt;
  const isEdited = note.isEdited;

  const handleEdit = () => {
    setEditContent(note.content || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditContent(note.content || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editContent.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(note.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Ошибка сохранения заметки:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
      try {
        await onDelete(note.id);
      } catch (error) {
        console.error('Ошибка удаления заметки:', error);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Заголовок заметки */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Аватар автора */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          </div>

          {/* Информация об авторе и дате */}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {authorName}
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{createdDate}</span>
              {isEdited && (
                <span className="text-gray-400">(изменено)</span>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        {(isAuthor || currentUser?.role === 'admin') && (
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editContent.trim()}
                  className="flex items-center space-x-1 px-2 py-1 text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  <span className="text-xs">Сохранить</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center space-x-1 px-2 py-1 text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                  <span className="text-xs">Отмена</span>
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={handleEdit}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Редактировать заметку"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Удалить заметку"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Содержимое заметки */}
      <div className="ml-11">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md resize-vertical min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите текст заметки... Поддерживается Markdown форматирование"
            />

            {/* Подсказка по Markdown */}
            <div className="text-xs text-gray-500">
              <span className="font-medium">Поддерживается:</span>
              <code className="mx-1">**жирный**</code>
              <code className="mx-1">*курсив*</code>
              <code className="mx-1">`код`</code>
              <code className="mx-1">[ссылка](url)</code>
              <code className="mx-1"># заголовок</code>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700">
            <MarkdownRenderer
              content={note.content}
              className="prose-gray"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteItem;