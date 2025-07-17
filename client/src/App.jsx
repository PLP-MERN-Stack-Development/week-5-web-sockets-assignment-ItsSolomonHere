import React, { useState, useEffect } from 'react';
import { useSocket } from './socket/socket';

function App() {
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const { connect, disconnect, isConnected } = useSocket();

  useEffect(() => {
    if (loggedIn && username) {
      connect(username);
      return () => disconnect();
    }
    // eslint-disable-next-line
  }, [loggedIn, username]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setUsername(input.trim());
      setLoggedIn(true);
    }
  };

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

  // Placeholder for chat UI
  return (
    <div>
      <h2>Welcome, {username}!</h2>
      <p>Socket status: {isConnected ? 'Connected' : 'Connecting...'}</p>
      <p>Chat UI will go here.</p>
    </div>
  );
}

export default App; 