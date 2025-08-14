// src/services/clientsService.js - ОБНОВЛЕН С НОВЫМИ МЕТОДАМИ
import { apiService } from './api';

export const clientsService = {
  // Получение списка клиентов
  async getClients(params = {}) {
    const response = await apiService.get('/clients', { params });
    return response;
  },

  // Получение клиента по ID
  async getClient(id) {
    const response = await apiService.get(`/clients/${id}`);
    return response;
  },

  // Создание клиента
  async createClient(clientData) {
    const response = await apiService.post('/clients', clientData);
    return response;
  },

  // Обновление клиента
  async updateClient(id, clientData) {
    const response = await apiService.put(`/clients/${id}`, clientData);
    return response;
  },

  // Удаление клиента
  async deleteClient(id) {
    const response = await apiService.delete(`/clients/${id}`);
    return response;
  },

  // Обновление статуса клиента
  async updateClientStatus(id, status) {
    const response = await apiService.patch(`/clients/${id}/status`, { status });
    return response;
  },

  // Обновление куратора клиента
  async updateClientCurator(id, curatorId) {
    const response = await apiService.patch(`/clients/${id}/curator`, { curator_id: curatorId });
    return response;
  },

  // Обновление данных обучения
  async updateClientEducationData(id, educationData) {
    const response = await apiService.patch(`/clients/${id}/data`, { data: educationData });
    return response;
  },

  // 🆕 НОВЫЕ МЕТОДЫ: Получение потоков и групп

};