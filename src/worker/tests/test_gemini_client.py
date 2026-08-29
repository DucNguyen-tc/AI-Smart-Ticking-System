import pytest
import json
from unittest.mock import patch, MagicMock
from gemini_client import analyze_ticket


@patch('gemini_client.genai.GenerativeModel')
def test_analyze_ticket_json_parsing(mock_generative_model):
    # Giả lập Gemini trả về JSON chuẩn
    mock_model_instance = MagicMock()
    mock_generative_model.return_value = mock_model_instance

    mock_response = MagicMock()
    mock_response.text = """
    {
        "sentiment": "ANGRY",
        "priority": "URGENT",
        "category": "REFUND",
        "summary": "Muốn hoàn tiền.",
        "suggested_reply": "Xin chào...",
        "confidence_score": 0.99
    }
    """
    mock_model_instance.generate_content.return_value = mock_response

    # Chạy thử
    result = analyze_ticket("Title", "Content", "REFUND")

    # Xác thực kết quả đã được giải mã chính xác
    assert result["sentiment"] == "ANGRY"
    assert result["priority"] == "URGENT"
    assert result["confidence_score"] == 0.99


@patch('gemini_client.genai.GenerativeModel')
def test_analyze_ticket_cleanup_markdown(mock_generative_model):
    # Giả lập Gemini bọc markdown block ```json
    mock_model_instance = MagicMock()
    mock_generative_model.return_value = mock_model_instance

    mock_response = MagicMock()
    mock_response.text = """
    ```json
    {
        "sentiment": "POSITIVE",
        "priority": "LOW",
        "category": "FAQ",
        "summary": "Tốt.",
        "suggested_reply": "Cảm ơn",
        "confidence_score": 0.85
    }
    ```
    """
    mock_model_instance.generate_content.return_value = mock_response

    # Chạy thử
    result = analyze_ticket("Title", "Content", "FAQ")

    # Xác thực hàm Regex đã dọn dẹp markdown và parse bình thường
    assert result["sentiment"] == "POSITIVE"
    assert result["priority"] == "LOW"


@patch('gemini_client.genai.GenerativeModel')
def test_analyze_ticket_invalid_json(mock_generative_model):
    # Giả lập Gemini trả về nội dung không phải JSON
    mock_model_instance = MagicMock()
    mock_generative_model.return_value = mock_model_instance

    mock_response = MagicMock()
    mock_response.text = "Đây không phải là chuỗi JSON hợp lệ!"
    mock_model_instance.generate_content.return_value = mock_response

    # Xác thực việc quăng ra lỗi JSONDecodeError
    with pytest.raises(json.JSONDecodeError):
        analyze_ticket("Title", "Content", "FAQ")
