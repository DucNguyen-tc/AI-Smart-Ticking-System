const amqp = require('amqplib');

let connection = null;
let channel = null;
let isConnecting = false;

const RABBITMQ_URL = process.env.RABBITMQ_URL || `amqp://${process.env.RABBITMQ_USER || 'admin'}:${process.env.RABBITMQ_PASSWORD || 'admin123'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || 5672}`;

const EXCHANGE = 'ticket.direct.exchange';
const QUEUE = 'ticket.process.queue';
const DLQ = 'ticket.dlq';
const ROUTING_KEY = 'ticket.created.key';
const DLQ_ROUTING_KEY = 'ticket.failed.key';

/**
 * Khởi tạo kết nối và thiết lập RabbitMQ Topology
 */
const connect = async () => {
  if (connection && channel) return;
  if (isConnecting) return;

  isConnecting = true;
  console.log('Connecting to RabbitMQ...');

  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Lắng nghe sự cố mất kết nối đột ngột
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      handleDisconnect();
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed. Attempting reconnect...');
      handleDisconnect();
    });

    console.log('RabbitMQ connected successfully!');

    // Thiết lập Topology
    // 1. Khai báo Dead Letter Queue (DLQ)
    await channel.assertQueue(DLQ, { durable: true });

    // 2. Khai báo Exchange chính
    await channel.assertExchange(EXCHANGE, 'direct', { durable: true });

    // 3. Khai báo Queue chính với các cấu hình DLQ và Max Retries
    await channel.assertQueue(QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGE,
        'x-dead-letter-routing-key': DLQ_ROUTING_KEY,
      }
    });

    // 4. Bind các queue vào exchange tương ứng
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
    await channel.bindQueue(DLQ, EXCHANGE, DLQ_ROUTING_KEY);

    isConnecting = false;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error.message);
    isConnecting = false;
    handleDisconnect();
  }
};

/**
 * Xử lý khi mất kết nối đột ngột (Tự động kết nối lại sau 5s)
 */
const handleDisconnect = () => {
  connection = null;
  channel = null;
  setTimeout(connect, 5000);
};

/**
 * Đóng kết nối an toàn (Graceful Shutdown)
 */
const close = async () => {
  try {
    if (channel) {
      await channel.close();
      console.log('RabbitMQ channel closed.');
    }
    if (connection) {
      await connection.close();
      console.log('RabbitMQ connection closed.');
    }
  } catch (error) {
    console.error('Error during RabbitMQ shutdown:', error.message);
  } finally {
    connection = null;
    channel = null;
  }
};

/**
 * Publish message lên Exchange
 */
const publishMessage = async (routingKey, message) => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel is not initialized.');
    }
    const dataBuffer = Buffer.from(JSON.stringify(message));
    const published = channel.publish(EXCHANGE, routingKey, dataBuffer, {
      persistent: true, // Lưu trữ message trên ổ đĩa để chống mất dữ liệu
    });

    if (published) {
      console.log(`Published TICKET_CREATED event to exchange: ${EXCHANGE} with routing key: ${routingKey}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error publishing message to RabbitMQ:', error.message);
    return false;
  }
};

module.exports = {
  connect,
  close,
  publishMessage,
};
