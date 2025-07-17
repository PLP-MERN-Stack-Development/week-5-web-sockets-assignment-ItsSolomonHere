import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from './socket/socket';

// Responsive styles
const appContainerStyle = {
  display: 'flex',
  height: '100vh',
  fontFamily: 'sans-serif',
};
const sidebarStyle = {
  width: 180,
  minWidth: 120,
  background: '#e3e3e3',
  padding: 16,
  borderRight: '1px solid #bbb',
  display: 'flex',
  flexDirection: 'column',
};
const userListStyle = {
  width: 180,
  minWidth: 120,
  background: '#f4f4f4',
  padding: 16,
  borderRight: '1px solid #ddd',
  display: 'flex',
  flexDirection: 'column',
};
const chatAreaStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  background: '#fff',
};
const headerStyle = {
  padding: 16,
  borderBottom: '1px solid #ddd',
  background: '#fafafa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
};
const notificationStyle = {
  position: 'fixed',
  top: 20,
  right: 20,
  background: '#1976d2',
  color: '#fff',
  padding: '1rem 2rem',
  borderRadius: 8,
  zIndex: 1000,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  maxWidth: '90vw',
  wordBreak: 'break-word',
};
const unreadBadgeStyle = {
  background: '#e57373',
  color: '#fff',
  borderRadius: 12,
  padding: '0.5rem 1rem',
  fontWeight: 'bold',
  fontSize: 16,
  marginLeft: 8,
};
const messagesStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: 16,
  background: '#f9f9f9',
};
const messageInputFormStyle = {
  display: 'flex',
  borderTop: '1px solid #ddd',
  padding: 16,
  background: '#fafafa',
};
const messageInputStyle = {
  flex: 1,
  padding: '0.5rem',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: 4,
};
const sendButtonStyle = {
  marginLeft: 8,
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  background: '#1976d2',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
};

// Add emoji reactions
const REACTIONS = ['👍', '❤️', '😂', '😮', '🎉'];

function App() {
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // For private messaging
  const [rooms, setRooms] = useState(['General']);
  const [currentRoom, setCurrentRoom] = useState('General');
  const [newRoom, setNewRoom] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [inAppNotification, setInAppNotification] = useState(null);
  const messageEndRef = useRef(null);
  const windowFocused = useRef(true);
  const [file, setFile] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [showReconnect, setShowReconnect] = useState(false);
  const [search, setSearch] = useState('');
  const {
    connect,
    disconnect,
    isConnected,
    messages,
    users,
    typingUsers,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    socket,
  } = useSocket();

  useEffect(() => {
    if (loggedIn && username) {
      connect(username);
      return () => disconnect();
    }
    // eslint-disable-next-line
  }, [loggedIn, username]);

  // Listen for room events
  useEffect(() => {
    if (!socket) return;
    const handleRoomList = (roomList) => setRooms(roomList);
    const handleRoomJoined = (roomName) => setCurrentRoom(roomName);
    socket.on('room_list', handleRoomList);
    socket.on('room_joined', handleRoomJoined);
    return () => {
      socket.off('room_list', handleRoomList);
      socket.off('room_joined', handleRoomJoined);
    };
  }, [socket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser, currentRoom]);

  // Track window focus for notifications
  useEffect(() => {
    const onFocus = () => {
      windowFocused.current = true;
      setUnreadCount(0);
    };
    const onBlur = () => {
      windowFocused.current = false;
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Browser notification permission
  useEffect(() => {
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // In-app and browser notifications for new messages
  useEffect(() => {
    if (!loggedIn) return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    // Only notify for messages in the current room or private chat
    const isRelevant = selectedUser
      ? lastMsg.isPrivate &&
        ((lastMsg.sender === username && lastMsg.senderId !== selectedUser.id) ||
          (lastMsg.senderId === selectedUser.id && lastMsg.sender !== username))
      : !lastMsg.isPrivate && (lastMsg.room === currentRoom || !lastMsg.room);
    if (!isRelevant) return;
    // Don't notify for own messages
    if (lastMsg.sender === username) return;
    // In-app notification
    setInAppNotification({
      message: lastMsg.system
        ? lastMsg.message
        : `${lastMsg.sender}: ${lastMsg.message}`,
      timestamp: Date.now(),
    });
    // Browser notification
    if (windowFocused.current === false && Notification && Notification.permission === 'granted') {
      new Notification(
        lastMsg.system ? 'Chat Notification' : `New message from ${lastMsg.sender}`,
        {
          body: lastMsg.system ? lastMsg.message : lastMsg.message,
        }
      );
    }
    // Unread count
    if (windowFocused.current === false) {
      setUnreadCount((c) => c + 1);
    }
    // Auto-hide in-app notification
    const timeout = setTimeout(() => setInAppNotification(null), 3000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [messages, selectedUser, currentRoom, loggedIn]);

  // Send read receipt when a message is visible
  useEffect(() => {
    if (!loggedIn || selectedUser) return;
    filteredMessages.forEach((msg) => {
      if (msg.readBy && !msg.readBy.includes(username)) {
        socket.emit('message_read', { room: currentRoom, messageId: msg.id, username });
      }
    });
    // eslint-disable-next-line
  }, [filteredMessages, loggedIn, selectedUser, currentRoom]);

  // Listen for read receipt and reaction updates
  useEffect(() => {
    if (!socket) return;
    const handleReadUpdate = ({ messageId, readBy }) => {
      // Update readBy for the message in messages array
      // (In a real app, use a state management solution)
      const msg = messages.find((m) => m.id === messageId);
      if (msg) msg.readBy = readBy;
    };
    const handleReactionUpdate = ({ messageId, reactions }) => {
      const msg = messages.find((m) => m.id === messageId);
      if (msg) msg.reactions = reactions;
    };
    socket.on('message_read_update', handleReadUpdate);
    socket.on('reaction_update', handleReactionUpdate);
    return () => {
      socket.off('message_read_update', handleReadUpdate);
      socket.off('reaction_update', handleReactionUpdate);
    };
  }, [socket, messages]);

  // Add reaction to a message
  const handleAddReaction = (msg, emoji) => {
    socket.emit('add_reaction', { room: currentRoom, messageId: msg.id, emoji, username });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setUsername(input.trim());
      setLoggedIn(true);
    }
  };

  // Delivery acknowledgment: send message with callback
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      if (selectedUser) {
        sendPrivateMessage(selectedUser.id, messageInput.trim());
      } else {
        // Add to pending
        const tempId = Date.now() + Math.random();
        setPendingMessages((prev) => [...prev, tempId]);
        socket.emit(
          'send_message',
          { message: messageInput.trim(), room: currentRoom, tempId },
          () => {
            setPendingMessages((prev) => prev.filter((id) => id !== tempId));
          }
        );
      }
      setMessageInput('');
      setTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoom.trim() && !rooms.includes(newRoom.trim())) {
      socket.emit('create_room', newRoom.trim());
      setNewRoom('');
    }
  };

  const handleJoinRoom = (room) => {
    setSelectedUser(null); // Leave private chat
    socket.emit('join_room', room);
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  // Send file as base64
  const handleSendFile = async (e) => {
    e.preventDefault();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result.split(',')[1]; // base64
      socket.emit('send_file', {
        fileName: file.name,
        fileType: file.type,
        fileData,
        room: currentRoom,
      });
      setFile(null);
    };
    reader.readAsDataURL(file);
  };

  // Filter messages for private chat or current room, then by search
  const filteredMessages = (selectedUser
    ? messages.filter(
        (msg) =>
          msg.isPrivate &&
          ((msg.sender === username && msg.senderId !== selectedUser.id) ||
            (msg.senderId === selectedUser.id && msg.sender !== username))
      )
    : messages.filter((msg) => !msg.isPrivate && (msg.room === currentRoom || !msg.room))
  ).filter(
    (msg) =>
      !search ||
      (msg.message && msg.message.toLowerCase().includes(search.toLowerCase())) ||
      (msg.type === 'file' && msg.fileName && msg.fileName.toLowerCase().includes(search.toLowerCase()))
  );

  // Fetch older messages
  const fetchOlderMessages = async () => {
    setLoadingMore(true);
    const offset = messages.filter(m => !m.isPrivate && (m.room === currentRoom || !m.room)).length;
    const res = await fetch(`/api/messages/${currentRoom}?limit=20&offset=${offset}`);
    const older = await res.json();
    if (older.length === 0) setHasMore(false);
    else {
      // Prepend older messages (in a real app, use state management)
      messages.unshift(...older);
    }
    setLoadingMore(false);
  };

  // Reset hasMore when room changes
  useEffect(() => { setHasMore(true); }, [currentRoom]);

  // Show reconnecting indicator
  useEffect(() => {
    if (!socket) return;
    const onDisconnect = () => setShowReconnect(true);
    const onConnect = () => setShowReconnect(false);
    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    return () => {
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
    };
  }, [socket]);

  // Responsive: stack sidebars and chat vertically on small screens
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!loggedIn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h2>Enter your username to join the chat</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 300 }}>
          <input
            type="text"
            placeholder="Username"
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
            required
            style={{ padding: '0.5rem', fontSize: '1rem' }}
          />
          <button type="submit" style={{ padding: '0.5rem', fontSize: '1rem' }}>Join Chat</button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={
        isMobile
          ? { ...appContainerStyle, flexDirection: 'column', height: 'auto', minHeight: '100vh' }
          : appContainerStyle
      }
    >
      {/* In-app notification */}
      {inAppNotification && (
        <div style={notificationStyle}>{inAppNotification.message}</div>
      )}
      {showReconnect && (
        <div style={{ background: '#ff9800', color: '#fff', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>
          Reconnecting to server...
        </div>
      )}
      {/* Room List */}
      <div
        style={
          isMobile
            ? { ...sidebarStyle, width: '100%', borderRight: 'none', borderBottom: '1px solid #bbb', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }
            : sidebarStyle
        }
      >
        <div style={{ width: isMobile ? '100%' : undefined }}>
          <h3 style={{ margin: 0 }}>Rooms</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: isMobile ? 'flex' : 'block', flexWrap: 'wrap' }}>
            {rooms.map((room) => (
              <li
                key={room}
                style={{
                  fontWeight: currentRoom === room ? 'bold' : 'normal',
                  color: currentRoom === room ? '#1976d2' : '#333',
                  cursor: 'pointer',
                  marginBottom: isMobile ? 0 : 6,
                  marginRight: isMobile ? 12 : 0,
                  padding: isMobile ? '0.2rem 0.5rem' : undefined,
                }}
                onClick={() => handleJoinRoom(room)}
              >
                #{room}
              </li>
            ))}
          </ul>
        </div>
        <form
          onSubmit={handleCreateRoom}
          style={{ marginTop: isMobile ? 8 : 16, display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 4, width: isMobile ? '100%' : undefined }}
        >
          <input
            type="text"
            placeholder="New room name"
            value={newRoom}
            onChange={e => setNewRoom(e.target.value)}
            style={{ padding: '0.3rem', fontSize: '1rem', flex: isMobile ? 1 : undefined }}
          />
          <button type="submit" style={{ padding: '0.3rem', fontSize: '1rem' }}>Create</button>
        </form>
      </div>

      {/* User List */}
      <div
        style={
          isMobile
            ? { ...userListStyle, width: '100%', borderRight: 'none', borderBottom: '1px solid #ddd', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }
            : userListStyle
        }
      >
        <div style={{ width: isMobile ? '100%' : undefined }}>
          <h3 style={{ margin: 0 }}>Online Users</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: isMobile ? 'flex' : 'block', flexWrap: 'wrap' }}>
            <li
              key="global"
              style={{ fontWeight: !selectedUser ? 'bold' : 'normal', color: !selectedUser ? '#1976d2' : '#333', cursor: 'pointer', marginBottom: isMobile ? 0 : 8, marginRight: isMobile ? 12 : 0, padding: isMobile ? '0.2rem 0.5rem' : undefined }}
              onClick={() => setSelectedUser(null)}
            >
              🌐 Room Chat
            </li>
            {users
              .filter((user) => user.username !== username && user.room === currentRoom)
              .map((user) => (
                <li
                  key={user.id}
                  style={{ fontWeight: selectedUser?.id === user.id ? 'bold' : 'normal', color: selectedUser?.id === user.id ? '#1976d2' : '#333', cursor: 'pointer', marginBottom: isMobile ? 0 : 4, marginRight: isMobile ? 12 : 0, padding: isMobile ? '0.2rem 0.5rem' : undefined }}
                  onClick={() => setSelectedUser(user)}
                >
                  💬 {user.username}
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Chat Area */}
      <div style={chatAreaStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0 }}>Welcome, {username}!</h2>
            <span style={{ fontSize: 14, color: isConnected ? 'green' : 'red' }}>Socket status: {isConnected ? 'Connected' : 'Connecting...'}</span>
            <div style={{ marginTop: 8, fontSize: 16 }}>
              {selectedUser ? (
                <span>Private chat with <b>{selectedUser.username}</b></span>
              ) : (
                <span>Room: <b>#{currentRoom}</b></span>
              )}
            </div>
          </div>
          {/* Unread message count */}
          {unreadCount > 0 && <div style={unreadBadgeStyle}>{unreadCount} unread</div>}
        </div>

        {/* Messages */}
        <div style={messagesStyle}>
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search messages..."
              style={{ width: '100%', padding: '0.4rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: 4 }}
            />
          </div>
          {hasMore && !selectedUser && (
            <button onClick={fetchOlderMessages} disabled={loadingMore} style={{ marginBottom: 8 }}>
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          )}
          {filteredMessages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 12, textAlign: msg.system ? 'center' : msg.sender === username ? 'right' : 'left' }}>
              {msg.system ? (
                <span style={{ color: '#888', fontStyle: 'italic' }}>{msg.message}</span>
              ) : msg.type === 'file' ? (
                <div>
                  <span style={{ fontWeight: 'bold', color: msg.sender === username ? '#1976d2' : '#333' }}>{msg.sender}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#aaa' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div style={{ marginTop: 2 }}>
                    <a
                      href={`data:${msg.fileType};base64,${msg.fileData}`}
                      download={msg.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', textDecoration: 'underline' }}
                    >
                      {msg.fileType.startsWith('image') ? (
                        <img
                          src={`data:${msg.fileType};base64,${msg.fileData}`}
                          alt={msg.fileName}
                          style={{ maxWidth: 200, maxHeight: 200, display: 'block', margin: '8px 0' }}
                        />
                      ) : (
                        <span>📎 {msg.fileName}</span>
                      )}
                    </a>
                  </div>
                  {/* Reactions */}
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(msg, emoji)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, padding: 0 }}
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                        {msg.reactions && msg.reactions[emoji] && (
                          <span style={{ fontSize: 12, marginLeft: 2 }}>
                            {msg.reactions[emoji].length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Read receipts */}
                  {msg.readBy && msg.readBy.length > 0 && (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      Seen by: {msg.readBy.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <span style={{ fontWeight: 'bold', color: msg.sender === username ? '#1976d2' : '#333' }}>{msg.sender}</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#aaa' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div style={{ marginTop: 2 }}>
                    {msg.message}
                    {msg.isPrivate && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#e57373' }}>(Private)</span>
                    )}
                  </div>
                  {msg.sender === username && !msg.isPrivate && (
                    <span style={{ marginLeft: 6, fontSize: 14, color: pendingMessages.includes(msg.tempId) ? '#aaa' : '#43a047' }}>
                      {pendingMessages.includes(msg.tempId) ? '⏳' : '✔️'}
                    </span>
                  )}
                  {/* Reactions */}
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(msg, emoji)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, padding: 0 }}
                        title={`React with ${emoji}`}
                      >
                        {emoji}
                        {msg.reactions && msg.reactions[emoji] && (
                          <span style={{ fontSize: 12, marginLeft: 2 }}>
                            {msg.reactions[emoji].length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Read receipts */}
                  {msg.readBy && msg.readBy.length > 0 && (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      Seen by: {msg.readBy.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>

        {/* Typing Indicator */}
        <div style={{ minHeight: 24, paddingLeft: 16, color: '#888', fontSize: 14 }}>
          {typingUsers.length > 0 && (
            <span>
              {typingUsers.filter((u) => u !== username).join(', ')}
              {typingUsers.length === 1 ? ' is typing...' : ' are typing...'}
            </span>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} style={messageInputFormStyle}>
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder={selectedUser ? `Message @${selectedUser.username}...` : `Message #${currentRoom}...`}
            style={messageInputStyle}
            onBlur={() => setTyping(false)}
            onFocus={() => setTyping(messageInput.length > 0)}
            autoFocus
          />
          <input
            type="file"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            style={{ marginLeft: 8 }}
          />
          <button type="submit" style={sendButtonStyle} disabled={!messageInput.trim()}>
            Send
          </button>
          {file && (
            <button onClick={handleSendFile} style={{ ...sendButtonStyle, background: '#43a047' }}>
              Send {file.name}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default App; 