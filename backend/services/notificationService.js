// backend/services/notificationService.js
const EventEmitter = require('events');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Слушаем событие создания нового клиента
    this.on('client:created', async (data) => {
      console.log('📢 Processing new client notification...');
      console.log('👤 New client created:', data.client.name);
      // Здесь можно добавить другие каналы уведомлений в будущем
      // await emailService.notifyNewClient(data.client, data.user);
      // await slackService.notifyNewClient(data.client, data.user);
    });

    // Можно добавить другие события
    this.on('client:updated', async (data) => {
      console.log('📢 Client updated:', data.client.name);
      // Логика для уведомления об обновлении клиента
    });

    this.on('finance:created', async (data) => {
      console.log('📢 Finance operation created:', data.finance.amount);
      // Логика для уведомления о новой финансовой операции
    });
  }

  // 🆕 НОВЫЙ МЕТОД: Универсальный метод для отправки уведомлений
  async sendNotification(notificationData) {
    try {
      console.log('📨 Sending notification:', notificationData);

      const { type, userId, metadata } = notificationData;

      // В зависимости от типа уведомления выполняем разные действия
      switch (type) {
        case 'client_created':
          // Получаем полные данные клиента из базы
          const pool = require('../database');
          const clientResult = await pool.query('SELECT * FROM crm.clients WHERE id = $1', [metadata.clientId]);
          const fullClient = clientResult.rows[0];

          // Получаем данные пользователя
          const userResult = await pool.query('SELECT * FROM crm.users WHERE id = $1', [userId]);
          const user = userResult.rows[0];

          if (fullClient && user) {
            this.emit('client:created', {
              client: fullClient,
              user: user
            });
          }
          break;

        case 'client_updated':
          this.emit('client:updated', { client: metadata, user: { id: userId } });
          break;

        case 'finance_created':
          this.emit('finance:created', { finance: metadata, user: { id: userId } });
          break;

        default:
          console.log(`⚠️ Unknown notification type: ${type}`);
          break;
      }

      return true;
    } catch (error) {
      console.error('❌ Error in sendNotification:', error);
      return false;
    }
  }

  // Метод для эмита события создания клиента (существующий)
  notifyClientCreated(client, user) {
    this.emit('client:created', { client, user });
  }

  // Метод для эмита события обновления клиента
  notifyClientUpdated(client, user) {
    this.emit('client:updated', { client, user });
  }

  // Метод для эмита события создания финансовой операции
  notifyFinanceCreated(finance, user) {
    this.emit('finance:created', { finance, user });
  }
}

// Экспорт singleton экземпляра
module.exports = new NotificationService();