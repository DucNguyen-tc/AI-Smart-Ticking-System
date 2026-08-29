from unittest.mock import patch, MagicMock
from message_handler import handle_message


@patch('message_handler.get_ticket')
@patch('message_handler.analyze_ticket')
@patch('message_handler.save_ai_analysis')
@patch('message_handler.update_ticket_status')
@patch('message_handler.invalidate_cache')
def test_handle_message_success(
    mock_invalidate_cache,
    mock_update_status,
    mock_save_analysis,
    mock_analyze_ticket,
    mock_get_ticket
):
    # Thiết lập mock data
    mock_ticket = {
        "title": "Hỏng mạng internet",
        "content": "Tôi không kết nối được wifi",
        "service_type": "TECHNICAL_BUG"
    }
    mock_get_ticket.return_value = mock_ticket

    mock_analysis = {
        "sentiment": "NEUTRAL",
        "priority": "HIGH",
        "category": "TECHNICAL_BUG",
        "summary": "Wifi bị hỏng.",
        "suggested_reply": "Chúng tôi đang xử lý.",
        "confidence_score": 0.95
    }
    mock_analyze_ticket.return_value = mock_analysis

    # Chạy thử hàm điều phối chính
    handle_message({"ticketId": "test-uuid"})

    # Xác thực cuộc gọi hàm
    mock_get_ticket.assert_called_once_with("test-uuid")
    mock_analyze_ticket.assert_called_once_with(
        title="Hỏng mạng internet",
        content="Tôi không kết nối được wifi",
        service_type="TECHNICAL_BUG"
    )
    mock_save_analysis.assert_called_once_with("test-uuid", mock_analysis)
    mock_update_status.assert_called_once_with("test-uuid", "PROCESSED")
    assert mock_invalidate_cache.call_count == 2


@patch('message_handler.get_ticket')
@patch('gemini_client.genai.GenerativeModel')
@patch('message_handler.save_ai_analysis')
@patch('message_handler.update_ticket_status')
@patch('message_handler.invalidate_cache')
def test_handle_message_billing_double_charge(
    mock_invalidate_cache,
    mock_update_status,
    mock_save_analysis,
    mock_generative_model,
    mock_get_ticket
):
    # Mock ticket from database
    mock_ticket = {
        "title": "Bị trừ tiền 2 lần",
        "content": "Tôi mua hàng bị trừ tiền 2 lần tài khoản ngân hàng",
        "service_type": "BILLING"
    }
    mock_get_ticket.return_value = mock_ticket

    # Mock response từ Gemini API
    mock_model_instance = MagicMock()
    mock_generative_model.return_value = mock_model_instance
    mock_response = MagicMock()
    mock_response.text = """
    {
        "sentiment": "ANGRY",
        "priority": "URGENT",
        "category": "BILLING",
        "summary": "Khách hàng bị trừ tiền 2 lần.",
        "suggested_reply": "Xin lỗi vì sự bất tiện này...",
        "confidence_score": 0.98
    }
    """
    mock_model_instance.generate_content.return_value = mock_response

    # Chạy thử hàm điều phối chính
    handle_message({"ticketId": "double-charge-uuid"})

    # Xác thực cuộc gọi hàm và dữ liệu
    mock_get_ticket.assert_called_once_with("double-charge-uuid")
    mock_save_analysis.assert_called_once()
    saved_analysis = mock_save_analysis.call_args[0][1]
    assert saved_analysis["sentiment"] == "ANGRY"
    assert saved_analysis["priority"] == "URGENT"
    mock_update_status.assert_called_once_with("double-charge-uuid", "PROCESSED")
    assert mock_invalidate_cache.call_count == 2


@patch('message_handler.get_ticket')
@patch('gemini_client.genai.GenerativeModel')
@patch('message_handler.save_ai_analysis')
@patch('message_handler.update_ticket_status')
@patch('message_handler.invalidate_cache')
def test_handle_message_password_reset(
    mock_invalidate_cache,
    mock_update_status,
    mock_save_analysis,
    mock_generative_model,
    mock_get_ticket
):
    # Mock ticket từ database
    mock_ticket = {
        "title": "Hỏi cách đổi mật khẩu",
        "content": "Làm thế nào để đổi mật khẩu tài khoản?",
        "service_type": "ACCOUNT"
    }
    mock_get_ticket.return_value = mock_ticket

    # Mock response từ Gemini API
    mock_model_instance = MagicMock()
    mock_generative_model.return_value = mock_model_instance
    mock_response = MagicMock()
    mock_response.text = """
    {
        "sentiment": "NEUTRAL",
        "priority": "LOW",
        "category": "FAQ",
        "summary": "Hỏi cách đổi mật khẩu.",
        "suggested_reply": "Bạn truy cập cài đặt để đổi mật khẩu.",
        "confidence_score": 0.92
    }
    """
    mock_model_instance.generate_content.return_value = mock_response

    # Chạy thử hàm điều phối chính
    handle_message({"ticketId": "password-reset-uuid"})

    # Xác thực cuộc gọi hàm và dữ liệu
    mock_get_ticket.assert_called_once_with("password-reset-uuid")
    mock_save_analysis.assert_called_once()
    saved_analysis = mock_save_analysis.call_args[0][1]
    assert saved_analysis["category"] == "FAQ"
    assert saved_analysis["priority"] == "LOW"
    mock_update_status.assert_called_once_with("password-reset-uuid", "PROCESSED")
    assert mock_invalidate_cache.call_count == 2
