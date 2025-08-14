// backend/services/kafkaService.js
const { Kafka } = require('kafkajs');
const { info, error, kafka } = require('../utils/logger');

class KafkaService {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'crm-backend',
      brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
    });

    this.producer = this.kafka.producer();
    this.isConnected = false;
  }

  async connect() {
    if (!this.isConnected) {
      try {
        await this.producer.connect();
        this.isConnected = true;
        info('Подключение к Kafka установлено', {
          action: 'kafka_connection',
          status: 'success',
          brokers: this.kafka.brokers
        });
      } catch (error) {
        error('Ошибка подключения к Kafka', {
          action: 'kafka_connection',
          status: 'failed',
          error: error.message,
          brokers: this.kafka.brokers
        });
        throw error;
      }
    }
  }

  async disconnect() {
    if (this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        info('Отключение от Kafka', {
          action: 'kafka_disconnection',
          status: 'success'
        });
      } catch (error) {
        error('Ошибка отключения от Kafka', {
          action: 'kafka_disconnection',
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async sendMessage(topic, message) {
    try {
      await this.connect();
      
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message),
            timestamp: Date.now(),
          },
        ],
      });

      info('Сообщение отправлено в Kafka', {
        action: 'kafka_message_sent',
        status: 'success',
        topic: topic,
        messageType: message.event_type,
        clientId: message.data?.client_id
      });
    } catch (error) {
      error('Ошибка отправки сообщения в Kafka', {
        action: 'kafka_message_sent',
        status: 'failed',
        topic: topic,
        messageType: message.event_type,
        error: error.message
      });
      throw error;
    }
  }

  // Отправка сообщения о клиенте в зависимости от статуса
  async sendClientStatusMessage(client, oldStatus = null) {
    const message = {
      event_type: 'client_status_changed',
      timestamp: new Date().toISOString(),
      data: {
        client_id: client.id,
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        old_status: oldStatus,
        new_status: client.status,
        updated_at: client.updated_at || new Date().toISOString(),
      },
    };

    // Определяем, в какой топик отправить сообщение
    const acceptedStatuses = ['CREATED', 'IN_PROGRESS', 'PAYING_OFFER'];
    const topic = acceptedStatuses.includes(client.status) 
      ? 'crm-msgAccepted' 
      : 'crm-msgError';

    await this.sendMessage(topic, message);
  }

  // Отправка сообщения о создании клиента
  async sendClientCreatedMessage(client) {
    const message = {
      event_type: 'client_created',
      timestamp: new Date().toISOString(),
      data: {
        client_id: client.id,
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        status: client.status,
        created_at: client.created_at || new Date().toISOString(),
      },
    };

    // Определяем топик в зависимости от статуса
    const acceptedStatuses = ['CREATED', 'IN_PROGRESS', 'PAYING_OFFER'];
    const topic = acceptedStatuses.includes(client.status) 
      ? 'crm-msgAccepted' 
      : 'crm-msgError';

    await this.sendMessage(topic, message);
  }

  // Методы для финансовых операций и работников удалены - теперь используем только клиентов
}

// Создаем единственный экземпляр сервиса
const kafkaService = new KafkaService();

// Обработка завершения процесса
process.on('SIGINT', async () => {
  console.log('🛑 Получен сигнал SIGINT, отключаемся от Kafka...');
  await kafkaService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Получен сигнал SIGTERM, отключаемся от Kafka...');
  await kafkaService.disconnect();
  process.exit(0);
});

module.exports = kafkaService;
