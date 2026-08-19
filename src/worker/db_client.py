import psycopg2
from psycopg2.extras import RealDictCursor
from config import POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD

def get_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )

def get_ticket(ticket_id: str) -> dict:
    """
    Truy vấn thông tin chi tiết của ticket từ PostgreSQL.
    """
    conn = get_connection()
    try:
        # Sử dụng RealDictCursor để kết quả trả về là dict (key-value) giống JSON
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT title, content, service_type FROM tickets WHERE id = %s",
                (ticket_id,)
            )
            return cur.fetchone()
    finally:
        conn.close()

def save_ai_analysis(ticket_id: str, analysis: dict):
    """
    Lưu kết quả phân tích của Gemini vào bảng ai_analyses.
    Nếu đã có phân tích trước đó cho ticket_id này thì UPSERT (cập nhật mới).
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ai_analyses (ticket_id, sentiment, priority, category, summary, suggested_reply, confidence_score, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (ticket_id) DO UPDATE 
                SET sentiment = EXCLUDED.sentiment,
                    priority = EXCLUDED.priority,
                    category = EXCLUDED.category,
                    summary = EXCLUDED.summary,
                    suggested_reply = EXCLUDED.suggested_reply,
                    confidence_score = EXCLUDED.confidence_score,
                    created_at = NOW();
                """,
                (
                    ticket_id,
                    analysis.get("sentiment"),
                    analysis.get("priority"),
                    analysis.get("category"),
                    analysis.get("summary"),
                    analysis.get("suggested_reply"),
                    float(analysis.get("confidence_score") or 0.0)
                )
            )
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def update_ticket_status(ticket_id: str, status: str = 'PROCESSED'):
    """
    Cập nhật trạng thái ticket trong PostgreSQL.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE tickets SET status = %s, updated_at = NOW() WHERE id = %s",
                (status, ticket_id)
            )
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
