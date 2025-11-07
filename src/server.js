require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const authRoutes = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve os arquivos da pasta 'public'
app.use('/api/auth', authRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Em produção, restrinja para o domínio do seu frontend
        methods: ["GET", "POST"]
    }
});

// Objeto para manter o controle dos usuários conectados: { username: socket.id }
const connectedUsers = {};

io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Autenticação do socket
    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const username = decoded.username;
            
            // Armazena o usuário e seu socket.id
            connectedUsers[username] = socket.id;
            socket.username = username; // Anexa o username ao objeto socket para fácil acesso
            
            // Envia a lista de usuários atualizada para TODOS os clientes
            io.emit('update-user-list', Object.keys(connectedUsers));
            console.log(`Usuário '${username}' autenticado. Usuários online:`, Object.keys(connectedUsers));
        } catch (error) {
            console.log(`Autenticação falhou para o socket ${socket.id}`);
            socket.disconnect();
        }
    });

    // Ouvir por mensagens privadas
    socket.on('private-message', async ({ recipient, message }) => {
        const recipientSocketId = connectedUsers[recipient];
        const sender = socket.username;

        if (recipientSocketId) {
            // Salva a mensagem no banco de dados
            await db.query('INSERT INTO messages (sender, recipient, message) VALUES (?, ?, ?)', [sender, recipient, message]);
            
            const messageData = { sender, message, createdAt: new Date() };
            
            // Envia a mensagem para o destinatário
            io.to(recipientSocketId).emit('private-message', messageData);
            // Envia a mensagem de volta para o remetente (para aparecer em sua própria tela)
            socket.emit('private-message', messageData);
        }
    });

    // Ouvir por pedido de histórico de mensagens
    socket.on('load-history', async (recipient) => {
        const sender = socket.username;
        const [history] = await db.query(
            `SELECT sender, message, createdAt FROM messages 
             WHERE (sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)
             ORDER BY createdAt ASC`,
            [sender, recipient, recipient, sender]
        );
        socket.emit('history', history);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete connectedUsers[socket.username];
            // Envia a lista atualizada para todos
            io.emit('update-user-list', Object.keys(connectedUsers));
            console.log(`Usuário '${socket.username}' desconectado. Usuários online:`, Object.keys(connectedUsers));
        }
        console.log(`Socket desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));