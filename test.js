const io = require('socket.io-client');
const socket = io('http://localhost:3001');
socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join_room', { room: 'general', username: 'testuser' });
  socket.emit('send_message', { room: 'general', username: 'testuser', text: 'Hello!' });
  console.log('Message sent!');
  setTimeout(() => process.exit(), 2000);
});