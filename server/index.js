const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { encryptMessage, decryptMessage } = require('./utils/encryption');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const users = {};            // socket.id => username
const onlineUsers = {};      // username => socket.id

io.on('connection', socket => {
  socket.on('register-user', username => {
    users[socket.id] = username;
    onlineUsers[username] = socket.id;
    io.emit('update-user-status', Object.keys(onlineUsers));
  });

  socket.on('send-chat-message', ({ to, message, isGroup }) => {
    const encrypted = encryptMessage(message);
    const from = users[socket.id];

    if (isGroup) {
      socket.broadcast.emit('chat-message', { from, message: encrypted });
    } else {
      const receiverSocketId = onlineUsers[to];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('chat-message', { from, message: encrypted });
      }
    }
  });

  socket.on('message-read', (from) => {
    const fromSocket = onlineUsers[from];
    if (fromSocket) {
      io.to(fromSocket).emit('read-receipt', users[socket.id]);
    }
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    delete onlineUsers[username];
    delete users[socket.id];
    io.emit('update-user-status', Object.keys(onlineUsers));
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});