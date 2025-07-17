// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users, messages, and rooms
const users = {};
const messages = {}; // { roomName: [messages] }
const typingUsers = {};
const rooms = ['General']; // Default room

// Helper to find a message by id in a room
function findMessage(room, messageId) {
  return (messages[room] || []).find((msg) => msg.id === messageId);
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', (username) => {
    users[socket.id] = { username, id: socket.id, room: 'General' };
    socket.join('General');
    io.emit('user_list', Object.values(users));
    io.emit('user_joined', { username, id: socket.id });
    io.emit('room_list', rooms);
    console.log(`${username} joined the chat`);
  });

  // Handle room creation
  socket.on('create_room', (roomName) => {
    if (!rooms.includes(roomName)) {
      rooms.push(roomName);
      messages[roomName] = [];
      io.emit('room_list', rooms);
    }
  });

  // Handle joining a room
  socket.on('join_room', (roomName) => {
    const user = users[socket.id];
    if (user && rooms.includes(roomName)) {
      socket.leave(user.room);
      socket.join(roomName);
      user.room = roomName;
      io.emit('user_list', Object.values(users));
      socket.emit('room_joined', roomName);
      // Send room messages
      socket.emit('room_messages', messages[roomName] || []);
    }
  });

  // Handle chat messages (room-based)
  socket.on('send_message', (messageData) => {
    const user = users[socket.id];
    const room = user?.room || 'General';
    const message = {
      ...messageData,
      id: Date.now(),
      sender: user?.username || 'Anonymous',
      senderId: socket.id,
      room,
      timestamp: new Date().toISOString(),
      readBy: [user?.username], // Read receipts
      reactions: {}, // { emoji: [usernames] }
    };
    if (!messages[room]) messages[room] = [];
    messages[room].push(message);
    if (messages[room].length > 100) messages[room].shift();
    io.to(room).emit('receive_message', message);
  });

  // Handle file/image sharing (base64 for simplicity)
  socket.on('send_file', ({ fileName, fileType, fileData, room }) => {
    const user = users[socket.id];
    const message = {
      id: Date.now(),
      sender: user?.username || 'Anonymous',
      senderId: socket.id,
      room: room || user?.room || 'General',
      timestamp: new Date().toISOString(),
      type: 'file',
      fileName,
      fileType,
      fileData, // base64 string
      readBy: [user?.username],
      reactions: {},
    };
    if (!messages[message.room]) messages[message.room] = [];
    messages[message.room].push(message);
    if (messages[message.room].length > 100) messages[message.room].shift();
    io.to(message.room).emit('receive_message', message);
  });

  // Handle message read receipts
  socket.on('message_read', ({ room, messageId, username }) => {
    const msg = findMessage(room, messageId);
    if (msg && !msg.readBy.includes(username)) {
      msg.readBy.push(username);
      io.to(room).emit('message_read_update', { messageId, readBy: msg.readBy });
    }
  });

  // Handle message reactions
  socket.on('add_reaction', ({ room, messageId, emoji, username }) => {
    const msg = findMessage(room, messageId);
    if (msg) {
      if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
      if (!msg.reactions[emoji].includes(username)) {
        msg.reactions[emoji].push(username);
        io.to(room).emit('reaction_update', { messageId, reactions: msg.reactions });
      }
    }
  });

  // Handle typing indicator (room-based)
  socket.on('typing', (isTyping) => {
    const user = users[socket.id];
    if (user) {
      const username = user.username;
      const room = user.room;
      if (!typingUsers[room]) typingUsers[room] = {};
      if (isTyping) {
        typingUsers[room][socket.id] = username;
      } else {
        delete typingUsers[room][socket.id];
      }
      io.to(room).emit('typing_users', Object.values(typingUsers[room]));
    }
  });

  // Handle private messages (unchanged)
  socket.on('private_message', ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username, room } = users[socket.id];
      io.emit('user_left', { username, id: socket.id });
      if (room && typingUsers[room]) delete typingUsers[room][socket.id];
      console.log(`${username} left the chat`);
    }
    delete users[socket.id];
    io.emit('user_list', Object.values(users));
    // Update typing users for all rooms
    Object.keys(typingUsers).forEach(room => {
      io.to(room).emit('typing_users', Object.values(typingUsers[room] || {}));
    });
  });
});

// API routes
app.get('/api/messages/:room', (req, res) => {
  const { room } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const all = messages[room] || [];
  const paged = all.slice(Math.max(0, all.length - offset - limit), all.length - offset);
  res.json(paged);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io }; 