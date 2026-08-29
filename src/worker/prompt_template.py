ANALYSIS_PROMPT = """
Bạn là một AI chuyên gia phân tích ticket hỗ trợ khách hàng.
Phân tích nội dung ticket sau và trả về kết quả dưới dạng JSON:

Ticket Title: {title}
Ticket Content: {content}
Service Type: {service_type}

Trả về JSON với các trường:
- "sentiment": một trong ["POSITIVE", "NEUTRAL", "ANGRY"]
- "priority": một trong ["LOW", "MEDIUM", "HIGH", "URGENT"]
- "category": một trong ["REFUND", "TECHNICAL_BUG", "SHIPPING", "FAQ"]
- "summary": tóm tắt nội dung ticket trong 1-2 câu
- "suggested_reply": câu trả lời chuyên nghiệp gợi ý cho nhân viên CSKH
- "confidence_score": độ tin cậy từ 0.00 đến 1.00

Chỉ trả về JSON, không thêm bất kỳ văn bản nào bên ngoài cặp ngoặc nhọn. Không bọc kết quả trong block markdown ```json.
"""
