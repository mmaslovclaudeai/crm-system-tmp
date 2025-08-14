// src/components/client-card/sections/ClientNotes.jsx
import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { clientNotesService } from '../../../services/clientNotesService.js';
import NoteItem from '../components/NoteItem.jsx';
import NoteForm from '../components/NoteForm.jsx';

const ClientNotes = ({ client, onError, onSuccess }) => {
  const { user } = useAuthContext();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Загрузка заметок при монтировании
  useEffect(() => {
    if (client?.id) {
      loadNotes();
    }
  }, [client?.id]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      // Используем новый API для получения заметок из отдельной таблицы
      const notesData = await clientNotesService.getClientNotes(client.id);

      // Форматируем заметки для отображения
      const formattedNotes = notesData.map(note =>
        clientNotesService.formatNoteForDisplay(note)
      );

      setNotes(formattedNotes);
    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
      if (onError) {
        onError('Не удалось загрузить заметки');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (content) => {
    if (!user || !client?.id) return;

    setIsAdding(true);
    try {
      // Валидируем данные заметки
      const validation = clientNotesService.validateNoteData({ content });
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0]);
      }

      // Создаем заметку через API
      const newNote = await clientNotesService.createNote(client.id, { content });

      // Форматируем для отображения и добавляем в начало списка
      const formattedNote = clientNotesService.formatNoteForDisplay(newNote);
      setNotes(prevNotes => [formattedNote, ...prevNotes]);

      if (onSuccess) {
        onSuccess('Заметка добавлена');
      }
    } catch (error) {
      console.error('Ошибка добавления заметки:', error);
      if (onError) {
        onError(error.message || 'Не удалось добавить заметку');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditNote = async (noteId, newContent) => {
    if (!user || !client?.id) return;

    try {
      // Валидируем данные заметки
      const validation = clientNotesService.validateNoteData({ content: newContent });
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0]);
      }

      // Обновляем заметку через API
      const updatedNote = await clientNotesService.updateNote(noteId, { content: newContent });

      // Форматируем и обновляем в списке
      const formattedNote = clientNotesService.formatNoteForDisplay(updatedNote);
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? formattedNote : note
        )
      );

      if (onSuccess) {
        onSuccess('Заметка обновлена');
      }
    } catch (error) {
      console.error('Ошибка редактирования заметки:', error);
      if (onError) {
        onError(error.message || 'Не удалось обновить заметку');
      }
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!client?.id) return;

    try {
      // Удаляем заметку через API
      await clientNotesService.deleteNote(noteId);

      // Удаляем из локального состояния
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));

      if (onSuccess) {
        onSuccess('Заметка удалена');
      }
    } catch (error) {
      console.error('Ошибка удаления заметки:', error);
      if (onError) {
        onError(error.message || 'Не удалось удалить заметку');
      }
    }
  };

  if (!client) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
          Заметки
          {notes.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {notes.length}
            </span>
          )}
        </h3>
      </div>

      <div className="p-6">
        {/* Форма добавления заметки */}
        {user && (
          <div className="mb-6">
            <NoteForm
              currentUser={user}
              onAdd={handleAddNote}
              isAdding={isAdding}
            />
          </div>
        )}

        {/* Список заметок */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3 text-gray-600">
              <div className="w-5 h-5 border border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span>Загрузка заметок...</span>
            </div>
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                currentUser={user}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Пока нет заметок</p>
            <p className="text-xs text-gray-400">
              Заметки помогают отслеживать важную информацию о клиенте
            </p>
          </div>
        )}

        {/* Предупреждение если нет пользователя */}
        {!user && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Необходимо войти в систему для работы с заметками
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotes;