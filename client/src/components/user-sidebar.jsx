import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dot } from "lucide-react";

export function UserSidebar({ onlineUsers, username }) {
  return (
    <Card className="w-64 h-[80vh] flex flex-col">
      <CardHeader>
        <CardTitle>Online Users</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {onlineUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No users online.</p>
          ) : (
            <ul>
              {onlineUsers.map((user) => (
                <li key={user.id} className="flex items-center mb-2 text-sm">
                  <Dot className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{user.username}</span>
                  {user.username === username && <span className="text-gray-500 ml-1">(You)</span>}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 