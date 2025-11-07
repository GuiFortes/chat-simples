document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    let socket;
    let currentUser = null;
    let currentRecipient = null;

    // Elementos das Views
    const loginView = document.getElementById('login-view');
    const chatView = document.getElementById('chat-view');

    // Elementos de Autenticação
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const authError = document.getElementById('auth-error');

    // Elementos do Chat
    const userList = document.getElementById('user-list');
    const currentUserDisplay = document.getElementById('current-user-display');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeMessage = document.getElementById('welcome-message');
    const chatWindow = document.getElementById('chat-window');
    const chattingWith = document.getElementById('chatting-with');
    const messages = document.getElementById('messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');

    // Função para trocar de tela
    const showView = (viewId) => {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    };
    
    // Requisição para API de autenticação
    const authRequest = async (endpoint, body) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            return data;
        } catch (error) {
            authError.textContent = error.message;
        }
    };

    // Eventos de Autenticação
    registerBtn.addEventListener('click', async () => {
        const body = { username: usernameInput.value, password: passwordInput.value };
        const data = await authRequest('register', body);
        if (data) alert(data.message);
    });

    loginBtn.addEventListener('click', async () => {
        const body = { username: usernameInput.value, password: passwordInput.value };
        const data = await authRequest('login', body);
        if (data && data.token) {
            localStorage.setItem('token', data.token);
            currentUser = data.username;
            connectToChat();
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        socket.disconnect();
        currentUser = null;
        currentRecipient = null;
        userList.innerHTML = '';
        showView('login-view');
    });

    // Função para conectar ao Socket.IO
    const connectToChat = () => {
        currentUserDisplay.textContent = currentUser;
        showView('chat-view');
        
        socket = io(API_URL);

        socket.on('connect', () => {
            const token = localStorage.getItem('token');
            socket.emit('authenticate', token);
        });

        socket.on('update-user-list', (users) => {
            userList.innerHTML = '';
            users.forEach(user => {
                if (user === currentUser) return; // Não mostra o próprio usuário na lista
                const li = document.createElement('li');
                li.textContent = `🟢 ${user}`;
                li.dataset.username = user;
                li.addEventListener('click', () => startPrivateChat(user));
                userList.appendChild(li);
            });
        });

        socket.on('private-message', ({ sender, message, createdAt }) => {
            // Só exibe a mensagem se for da conversa ativa
            if (sender === currentRecipient || sender === currentUser) {
                displayMessage(sender, message);
            }
        });

        socket.on('history', (history) => {
            console.log(history)
            messages.innerHTML = '';
            history.forEach(msg => displayMessage(msg.sender, msg.message, msg.createdAt));
        });
    };

    // Função para iniciar uma conversa
    const startPrivateChat = (recipient) => {
        currentRecipient = recipient;
        
        // Atualiza a interface
        document.querySelectorAll('#user-list li').forEach(li => li.classList.remove('active'));
        document.querySelector(`#user-list li[data-username='${recipient}']`).classList.add('active');

        welcomeMessage.classList.add('hidden');
        chatWindow.classList.remove('hidden');
        chattingWith.textContent = recipient;
        messages.innerHTML = '';

        // Pede o histórico de mensagens para o servidor
        socket.emit('load-history', recipient);
    };

    // Função para exibir uma mensagem na tela
    const displayMessage = (sender, message, createdAt) => {
        const li = document.createElement('li');
        // li.textContent = `${createdAt}`
        li.textContent = `${message}`;
        li.classList.add(sender === currentUser ? 'sent' : 'received');
        messages.appendChild(li);
        messages.scrollTop = messages.scrollHeight;
    };

    // Envio de mensagem
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value;
        if (message && currentRecipient) {
            socket.emit('private-message', { recipient: currentRecipient, message });
            messageInput.value = '';
        }
    });

    // Tenta reconectar se já houver um token
    const token = localStorage.getItem('token');
    if (token) {
        // Para simplificar, vamos decodificar o token no cliente para pegar o username
        // Em uma app real, você faria uma requisição a um endpoint '/me' para validar o token
        try {
            currentUser = JSON.parse(atob(token.split('.')[1])).username;
            connectToChat();
        } catch (e) {
            localStorage.removeItem('token');
        }
    }
});