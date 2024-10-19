from flask import Flask, render_template, request, jsonify, session
from dotenv import load_dotenv
import os
import uuid
import json

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'fallback_secret_key')

# Ensure the data directory exists
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# AI models dictionary
AI_MODELS = {
    'OpenAI': 'openai-20231130-31',
    'Claude': 'claude-v1',
    'GPT-4': 'gpt4-20230630'
}

def generate_chat_id():
    return str(uuid.uuid4())

def get_chat_file_path(chat_id):
    return os.path.join(DATA_DIR, f"{chat_id}.json")

def save_chat(chat_id, chat_data):
    with open(get_chat_file_path(chat_id), 'w') as f:
        json.dump(chat_data, f)

def load_chat(chat_id):
    try:
        with open(get_chat_file_path(chat_id), 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None

@app.route('/')
def home():
    return render_template('index.html', ai_models=AI_MODELS)

@app.route('/new_chat', methods=['POST'])
def new_chat():
    chat_id = generate_chat_id()
    ai_model = request.form.get('ai_model')
    chat_data = {
        'ai_model': ai_model,
        'name': f"New Chat ({ai_model})",
        'context': "",
        'artifacts': [],
        'messages': []
    }
    save_chat(chat_id, chat_data)
    return jsonify({'chat_id': chat_id, 'ai_model': ai_model, 'name': chat_data['name']})

@app.route('/chat/<chat_id>', methods=['GET', 'POST'])
def chat(chat_id):
    chat_data = load_chat(chat_id)
    if chat_data is None:
        return "Chat not found", 404

    if request.method == 'POST':
        user_message = request.form.get('message')
        chat_data['messages'].append(('user', user_message))
        
        # Placeholder AI response (replace with actual AI integration)
        ai_response = f"This is a placeholder response from {chat_data['ai_model']}."
        chat_data['messages'].append(('ai', ai_response))
        
        save_chat(chat_id, chat_data)
        return jsonify({'response': ai_response})
    
    return render_template('chat.html', chat_id=chat_id, chat_data=chat_data, ai_models=AI_MODELS)

@app.route('/chat/<chat_id>/history')
def chat_history(chat_id):
    chat_data = load_chat(chat_id)
    if chat_data is None:
        return "Chat not found", 404
    return jsonify(chat_data['messages'])

@app.route('/chats')
def list_chats():
    chats = []
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            chat_id = filename[:-5]  # Remove .json extension
            chat_data = load_chat(chat_id)
            chats.append({
                'id': chat_id,
                'name': chat_data.get('name', f"Chat {chat_id}"),
                'ai_model': chat_data['ai_model'],
                'message_count': len(chat_data['messages'])
            })
    return jsonify(chats)

@app.route('/chat/<chat_id>/setup', methods=['GET', 'POST'])
def chat_setup(chat_id):
    chat_data = load_chat(chat_id)
    if chat_data is None:
        return "Chat not found", 404

    if request.method == 'POST':
        chat_data['name'] = request.form.get('name', chat_data['name'])
        chat_data['context'] = request.form.get('context', chat_data['context'])
        chat_data['ai_model'] = request.form.get('ai_model', chat_data['ai_model'])
        save_chat(chat_id, chat_data)
        return jsonify({'success': True})

    return jsonify(chat_data)

@app.route('/chat/<chat_id>/artifact', methods=['POST'])
def add_artifact(chat_id):
    chat_data = load_chat(chat_id)
    if chat_data is None:
        return "Chat not found", 404

    artifact = {
        'name': request.form.get('name'),
        'description': request.form.get('description'),
        'content': request.form.get('content')
    }
    chat_data['artifacts'].append(artifact)
    save_chat(chat_id, chat_data)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
