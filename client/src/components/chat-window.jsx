import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ChatWindow({ messages, username, typingUsers, sendMessage, sendTyping, sendStopTyping }) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && username) {
      sendMessage(inputMessage.trim());
      setInputMessage("");
      sendStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (username) {
      if (!typingTimeoutRef.current) {
        sendTyping();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping();
        typingTimeoutRef.current = null;
      }, 1500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[80vh] w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Global Chat Room</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("mb-2 flex", msg.username === username ? "justify-end" : "justify-start")}> 
              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-3",
                  msg.username === username
                    ? "bg-blue-500 text-white"
                    : msg.username === "System"
                      ? "bg-gray-200 text-gray-700 italic"
                      : "bg-gray-100 text-gray-800",
                )}
              >
                {msg.username !== username && msg.username !== "System" && (
                  <div className="font-semibold text-sm mb-1">{msg.username}</div>
                )}
                <div>{msg.message}</div>
                <div className={cn("text-xs mt-1", msg.username === username ? "text-blue-100" : "text-gray-500")}>{msg.timestamp}</div>
              </div>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="mb-2 flex justify-start">
              <div className="max-w-[70%] rounded-lg p-3 bg-gray-100 text-gray-800 italic text-sm">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.join(", ")} are typing...`}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 border-t">
        <Input
          type="text"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="flex-1"
          disabled={!username}
        />
        <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || !username}>
          Send
        </Button>
      </CardFooter>
    </Card>
  );
} 