const socket = io('http://localhost:3000');
const messages = document.getElementById('messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const userList = document.getElementById('online-users');

const username = prompt('Enter your name');
socket.emit('register-user', username);
let selectedUser = null;

form.addEventListener('submit', e => {
  e.preventDefault();
  const message = input.value;
  if (message && selectedUser) {
    appendMessage(`You to ${selectedUser}: ${message}`);
    socket.emit('send-chat-message', { to: selectedUser, message, isGroup: false });
    input.value = '';
  }
});

socket.on('chat-message', ({ from, message }) => {
  const decrypted = message; // optionally decrypt if you want in browser
  appendMessage(`${from}: ${decrypted}`);
  socket.emit('message-read', from);
});

socket.on('read-receipt', (from) => {
  appendMessage(`${from} read your message`);
});

socket.on('update-user-status', (users) => {
  userList.innerHTML = 'Online Users:<br>';
  users.forEach(user => {
    if (user !== username) {
      const btn = document.createElement('button');
      btn.textContent = user;
      btn.onclick = () => selectedUser = user;
      userList.appendChild(btn);
    }
  });
});

function appendMessage(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  messages.appendChild(div);
}
