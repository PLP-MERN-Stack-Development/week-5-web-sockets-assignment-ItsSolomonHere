import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { useChatSocket } from "./hooks/use-chat-socket";
import { ChatWindow } from "./components/chat-window";
import { UserSidebar } from "./components/user-sidebar";

export default function App() {
  const [inputUsername, setInputUsername] = useState("");
  const {
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
  } = useChatSocket();

  const handleJoinChat = () => {
    if (inputUsername.trim()) {
      connectSocket(inputUsername.trim());
    }
  };

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Enter your username"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoinChat()}
              className="mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={handleJoinChat} className="w-full">
              Join Chat
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 p-4 gap-4 justify-center items-center">
      <UserSidebar onlineUsers={onlineUsers} username={username} />
      <ChatWindow
        messages={messages}
        username={username}
        typingUsers={typingUsers}
        sendMessage={sendMessage}
        sendTyping={sendTyping}
        sendStopTyping={sendStopTyping}
      />
    </div>
  );
}
