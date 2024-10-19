document.addEventListener('DOMContentLoaded', function() {
    const newChatBtn = document.getElementById('newChatBtn');
    const createChatBtn = document.getElementById('createChatBtn');
    const chatList = document.getElementById('chatList');
    const chatContainer = document.getElementById('chatContainer');
    const aiModelModal = new bootstrap.Modal(document.getElementById('aiModelModal'));

    newChatBtn.addEventListener('click', function() {
        aiModelModal.show();
    });

    createChatBtn.addEventListener('click', function() {
        const selectedAI = document.querySelector('input[name="aiModel"]:checked').value;
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
            addChatToList(chatId, aiModel);
            loadChat(chatId);
        });
    }

    function addChatToList(chatId, aiModel) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = `<a class="nav-link" href="#" data-chat-id="${chatId}">Chat ${chatList.children.length + 1} (${aiModel})</a>`;
        li.querySelector('a').addEventListener('click', function(e) {
            e.preventDefault();
            loadChat(chatId);
        });
        chatList.appendChild(li);
    }

    function loadChat(chatId) {
        fetch(`/chat/${chatId}`)
        .then(response => response.text())
        .then(html => {
            chatContainer.innerHTML = html;
        });
    }
});
