import { useEffect, useState, useCallback } from "react";
import { socket } from "@/lib/socket";

export function useChatSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState(null);

  const connectSocket = useCallback((name) => {
    setUsername(name);
    socket.connect();
    socket.emit("join", name);
  }, []);

  const sendMessage = useCallback((message) => {
    if (socket.connected) {
      socket.emit("chat_message", message);
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (socket.connected) {
      socket.emit("typing");
    }
  }, []);

  const sendStopTyping = useCallback(() => {
    if (socket.connected) {
      socket.emit("stop_typing");
    }
  }, []);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setError(null);
    }
    function onDisconnect() {
      setIsConnected(false);
    }
    function onChatMessage(msg) {
      setMessages((prev) => [...prev, msg]);
      setTypingUsers((prev) => prev.filter((user) => user !== msg.username));
    }
    function onUserConnected(user) {
      setOnlineUsers((prev) => {
        if (!prev.some((u) => u.id === user.id)) {
          return [...prev, user];
        }
        return prev;
      });
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `${user.username} has joined the chat.`,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now() + Math.random(),
        },
      ]);
    }
    function onUserDisconnected(user) {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
      setMessages((prev) => [
        ...prev,
        {
          username: "System",
          message: `${user.username} has left the chat.`,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now() + Math.random(),
        },
      ]);
      setTypingUsers((prev) => prev.filter((u) => u !== user.username));
    }
    function onUserTyping(user) {
      setTypingUsers((prev) => {
        if (!prev.includes(user.username)) {
          return [...prev, user.username];
        }
        return prev;
      });
    }
    function onUserStopTyping(user) {
      setTypingUsers((prev) => prev.filter((u) => u !== user.username));
    }
    function onCurrentUsers(users) {
      setOnlineUsers(users);
    }
    function onCurrentMessages(msgs) {
      setMessages(msgs);
    }
    function onError(msg) {
      setError(msg);
    }
    function onOnlineUsersUpdate(users) {
      setOnlineUsers(users);
    }
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat_message", onChatMessage);
    socket.on("user_connected", onUserConnected);
    socket.on("user_disconnected", onUserDisconnected);
    socket.on("user_typing", onUserTyping);
    socket.on("user_stop_typing", onUserStopTyping);
    socket.on("current_users", onCurrentUsers);
    socket.on("current_messages", onCurrentMessages);
    socket.on("error", onError);
    socket.on("online_users_update", onOnlineUsersUpdate);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat_message", onChatMessage);
      socket.off("user_connected", onUserConnected);
      socket.off("user_disconnected", onUserDisconnected);
      socket.off("user_typing", onUserTyping);
      socket.off("user_stop_typing", onUserStopTyping);
      socket.off("current_users", onCurrentUsers);
      socket.off("current_messages", onCurrentMessages);
      socket.off("error", onError);
      socket.off("online_users_update", onOnlineUsersUpdate);
    };
  }, []);

  return {
    isConnected,
    username,
    messages,
    onlineUsers,
    typingUsers,
    error,
    connectSocket,
    sendMessage,
    sendTyping,
    sendStopTyping,
  };
} 