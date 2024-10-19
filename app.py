from flask import Flask, render_template, request, jsonify, session
import uuid

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Replace with a real secret key in production

# In-memory storage for chats (replace with a database in a real application)
chats = {}

@app.route('/')
def home():
    return render_template('index.html')

def generate_chat_id():
    return str(uuid.uuid4())

@app.route('/new_chat', methods=['POST'])
def new_chat():
    chat_id = generate_chat_id()
    ai_model = request.form.get('ai_model')
    chats[chat_id] = {'ai_model': ai_model, 'messages': []}
    return jsonify({'chat_id': chat_id, 'ai_model': ai_model})

@app.route('/chat/<chat_id>', methods=['GET', 'POST'])
def chat(chat_id):
    if chat_id not in chats:
        return "Chat not found", 404

    if request.method == 'POST':
        user_message = request.form.get('message')
        chats[chat_id]['messages'].append(('user', user_message))
        
        # Placeholder AI response (replace with actual AI integration)
        ai_response = f"This is a placeholder response from {chats[chat_id]['ai_model']}."
        chats[chat_id]['messages'].append(('ai', ai_response))
        
        return jsonify({'response': ai_response})
    
    return render_template('chat.html', chat_id=chat_id, ai_model=chats[chat_id]['ai_model'])

@app.route('/chat/<chat_id>/history')
def chat_history(chat_id):
    if chat_id not in chats:
        return "Chat not found", 404
    return jsonify(chats[chat_id]['messages'])

if __name__ == '__main__':
    app.run(debug=True, port=5001)
