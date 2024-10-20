# Simple Chat Application

This is a Flask-based chat application that allows users to interact with various AI language models. Users can create multiple chats, switch between them, and customize chat settings.

## Features

- Create and manage multiple chat sessions
- Support for different AI models (GPT-4, Claude, etc.)
- Real-time chat interface
- Dark mode toggle
- Chat context and artifact management
- Responsive design

## Prerequisites

- Python 3.7+
- pip (Python package manager)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/md-experiments/simple-chat
   cd simple-chat
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS and Linux:
     ```
     source venv/bin/activate
     ```

4. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

5. Copy the `.env.example` file to `.env` and fill in your API keys and other configuration:
   ```
   cp .env.example .env
   ```

## Usage

1. Start the Flask application:
   ```
   python app.py
   ```

2. Open a web browser and navigate to `http://127.0.0.1:5001`

3. Create a new chat by clicking the "New Chat" button and selecting an AI model.

4. Start chatting with the AI by typing messages in the input field and pressing Enter or clicking Send.

5. Use the sidebar to switch between different chats or create new ones.

6. Click the cog icon next to a chat to modify its settings or add artifacts.

7. Toggle dark mode using the switch in the sidebar.

## Project Structure

- `app.py`: Main Flask application file
- `llm.py`: Contains the logic for interacting with AI language models
- `static/`: Contains static files (CSS, JavaScript)
- `templates/`: Contains HTML templates
- `data/`: Stores chat data as JSON files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Flask
- OpenAI GPT
- Anthropic Claude
- Bootstrap

## Support

If you encounter any problems or have any questions, please open an issue in the GitHub repository.
