document.addEventListener('DOMContentLoaded', function() {
    const newChatBtn = document.getElementById('newChatBtn');
    const createChatBtn = document.getElementById('createChatBtn');
    const chatList = document.getElementById('chatList');
    const chatContainer = document.getElementById('chatContainer');
    const currentChatName = document.getElementById('currentChatName');
    const aiModelModal = new bootstrap.Modal(document.getElementById('aiModelModal'));
    const setupModal = new bootstrap.Modal(document.getElementById('setupModal'));
    const darkModeSwitch = document.getElementById('darkModeSwitch');

    let currentChatId = null;

    // Dark mode toggle
    darkModeSwitch.addEventListener('change', function() {
        document.documentElement.classList.toggle('dark-mode', this.checked);
        localStorage.setItem('darkMode', this.checked);
    });

    // Set initial dark mode state
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
        darkModeSwitch.checked = JSON.parse(savedDarkMode);
        document.documentElement.classList.toggle('dark-mode', darkModeSwitch.checked);
    }

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
        })
        .catch(error => console.error('Error creating new chat:', error));
    }

    function addChatToList(chatId, name, messageCount, aiModel) {
        const li = document.createElement('li');
        li.className = 'nav-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <a class="nav-link" href="#" data-chat-id="${chatId}">${name} - ${messageCount} messages</a>
            <div>
                <button class="btn btn-sm btn-outline-secondary setup-btn" data-chat-id="${chatId}">
                    <i class="fas fa-cog"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-chat-id="${chatId}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        li.querySelector('a').addEventListener('click', function(e) {
            e.preventDefault();
            loadChat(chatId);
        });
        li.querySelector('.setup-btn').addEventListener('click', function(e) {
            e.preventDefault();
            openSetupModal(chatId);
        });
        li.querySelector('.delete-btn').addEventListener('click', function(e) {
            e.preventDefault();
            deleteChat(chatId);
        });
        chatList.appendChild(li);
    }

    function deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            fetch(`/chat/${chatId}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const chatItem = document.querySelector(`li a[data-chat-id="${chatId}"]`).closest('li');
                    chatItem.remove();
                    if (currentChatId === chatId) {
                        chatContainer.innerHTML = '';
                        currentChatId = null;
                        currentChatName.textContent = '';
                    }
                    console.log(data.message); // Log success message
                } else {
                    console.error('Error deleting chat:', data.error);
                    alert('Failed to delete chat. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error deleting chat:', error);
                alert('Failed to delete chat. Please try again.');
            });
        }
    }

    function loadChat(chatId) {
        fetch(`/chat/${chatId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentChatId = chatId;
            currentChatName.textContent = data.name;
            chatContainer.innerHTML = '<div id="chatMessages"></div>';
            initializeChatFunctionality(chatId);
            highlightSelectedChat(chatId);
            displayChatMessages(data.messages || []);
        })
        .catch(error => {
            console.error('Error loading chat:', error);
            chatContainer.innerHTML = '<p>Error loading chat. Please try again.</p>';
        });
    }

    function displayChatMessages(messages) {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        messages.forEach(message => {
            if (Array.isArray(message) && message.length === 2) {
                addMessageToChat(message[1], message[0] === 'user', chatMessages);
            } else {
                console.error('Invalid message format:', message);
            }
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function highlightSelectedChat(chatId) {
        const chatItems = chatList.querySelectorAll('li');
        chatItems.forEach(item => {
            const link = item.querySelector('a');
            if (link.dataset.chatId === chatId) {
                item.classList.add('selected-chat');
            } else {
                item.classList.remove('selected-chat');
            }
        });
    }

    function initializeChatFunctionality(chatId) {
        const messageForm = document.createElement('form');
        messageForm.id = 'messageForm';
        messageForm.className = 'mt-3';
        messageForm.innerHTML = `
            <div class="input-group">
                <input type="text" id="userMessage" class="form-control" placeholder="Type your message...">
                <button class="btn btn-primary" type="submit">Send</button>
            </div>
        `;
        chatContainer.appendChild(messageForm);

        const userMessageInput = document.getElementById('userMessage');

        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = userMessageInput.value.trim();
            if (message) {
                sendMessage(chatId, message);
                userMessageInput.value = '';
            }
        });
    }
    
    function sendMessage(chatId, message) {
        // Add user message to chat immediately
        addMessageToChat(message, true);

        // Show loading indicator
        showLoadingIndicator();

        fetch(`/chat/${chatId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `message=${encodeURIComponent(message)}`
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading indicator
            hideLoadingIndicator();

            // Add AI response to chat
            addMessageToChat(data.response, false);
            updateChatListMessageCount(chatId);
        })
        .catch(error => {
            console.error('Error sending message:', error);
            hideLoadingIndicator();
            addMessageToChat("An error occurred while processing your message. Please try again.", false);
        });
    }

    function showLoadingIndicator() {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.className = 'spinner-border text-primary';
        loadingIndicator.setAttribute('role', 'status');
        loadingIndicator.innerHTML = '<span class="visually-hidden">Loading...</span>';
        document.getElementById('chatMessages').appendChild(loadingIndicator);
    }

    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    function addMessageToChat(message, isUser, container = document.getElementById('chatMessages')) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        messageDiv.innerHTML = formatMessage(message);
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    function formatMessage(message) {
        // Replace newlines with <br> tags
        let formattedMessage = message.replace(/\n/g, '<br>');
        
        // Replace **bold** with <strong>bold</strong>
        formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Replace *italic* with <em>italic</em>
        formattedMessage = formattedMessage.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Replace `code` with <code>code</code>
        formattedMessage = formattedMessage.replace(/`(.*?)`/g, '<code>$1</code>');

        return formattedMessage;
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
        })
        .catch(error => console.error('Error updating message count:', error));
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
        })
        .catch(error => console.error('Error opening setup modal:', error));
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
                if (currentChatId === chatId) {
                    currentChatName.textContent = name;
                }
                setupModal.hide();
            }
        })
        .catch(error => console.error('Error updating chat setup:', error));
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
        })
        .catch(error => console.error('Error adding artifact:', error));
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
        if (chats.length > 0) {
            loadChat(chats[0].id);
        }
    })
    .catch(error => console.error('Error loading chats:', error));
});
