# Aplicação de Chat em Tempo Real com Lobby e Mensagens Privadas

## Sumário

Implementação de um sistema de chat full-stack construído com Node.js, Express, Socket.IO e MySQL. A aplicação permite que usuários se registrem, autentiquem, visualizem um lobby com outros usuários online e iniciem conversas privadas ponto-a-ponto em tempo real, com persistência de todo o histórico de mensagens.

## Features Principais

  * **Autenticação de Usuários:** Sistema de registro e login com senhas criptografadas (Bcrypt) e gerenciamento de sessão via JSON Web Tokens (JWT).
  * **Lobby de Usuários:** Exibição em tempo real da lista de usuários atualmente conectados à aplicação.
  * **Mensagens Privadas:** Comunicação privada e instantânea entre dois usuários, gerenciada via WebSockets.
  * **Persistência de Dados:** Todo o histórico de conversas e os dados de usuários são armazenados em um banco de dados relacional MySQL.

## Stack de Tecnologias

#### Backend

  * **Runtime:** Node.js
  * **Servidor:** Express.js
  * **Comunicação Real-Time:** Socket.IO
  * **Banco de Dados:** MySQL (utilizando o driver `mysql2`)
  * **Autenticação:** `jsonwebtoken` para geração de tokens JWT
  * **Segurança:** `bcryptjs` para hashing de senhas

#### Frontend

  * **Linguagem:** JavaScript (Vanilla)
  * **Estrutura:** HTML5
  * **Estilização:** CSS3
  * **Comunicação Real-Time:** Socket.IO Client

## Arquitetura do Sistema

O backend opera com um servidor Express que expõe uma API REST para fins de autenticação (`/register`, `/login`). Paralelamente, um servidor Socket.IO gerencia as conexões WebSocket persistentes dos clientes autenticados.

Após o login via API REST, o cliente recebe um token JWT. Em seguida, o cliente estabelece uma conexão WebSocket e se autentica enviando este token. O servidor então adiciona o usuário à lista de usuários ativos e gerencia o roteamento de mensagens privadas e a distribuição da lista de usuários online para todos os clientes conectados.

## Endpoints da API

A API REST é utilizada exclusivamente para o processo de autenticação.

  * `POST /api/auth/register`

      * Registra um novo usuário no banco de dados.
      * **Payload:** `{ "username": "seu_usuario", "password": "sua_senha" }`
      * **Resposta (Sucesso):** `{ "message": "Usuário registrado com sucesso." }` (Status `201`)

  * `POST /api/auth/login`

      * Autentica um usuário e retorna um token de acesso.
      * **Payload:** `{ "username": "seu_usuario", "password": "sua_senha" }`
      * **Resposta (Sucesso):** `{ "token": "seu_jwt_token", "username": "seu_usuario" }` (Status `200`)

## Eventos WebSocket

A comunicação em tempo real é gerenciada pelos seguintes eventos do Socket.IO:

#### Eventos Recebidos pelo Servidor (Client → Server)

  * `authenticate (token)`: Enviado pelo cliente imediatamente após a conexão, contendo o JWT para associar o socket a um usuário.
  * `load-history (recipient)`: Solicita o histórico de mensagens entre o usuário autenticado e o `recipient`.
  * `private-message ({ recipient, message })`: Envia uma nova mensagem privada para o `recipient`.

#### Eventos Emitidos pelo Servidor (Server → Client)

  * `update-user-list (users[])`: Enviado a todos os clientes sempre que um usuário se conecta ou desconecta. Contém um array com os nomes de todos os usuários online.
  * `history (messages[])`: Enviado em resposta ao `load-history`. Contém um array de objetos de mensagem.
  * `private-message ({ sender, message, createdAt })`: Enviado ao remetente e ao destinatário quando uma nova mensagem privada é processada.

## Configuração e Instalação

#### Pré-requisitos

  * Node.js (versão 18+ recomendada)
  * Servidor MySQL

#### 1\. Clonagem do Repositório

```bash
git clone https://github.com/seu-usuario/nome-do-repositorio.git
cd nome-do-repositorio
```

#### 2\. Instalação das Dependências

```bash
npm install
```

#### 3\. Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto e preencha com as suas credenciais do banco de dados:

```
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=chat_app
JWT_SECRET=defina_um_segredo_forte_aqui
```

#### 4\. Setup do Banco de Dados

Execute o seguinte script SQL no seu servidor MySQL para criar a estrutura de tabelas necessária:

```sql
CREATE DATABASE IF NOT EXISTS chat_app;
USE chat_app;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender VARCHAR(50) NOT NULL,
    recipient VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5\. Execução

Inicie o servidor backend:

```bash
node server.js
```

A aplicação estará disponível no seu navegador no endereço `http://localhost:3000`.

## Estrutura de Arquivos

```
/
├── public/
│   ├── index.html
│   ├── style.css
│   └── client.js
├── .env
├── auth.js
├── db.js
├── package.json
└── server.js
```
