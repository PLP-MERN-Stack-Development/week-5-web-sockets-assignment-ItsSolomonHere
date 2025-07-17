import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from './socket/socket';

function App() {
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // For private messaging
  const messageEndRef = useRef(null);
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
  } = useSocket();

  useEffect(() => {
    if (loggedIn && username) {
      connect(username);
      return () => disconnect();
    }
    // eslint-disable-next-line
  }, [loggedIn, username]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setUsername(input.trim());
      setLoggedIn(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      if (selectedUser) {
        sendPrivateMessage(selectedUser.id, messageInput.trim());
      } else {
        sendMessage(messageInput.trim());
      }
      setMessageInput('');
      setTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  // Filter messages for private chat if a user is selected
  const filteredMessages = selectedUser
    ? messages.filter(
        (msg) =>
          msg.isPrivate &&
          ((msg.sender === username && msg.senderId !== selectedUser.id) ||
            (msg.senderId === selectedUser.id && msg.sender !== username))
      )
    : messages.filter((msg) => !msg.isPrivate);

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
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* User List */}
      <div style={{ width: 220, background: '#f4f4f4', padding: 16, borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <h3>Online Users</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li
            key="global"
            style={{ fontWeight: !selectedUser ? 'bold' : 'normal', color: !selectedUser ? '#1976d2' : '#333', cursor: 'pointer', marginBottom: 8 }}
            onClick={() => setSelectedUser(null)}
          >
            🌐 Global Chat
          </li>
          {users
            .filter((user) => user.username !== username)
            .map((user) => (
              <li
                key={user.id}
                style={{ fontWeight: selectedUser?.id === user.id ? 'bold' : 'normal', color: selectedUser?.id === user.id ? '#1976d2' : '#333', cursor: 'pointer', marginBottom: 4 }}
                onClick={() => setSelectedUser(user)}
              >
                💬 {user.username}
              </li>
            ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: '#fff' }}>
        {/* Header */}
        <div style={{ padding: 16, borderBottom: '1px solid #ddd', background: '#fafafa' }}>
          <h2 style={{ margin: 0 }}>Welcome, {username}!</h2>
          <span style={{ fontSize: 14, color: isConnected ? 'green' : 'red' }}>Socket status: {isConnected ? 'Connected' : 'Connecting...'}</span>
          <div style={{ marginTop: 8, fontSize: 16 }}>
            {selectedUser ? (
              <span>Private chat with <b>{selectedUser.username}</b></span>
            ) : (
              <span>Global chat room</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f9f9f9' }}>
          {filteredMessages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 12, textAlign: msg.system ? 'center' : msg.sender === username ? 'right' : 'left' }}>
              {msg.system ? (
                <span style={{ color: '#888', fontStyle: 'italic' }}>{msg.message}</span>
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
        <form onSubmit={handleSendMessage} style={{ display: 'flex', borderTop: '1px solid #ddd', padding: 16, background: '#fafafa' }}>
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder={selectedUser ? `Message @${selectedUser.username}...` : 'Type your message...'}
            style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: 4 }}
            onBlur={() => setTyping(false)}
            onFocus={() => setTyping(messageInput.length > 0)}
            autoFocus
          />
          <button type="submit" style={{ marginLeft: 8, padding: '0.5rem 1rem', fontSize: '1rem', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }} disabled={!messageInput.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App; 