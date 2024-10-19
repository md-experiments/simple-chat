document.addEventListener('DOMContentLoaded', function() {
    const messageForm = document.getElementById('messageForm');
    const userMessageInput = document.getElementById('userMessage');
    const chatMessages = document.getElementById('chatMessages');
    const selectedAI = document.getElementById('selectedAI');

    // Get the chat ID from the URL
    const chatId = window.location.pathname.split('/').pop();

    // Function to add a message to the chat
    function addMessageToChat(message, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle form submission
    messageForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = userMessageInput.value.trim();
        if (message) {
            addMessageToChat(message, true);
            sendMessage(message);
            userMessageInput.value = '';
        }
    });

    // Function to send a message to the server
    function sendMessage(message) {
        fetch(`/chat/${chatId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `message=${encodeURIComponent(message)}`
        })
        .then(response => response.json())
        .then(data => {
            addMessageToChat(data.response, false);
        });
    }

    // Function to load chat history (placeholder)
    function loadChatHistory() {
        // This would typically involve a fetch request to get the chat history
        // For now, we'll just add a welcome message
        addMessageToChat("Welcome to the chat! How can I assist you today?", false);
    }

    // Load chat history when the page loads
    loadChatHistory();

    // Set the selected AI (this would typically come from the server)
    selectedAI.textContent = "Claude"; // or "OpenAI", depending on what was selected
});
