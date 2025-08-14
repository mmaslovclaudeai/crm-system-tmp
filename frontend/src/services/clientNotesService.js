// src/services/clientNotesService.js
import { apiService } from './api';

export const clientNotesService = {
  // Получить все заметки клиента
  async getClientNotes(clientId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    console.log(`📝 Получение заметок клиента ID: ${clientId}`);
    try {
      const result = await apiService.get(`/clients/${clientId}/notes?${params}`);
      console.log(`✅ Получено заметок: ${result?.length || 0}`);
      return result || [];
    } catch (error) {
      console.error('❌ Ошибка получения заметок:', error);
      throw error;
    }
  },

  // Создать новую заметку
  async createNote(clientId, noteData) {
    console.log(`📝 Создание заметки для клиента ID: ${clientId}`, noteData);

    if (!noteData.content || !noteData.content.trim()) {
      throw new Error('Содержимое заметки не может быть пустым');
    }

    try {
      const result = await apiService.post(`/clients/${clientId}/notes`, {
        content: noteData.content.trim()
      });
      console.log('✅ Заметка создана:', result);
      return result;
    } catch (error) {
      console.error('❌ Ошибка создания заметки:', error);
      throw error;
    }
  },

  // Обновить заметку
  async updateNote(noteId, noteData) {
    console.log(`📝 Обновление заметки ID: ${noteId}`, noteData);

    if (!noteData.content || !noteData.content.trim()) {
      throw new Error('Содержимое заметки не может быть пустым');
    }

    try {
      const result = await apiService.put(`/notes/${noteId}`, {
        content: noteData.content.trim()
      });
      console.log('✅ Заметка обновлена:', result);
      return result;
    } catch (error) {
      console.error('❌ Ошибка обновления заметки:', error);
      throw error;
    }
  },

  // Удалить заметку
  async deleteNote(noteId) {
    console.log(`📝 Удаление заметки ID: ${noteId}`);

    try {
      const result = await apiService.delete(`/notes/${noteId}`);
      console.log('✅ Заметка удалена');
      return result;
    } catch (error) {
      console.error('❌ Ошибка удаления заметки:', error);
      throw error;
    }
  },

  // Получить статистику заметок клиента
  async getClientNotesStats(clientId) {
    console.log(`📊 Получение статистики заметок клиента ID: ${clientId}`);

    try {
      const result = await apiService.get(`/clients/${clientId}/notes/stats`);
      console.log('✅ Статистика получена:', result);
      return result;
    } catch (error) {
      console.error('❌ Ошибка получения статистики заметок:', error);
      throw error;
    }
  },

  // Валидация данных заметки на клиенте
  validateNoteData(noteData) {
    const errors = {};

    if (!noteData.content || !noteData.content.trim()) {
      errors.content = 'Содержимое заметки обязательно для заполнения';
    }

    if (noteData.content && noteData.content.length > 10000) {
      errors.content = 'Содержимое заметки не может превышать 10000 символов';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Форматирование заметки для отображения
  formatNoteForDisplay(note) {
    return {
      id: note.id,
      content: note.content || '',
      authorId: note.author_id,
      authorName: note.author_name || 'Неизвестный автор',
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      isEdited: note.updated_at && note.updated_at !== note.created_at
    };
  },

  // Подготовка данных для API
  prepareNoteDataForAPI(formData) {
    return {
      content: formData.content?.trim() || ''
    };
  }
};