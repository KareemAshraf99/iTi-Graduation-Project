from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os
import re

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise ValueError("يرجى ضبط مفتاح HF_TOKEN في ملف .env")

client = InferenceClient(provider="fireworks-ai", api_key=HF_TOKEN)

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return send_from_directory('.', 'ai.html')

@app.route('/ask', methods=['POST'])
def ask():
    question = request.json.get('question')
    if not question:
        return jsonify({"response": ["يرجى إدخال السؤال."]}), 400
    try:
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-R1",
            messages=[{"role": "user", "content": question}],
            max_tokens=500,
            temperature=0.7
        )
        answer = response.choices[0].message.content
        cleaned = re.sub(r"<think>.*?</think>|[*•\-]+", "", answer, flags=re.DOTALL).strip()
        lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
        return jsonify({"response": lines})
    except Exception as e:
        return jsonify({"response": [f"حدث خطأ أثناء المعالجة: {str(e)}"]}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8888)

