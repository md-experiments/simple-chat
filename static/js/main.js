document.addEventListener('DOMContentLoaded', function() {
    const newChatBtn = document.getElementById('newChatBtn');
    const createChatBtn = document.getElementById('createChatBtn');
    const chatList = document.getElementById('chatList');
    const chatContainer = document.getElementById('chatContainer');
    const aiModelModal = new bootstrap.Modal(document.getElementById('aiModelModal'));
    const setupModal = new bootstrap.Modal(document.getElementById('setupModal'));

    newChatBtn.addEventListener('click', function() {
        aiModelModal.show();
    });

    createChatBtn.addEventListener('click', function() {
        const selectedAI = document.getElementById('aiModelSelect').value;
        createNewChat(selectedAI);
        aiModelModal.hide();
    });

    function createNewChat(aiModel) {
        fetch('/new_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `ai_model=${aiModel}`
        })
        .then(response => response.json())
        .then(data => {
            const chatId = data.chat_id;
            addChatToList(chatId, data.name, 0, data.ai_model);
            loadChat(chatId);
        });
    }

    function addChatToList(chatId, name, messageCount, aiModel) {
        const li = document.createElement('li');
        li.className = 'nav-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <a class="nav-link" href="#" data-chat-id="${chatId}">${name} - ${messageCount} messages</a>
            <button class="btn btn-sm btn-outline-secondary setup-btn" data-chat-id="${chatId}">
                <i class="fas fa-cog"></i>
            </button>
        `;
        li.querySelector('a').addEventListener('click', function(e) {
            e.preventDefault();
            loadChat(chatId);
        });
        li.querySelector('.setup-btn').addEventListener('click', function(e) {
            e.preventDefault();
            openSetupModal(chatId);
        });
        chatList.appendChild(li);
    }

    function loadChat(chatId) {
        fetch(`/chat/${chatId}`)
        .then(response => response.text())
        .then(html => {
            chatContainer.innerHTML = html;
            initializeChatFunctionality(chatId);
        });
    }

    function initializeChatFunctionality(chatId) {
        const messageForm = document.getElementById('messageForm');
        const userMessageInput = document.getElementById('userMessage');
        const chatMessages = document.getElementById('chatMessages');

        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = userMessageInput.value.trim();
            if (message) {
                sendMessage(chatId, message);
                userMessageInput.value = '';
            }
        });

        function sendMessage(chatId, message) {
            fetch(`/chat/${chatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `message=${encodeURIComponent(message)}`
            })
            .then(response => response.json())
            .then(data => {
                addMessageToChat(message, true);
                addMessageToChat(data.response, false);
                updateChatListMessageCount(chatId);
            });
        }

        function addMessageToChat(message, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
            messageDiv.textContent = message;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Load chat history
        fetch(`/chat/${chatId}/history`)
        .then(response => response.json())
        .then(messages => {
            messages.forEach(([sender, message]) => {
                addMessageToChat(message, sender === 'user');
            });
        });
    }

    function updateChatListMessageCount(chatId) {
        fetch(`/chat/${chatId}/history`)
        .then(response => response.json())
        .then(messages => {
            const chatLink = document.querySelector(`a[data-chat-id="${chatId}"]`);
            if (chatLink) {
                const text = chatLink.textContent;
                const newText = text.replace(/\d+ messages/, `${messages.length} messages`);
                chatLink.textContent = newText;
            }
        });
    }

    function openSetupModal(chatId) {
        fetch(`/chat/${chatId}/setup`)
        .then(response => response.json())
        .then(chatData => {
            document.getElementById('setupChatId').value = chatId;
            document.getElementById('setupChatName').value = chatData.name;
            document.getElementById('setupAiModel').value = chatData.ai_model;
            document.getElementById('setupChatContext').value = chatData.context;
            
            const artifactsList = document.getElementById('artifactsList');
            artifactsList.innerHTML = '';
            chatData.artifacts.forEach((artifact, index) => {
                const li = document.createElement('li');
                li.textContent = `${artifact.name}: ${artifact.description}`;
                artifactsList.appendChild(li);
            });
            
            setupModal.show();
        });
    }

    document.getElementById('setupForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const chatId = document.getElementById('setupChatId').value;
        const name = document.getElementById('setupChatName').value;
        const aiModel = document.getElementById('setupAiModel').value;
        const context = document.getElementById('setupChatContext').value;

        fetch(`/chat/${chatId}/setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `name=${encodeURIComponent(name)}&ai_model=${encodeURIComponent(aiModel)}&context=${encodeURIComponent(context)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateChatListName(chatId, name);
                setupModal.hide();
            }
        });
    });

    document.getElementById('addArtifactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const chatId = document.getElementById('setupChatId').value;
        const name = document.getElementById('artifactName').value;
        const description = document.getElementById('artifactDescription').value;
        const content = document.getElementById('artifactContent').value;

        fetch(`/chat/${chatId}/artifact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&content=${encodeURIComponent(content)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const artifactsList = document.getElementById('artifactsList');
                const li = document.createElement('li');
                li.textContent = `${name}: ${description}`;
                artifactsList.appendChild(li);
                
                document.getElementById('artifactName').value = '';
                document.getElementById('artifactDescription').value = '';
                document.getElementById('artifactContent').value = '';
            }
        });
    });

    function updateChatListName(chatId, newName) {
        const chatLink = document.querySelector(`a[data-chat-id="${chatId}"]`);
        if (chatLink) {
            const text = chatLink.textContent;
            const newText = text.replace(/^.*? -/, `${newName} -`);
            chatLink.textContent = newText;
        }
    }

    // Load existing chats when the page loads
    fetch('/chats')
    .then(response => response.json())
    .then(chats => {
        chats.forEach(chat => {
            addChatToList(chat.id, chat.name, chat.message_count, chat.ai_model);
        });
    });
});
