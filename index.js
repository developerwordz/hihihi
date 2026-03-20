const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, orderBy, limit, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.get('/rooms', async (req, res) => {
  const snapshot = await getDocs(collection(db, 'rooms'));
  const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(rooms);
});

app.get('/messages/:room', async (req, res) => {
  const q = query(
    collection(db, 'messages'),
    where('room', '==', req.params.room),
    orderBy('createdAt'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(messages);
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', async ({ room, username }) => {
    socket.join(room);
    await addDoc(collection(db, 'rooms'), { name: room });
    socket.to(room).emit('user_joined', { username });
  });

  socket.on('send_message', async ({ room, username, text }) => {
    const message = await addDoc(collection(db, 'messages'), {
      room,
      username,
      text,
      createdAt: new Date()
    });
    io.to(room).emit('receive_message', {
      username,
      text,
      createdAt: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});