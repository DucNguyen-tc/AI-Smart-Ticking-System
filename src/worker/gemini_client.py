import json
import re
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from config import GEMINI_API_KEY
from prompt_template import ANALYSIS_PROMPT

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def analyze_ticket(title: str, content: str, service_type: str) -> dict:
    """
    Gọi Gemini API để phân tích thông tin của ticket và trả về một dict chứa kết quả.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured in environment variables.")

    prompt = ANALYSIS_PROMPT.format(title=title, content=content, service_type=service_type)
    
    try:
        model = genai.GenerativeModel("gemini-3.6-flash")
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Dọn dẹp markdown block ```json ... ``` nếu Gemini tự bọc
        cleaned_response = re.sub(r"^```json\s*|```$", "", text_response, flags=re.MULTILINE).strip()
        
        # Parse kết quả dạng JSON sang dict trong Python
        analysis_result = json.loads(cleaned_response)
        
        # Kiểm tra các trường tối thiểu cần có
        required_fields = ["sentiment", "priority", "category", "summary", "suggested_reply", "confidence_score"]
        for field in required_fields:
            if field not in analysis_result:
                analysis_result[field] = None
                
        return analysis_result

    except ResourceExhausted as e:
        print("Gemini API Rate Limit Exceeded (429). Triggering retry...")
        raise e
    except json.JSONDecodeError as e:
        print(f"Failed to parse Gemini response as JSON. Original response: {response.text}")
        raise e
    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        raise e
