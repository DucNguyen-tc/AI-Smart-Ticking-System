import json
import pika
import time
from config import RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASSWORD, QUEUE_NAME
from message_handler import handle_message

def connect_to_rabbitmq():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials
    )
    
    while True:
        try:
            print("Attempting to connect to RabbitMQ...")
            connection = pika.BlockingConnection(parameters)
            print("Connected successfully!")
            return connection
        except pika.exceptions.AMQPConnectionError:
            print("Connection failed. Retrying in 5 seconds...")
            time.sleep(5)

def on_message_received(ch, method, properties, body):
    # Lấy thông số retry count từ headers (nếu có, mặc định = 0)
    headers = properties.headers or {}
    retry_count = headers.get("x-retry-count", 0)
    
    try:
        message = json.loads(body.decode('utf-8'))
        
        # Gọi xử lý nghiệp vụ chính
        handle_message(message)
        
        # Xác nhận xử lý thành công (ACK)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        
        # Logic Retry: Tối đa 3 lần thử lại (retry_count = 0, 1, 2)
        if retry_count < 3:
            new_retry_count = retry_count + 1
            # Exponential Backoff: Lần 1: 2s, Lần 2: 4s, Lần 3: 8s
            backoff_delay = 2 ** new_retry_count
            print(f"[Retry] Attempt {new_retry_count}/3 failed. Sleeping for {backoff_delay} seconds...")
            time.sleep(backoff_delay)
            
            # Cập nhật số lần retry vào headers mới
            new_headers = headers.copy()
            new_headers["x-retry-count"] = new_retry_count
            
            # Đẩy lại message vào Queue chính (republish) với headers mới
            properties.headers = new_headers
            ch.basic_publish(
                exchange='',
                routing_key=QUEUE_NAME,
                body=body,
                properties=properties
            )
            
            # ACK tin nhắn cũ để không bị giữ trùng lặp
            ch.basic_ack(delivery_tag=method.delivery_tag)
            print(f"[Retry] Message republish successfully.")
        else:
            # Vượt quá 3 lần -> Reject (requeue=False) để RabbitMQ đẩy sang Dead Letter Queue (DLQ)
            print(f"[DLQ] Max retries (3) reached for message. Rejecting to DLQ...")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def main():
    connection = connect_to_rabbitmq()
    channel = connection.channel()

    # Khai báo queue phòng trường hợp nó chưa được tạo từ bên Backend
    channel.queue_declare(queue=QUEUE_NAME, durable=True, arguments={
        'x-dead-letter-exchange': 'ticket.direct.exchange',
        'x-dead-letter-routing-key': 'ticket.failed.key'
    })
    
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message_received)

    print("Worker started. Waiting for messages...")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("\nStopping worker...")
        channel.stop_consuming()
        connection.close()

if __name__ == '__main__':
    main()
