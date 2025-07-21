const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
const server = http.createServer(app)

// Configure CORS for Socket.io and Express
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow your Next.js client to connect
    methods: ["GET", "POST"],
  },
})

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
)

const PORT = process.env.PORT || 3001

// In-memory store for users and messages (for demonstration)
const onlineUsers = new Map() // Map<socketId, { username, typing: boolean }>
const messages = [] // Array<{ username, message, timestamp }>

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Handle user joining
  socket.on("join", (username) => {
    if (!username) {
      console.log(`User ${socket.id} tried to join without a username.`)
      socket.emit("error", "Username is required.")
      return
    }
    onlineUsers.set(socket.id, { username, typing: false })
    console.log(`${username} (${socket.id}) joined.`)

    // Emit current online users to the new user
    socket.emit("current_users", Array.from(onlineUsers.values()))
    // Emit current messages to the new user
    socket.emit("current_messages", messages)

    // Notify all other clients about the new user
    socket.broadcast.emit("user_connected", { id: socket.id, username, typing: false })
    io.emit("online_users_update", Array.from(onlineUsers.values())) // Send full list to all
  })

  // Handle chat messages
  socket.on("chat_message", (msg) => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      const messageData = {
        username: user.username,
        message: msg,
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now() + Math.random(), // Unique ID for message
      }
      messages.push(messageData)
      io.emit("chat_message", messageData) // Broadcast to all clients
      console.log(`Message from ${user.username}: ${msg}`)
    }
  })

  // Handle typing indicator
  socket.on("typing", () => {
    const user = onlineUsers.get(socket.id)
    if (user && !user.typing) {
      user.typing = true
      onlineUsers.set(socket.id, user)
      socket.broadcast.emit("user_typing", { id: socket.id, username: user.username })
      console.log(`${user.username} is typing...`)
    }
  })

  // Handle stop typing indicator
  socket.on("stop_typing", () => {
    const user = onlineUsers.get(socket.id)
    if (user && user.typing) {
      user.typing = false
      onlineUsers.set(socket.id, user)
      socket.broadcast.emit("user_stop_typing", { id: socket.id, username: user.username })
      console.log(`${user.username} stopped typing.`)
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      onlineUsers.delete(socket.id)
      io.emit("user_disconnected", { id: socket.id, username: user.username })
      io.emit("online_users_update", Array.from(onlineUsers.values())) // Send full list to all
      console.log(`User disconnected: ${user.username} (${socket.id})`)
    } else {
      console.log(`User disconnected: ${socket.id} (unknown user)`)
    }
  })
})

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
