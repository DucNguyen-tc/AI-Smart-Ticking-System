from db_client import get_ticket, save_ai_analysis, update_ticket_status
from gemini_client import analyze_ticket
from redis_client import invalidate_cache

def handle_message(message: dict):
    """
    Điều phối luồng xử lý:
    1. Đọc ticket từ PostgreSQL.
    2. Gửi ticket sang Gemini AI phân tích.
    3. Lưu kết quả phân tích AI và cập nhật trạng thái ticket.
    4. Xóa cache danh sách ưu tiên trên Redis.
    """
    ticket_id = message.get("ticketId")
    if not ticket_id:
        raise ValueError("Message body does not contain a valid 'ticketId'.")

    print(f"\n[Processing] Start analysis for ticket_id: {ticket_id}")

    # 1. Đọc dữ liệu ticket từ Postgres
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise ValueError(f"Ticket with ID {ticket_id} not found in database.")

    print(f"[Database] Fetched ticket: '{ticket['title']}' (Type: {ticket['service_type']})")

    # 2. Gọi Gemini API để phân tích
    analysis_result = analyze_ticket(
        title=ticket["title"],
        content=ticket["content"],
        service_type=ticket["service_type"]
    )
    print(f"[Gemini] Successfully analyzed. Confidence: {analysis_result.get('confidence_score')}")

    # 3. Lưu kết quả phân tích và cập nhật trạng thái sang PROCESSED trong DB
    save_ai_analysis(ticket_id, analysis_result)
    update_ticket_status(ticket_id, 'PROCESSED')
    print(f"[Database] Saved analysis & updated ticket status to PROCESSED.")

    # 4. Xóa cache trên Redis để buộc Client tải lại dữ liệu mới nhất
    # Xóa cả danh sách ưu tiên và chi tiết ticket đó
    invalidate_cache("cache:tickets:*")
    invalidate_cache(f"cache:ticket:{ticket_id}")
    print(f"[Cache] Invalidated related caches. Done processing ticket_id: {ticket_id}\n")
