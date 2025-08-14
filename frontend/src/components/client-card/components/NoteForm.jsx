// src/components/client-card/components/NoteForm.jsx
import { useState } from 'react';
import { Plus, Send, User, Eye, EyeOff } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const NoteForm = ({ currentUser, onAdd, isAdding = false }) => {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      return;
    }

    try {
      await onAdd(content);
      setContent('');
      setIsExpanded(false);
      setShowPreview(false);
    } catch (error) {
      console.error('Ошибка добавления заметки:', error);
    }
  };

  const handleCancel = () => {
    setContent('');
    setIsExpanded(false);
    setShowPreview(false);
  };

  const authorName = currentUser?.name || currentUser?.email || 'Вы';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <form onSubmit={handleSubmit}>
        {/* Заголовок формы */}
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {authorName}
            </p>
            <p className="text-xs text-gray-500">
              Добавить новую заметку
            </p>
          </div>
        </div>

        {/* Поле ввода */}
        <div className="ml-11 space-y-3">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder={isExpanded ? "Введите текст заметки... Поддерживается Markdown форматирование" : "Написать заметку..."}
              className={`w-full p-3 border border-gray-300 rounded-md resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                isExpanded ? 'min-h-[120px]' : 'min-h-[60px]'
              }`}
            />
          </div>

          {/* Предварительный просмотр */}
          {isExpanded && content && showPreview && (
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Предварительный просмотр:</h4>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Скрыть
                </button>
              </div>
              <MarkdownRenderer
                content={content}
                className="prose-sm"
              />
            </div>
          )}

          {/* Подсказки и кнопки */}
          {isExpanded && (
            <div className="space-y-3">
              {/* Подсказка по Markdown */}
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                <span className="font-medium">Поддерживается Markdown:</span>
                <code className="mx-1 bg-white px-1 rounded">**жирный**</code>
                <code className="mx-1 bg-white px-1 rounded">*курсив*</code>
                <code className="mx-1 bg-white px-1 rounded">`код`</code>
                <code className="mx-1 bg-white px-1 rounded">[ссылка](url)</code>
                <code className="mx-1 bg-white px-1 rounded"># заголовок</code>
                <code className="mx-1 bg-white px-1 rounded">- список</code>
              </div>

              {/* Кнопки действий */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {content && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center space-x-1 px-2 py-1 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span className="text-xs">
                        {showPreview ? 'Скрыть' : 'Просмотр'}
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!content.trim() || isAdding}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isAdding ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Добавление...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>Добавить заметку</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default NoteForm;