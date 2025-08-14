// src/components/client-card/hooks/useClientEdit.js - ОБНОВЛЕН С ПОДДЕРЖКОЙ НОВЫХ ПОЛЕЙ
import { useState, useEffect } from 'react';
import { clientsService } from '../../../services/clientsService.js';

export const useClientEdit = (client, onSuccess, onError) => {
  // Состояния редактирования
  const [editingBasic, setEditingBasic] = useState(false);
  const [savingBasic, setSavingBasic] = useState(false);

  // 🆕 ОБНОВЛЕННЫЕ данные форм с поддержкой новых полей
  const [basicFormData, setBasicFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: '',
    worker_id: null,    // 🆕 ID куратора
    data: {}            // 🆕 JSON данные обучения
  });

  // 🆕 ОБНОВЛЕННОЕ заполнение форм данными клиента при изменении client
  useEffect(() => {
    if (client) {
      // Заполняем основную форму с новыми полями
      setBasicFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        status: client.status || '',
        worker_id: client.worker_id || null,
        data: client.data || {}
      });
    }
  }, [client]);

  // Обработчики для основной информации
  const handleEditBasic = () => {
    setEditingBasic(true);
  };

  const handleCancelBasic = () => {
    if (client) {
      // 🆕 ОБНОВЛЕНО: сброс формы с новыми полями
      setBasicFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        status: client.status || '',
        worker_id: client.worker_id || null,
        data: client.data || {}
      });
    }
    setEditingBasic(false);
  };

  const handleSaveBasic = async () => {
    if (!client) return;

    setSavingBasic(true);
    try {
      // 🆕 ОБНОВЛЕНО: отправляем все поля включая новые
      const updateData = {
        name: basicFormData.name,
        email: basicFormData.email,
        phone: basicFormData.phone,
        status: basicFormData.status,
        worker_id: basicFormData.worker_id,
        data: basicFormData.data
      };

      const updatedClient = await clientsService.updateClient(client.id, updateData);
      setEditingBasic(false);
      if (onSuccess) {
        onSuccess('Основная информация обновлена', updatedClient);
      }
    } catch (error) {
      console.error('Ошибка обновления основной информации:', error);
      if (onError) {
        onError(error.message || 'Ошибка обновления основной информации');
      }
    } finally {
      setSavingBasic(false);
    }
  };

  // 🆕 ОБНОВЛЕННЫЕ обработчики изменения форм
  const handleBasicChange = (field, value) => {
    setBasicFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 🆕 НОВЫЙ обработчик для данных обучения
  const handleEducationChange = (field, value) => {
    setBasicFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }));
  };

  // 🆕 НОВЫЙ обработчик для куратора
  const handleCuratorChange = (curatorId) => {
    setBasicFormData(prev => ({
      ...prev,
      worker_id: curatorId
    }));
  };

  return {
    // Состояния редактирования
    editingBasic,
    savingBasic,

    // Данные форм
    basicFormData,

    // Обработчики основной информации
    handleEditBasic,
    handleCancelBasic,
    handleSaveBasic,

    // Обработчики изменений
    handleBasicChange,
    handleEducationChange,  // 🆕 НОВЫЙ
    handleCuratorChange     // 🆕 НОВЫЙ
  };
};