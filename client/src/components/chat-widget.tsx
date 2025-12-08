import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isRealtimeEnabled } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatRoom {
    id: string;
    name: string | null;
    type: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string | null;
    content: string;
    messageType: string;
    createdAt: string;
}

interface ChatUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profileImageUrl?: string;
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [showUserList, setShowUserList] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch chat rooms
    const { data: rooms = [], isLoading: roomsLoading } = useQuery<ChatRoom[]>({
        queryKey: ["/api/chat/rooms"],
        enabled: isOpen && !!user,
    });

    // Fetch available users to chat with
    const { data: users = [] } = useQuery<ChatUser[]>({
        queryKey: ["/api/chat/users"],
        enabled: showUserList && !!user,
    });

    // Real-time subscription for new messages
    useEffect(() => {
        if (!isRealtimeEnabled || !supabase || !isOpen) return;

        const channel = supabase
            .channel("chat-messages")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "chat_messages" },
                (payload) => {
                    // Invalidate messages for the updated room
                    const message = payload.new as any;
                    queryClient.invalidateQueries({
                        queryKey: [`/api/chat/rooms/${message.room_id}/messages`],
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
                }
            )
            .subscribe();

        return () => {
            if (supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, [isOpen, queryClient]);

    // Start a new direct chat
    const startChatMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await apiRequest("POST", `/api/chat/direct/${userId}`);
            return res.json();
        },
        onSuccess: (room: ChatRoom) => {
            setSelectedRoom(room);
            setShowUserList(false);
            queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
        },
    });

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
    };

    if (!user) return null;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="relative"
                >
                    <MessageCircle className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Messages
                        </SheetTitle>
                        {!selectedRoom && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowUserList(!showUserList)}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                New Chat
                            </Button>
                        )}
                        {selectedRoom && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedRoom(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden">
                    {showUserList ? (
                        <UserList
                            users={users}
                            onSelectUser={(userId) => startChatMutation.mutate(userId)}
                            isLoading={startChatMutation.isPending}
                        />
                    ) : selectedRoom ? (
                        <ChatRoomView room={selectedRoom} currentUserId={user.id} />
                    ) : (
                        <RoomList
                            rooms={rooms}
                            isLoading={roomsLoading}
                            onSelectRoom={setSelectedRoom}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function RoomList({
    rooms,
    isLoading,
    onSelectRoom,
}: {
    rooms: ChatRoom[];
    isLoading: boolean;
    onSelectRoom: (room: ChatRoom) => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Click &quot;New Chat&quot; to start a conversation
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
                {rooms.map((room) => (
                    <button
                        key={room.id}
                        onClick={() => onSelectRoom(room)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>
                                {room.name?.charAt(0) || room.type.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                                {room.name || `${room.type} chat`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {format(new Date(room.updatedAt), "MMM d, h:mm a")}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </ScrollArea>
    );
}

function UserList({
    users,
    onSelectUser,
    isLoading,
}: {
    users: ChatUser[];
    onSelectUser: (userId: string) => void;
    isLoading: boolean;
}) {
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
                {users.map((user) => (
                    <button
                        key={user.id}
                        onClick={() => onSelectUser(user.id)}
                        disabled={isLoading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImageUrl} />
                            <AvatarFallback>
                                {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {user.role}
                            </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                            Chat
                        </Badge>
                    </button>
                ))}
            </div>
        </ScrollArea>
    );
}

function ChatRoomView({
    room,
    currentUserId,
}: {
    room: ChatRoom;
    currentUserId: string;
}) {
    const [messageInput, setMessageInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Fetch messages
    const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
        queryKey: [`/api/chat/rooms/${room.id}/messages`],
        refetchInterval: isRealtimeEnabled ? false : 5000, // Poll if realtime not available
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await apiRequest("POST", `/api/chat/rooms/${room.id}/messages`, {
                content,
            });
            return res.json();
        },
        onSuccess: () => {
            setMessageInput("");
            queryClient.invalidateQueries({
                queryKey: [`/api/chat/rooms/${room.id}/messages`],
            });
        },
    });

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim()) {
            sendMessageMutation.mutate(messageInput.trim());
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground">
                            Send a message to start the conversation
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => {
                            const isOwn = message.senderId === currentUserId;
                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex",
                                        isOwn ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-lg px-4 py-2",
                                            isOwn
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <p className="text-sm">{message.content}</p>
                                        <p
                                            className={cn(
                                                "text-xs mt-1",
                                                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                                            )}
                                        >
                                            {format(new Date(message.createdAt), "h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-4 border-t">
                <div className="flex gap-2">
                    <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sendMessageMutation.isPending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    >
                        {sendMessageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
