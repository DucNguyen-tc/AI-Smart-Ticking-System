import redis
from config import REDIS_HOST, REDIS_PORT

def get_redis_client():
    return redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        decode_responses=True # Giải mã byte trả về dạng chuỗi tự động
    )

def invalidate_cache(key_pattern: str):
    """
    Xóa tất cả các key khớp với pattern truyền vào trên Redis (Ví dụ: cache:tickets:*).
    """
    client = get_redis_client()
    try:
        # Tìm các key khớp với pattern
        keys = client.keys(key_pattern)
        if keys:
            client.delete(*keys)
            print(f"Invalidated {len(keys)} Redis keys matching pattern '{key_pattern}'")
    except Exception as e:
        print(f"Error communicating with Redis: {str(e)}")
    finally:
        client.close()
