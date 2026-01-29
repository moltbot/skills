import google.generativeai as genai
import sys
import os

def parse_with_gemini(pdf_path):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY environment variable not set."

    genai.configure(api_key=api_key)

    try:
        # Upload the file
        sample_file = genai.upload_file(path=pdf_path, display_name="Japanese Homework")
        
        # Use a model that supports multimodal input
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")

        prompt = """
        Please transcribe the content of this PDF in detail.
        1. Extract all Japanese text (Kanji/Kana) and provide readings/translations if possible.
        2. Describe any images or diagrams, especially if they contain questions or exercises.
        3. If there are questions with arrows (e.g., "arrow up means question 1"), explain the context.
        4. Organize the output clearly with headers.
        """

        response = model.generate_content([sample_file, prompt])
        return response.text

    except Exception as e:
        return f"Error using Gemini API: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python parse_pdf_gemini.py <pdf_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    # Set stdout to utf-8
    sys.stdout.reconfigure(encoding='utf-8')
    
    print(parse_with_gemini(pdf_path))
