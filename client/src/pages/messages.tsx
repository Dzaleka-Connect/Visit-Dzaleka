import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEO } from "@/components/seo";
import { supabase, isRealtimeEnabled } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Loader2, Search, ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Nested user data from Supabase join
interface ParticipantUser {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    profile_image_url?: string;
}

interface ChatParticipant {
    user_id: string;
    last_read_at?: string;
    users?: ParticipantUser;
}

interface ChatRoom {
    id: string;
    name: string | null;
    type: string;
    createdAt: string;
    updatedAt: string;
    chat_participants?: ChatParticipant[];
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

// Union type for display
type ContactItem =
    | { type: 'room'; data: ChatRoom; otherUser?: ChatUser }
    | { type: 'user'; data: ChatUser };

export default function Messages() {
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [activeOtherUser, setActiveOtherUser] = useState<ChatUser | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch chat rooms
    const { data: rooms = [], isLoading: roomsLoading } = useQuery<ChatRoom[]>({
        queryKey: ["/api/chat/rooms"],
        enabled: !!user,
    });

    // Fetch available users to chat with
    const { data: users = [], isLoading: usersLoading } = useQuery<ChatUser[]>({
        queryKey: ["/api/chat/users"],
        enabled: !!user,
    });

    // Real-time subscription for new messages
    useEffect(() => {
        if (!isRealtimeEnabled || !supabase) return;

        const channel = supabase
            .channel("chat-messages-page")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "chat_messages" },
                (payload) => {
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
    }, [queryClient]);

    // Start a new direct chat
    const startChatMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await apiRequest("POST", `/api/chat/direct/${userId}`);
            return res.json();
        },
        onSuccess: (room: ChatRoom) => {
            // Invalidate rooms to refresh the list with the new room
            queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
            // We might not want to automatically select it here if we are just clicking from the list, 
            // but if we want to force open:
            // setSelectedRoom(room);
        },
    });

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // Merge and filter list - returns object with separated lists
    const unifiedList = useMemo((): { recentChats: ContactItem[]; newChatUsers: ContactItem[] } => {
        if (!user) return { recentChats: [], newChatUsers: [] };

        const contacts: ContactItem[] = [];
        const processedUserIds = new Set<string>();
        const processedRoomIds = new Set<string>();

        // Create a map of users for easy lookup
        const userMap = new Map(users.map(u => [u.id, u]));

        // Helper to get participants from room (handles both camelCase and snake_case)
        const getParticipants = (room: ChatRoom) =>
            room.chat_participants || (room as any).chatParticipants || [];

        // Helper to get user ID from participant (handles both formats)
        const getParticipantUserId = (p: any) => p.user_id || p.userId;

        // 1. Process Users first to ensure everyone is listed
        users.forEach(targetUser => {
            if (targetUser.id === user.id) return;

            // Check if there is an existing DIRECT room with this user
            const existingRoom = rooms.find(r =>
                r.type === 'direct' &&
                getParticipants(r).some((p: any) => getParticipantUserId(p) === targetUser.id)
            );

            if (existingRoom) {
                contacts.push({ type: 'room', data: existingRoom, otherUser: targetUser });
                processedRoomIds.add(existingRoom.id);
            } else {
                contacts.push({ type: 'user', data: targetUser });
            }
            processedUserIds.add(targetUser.id);
        });

        // 2. Add any remaining rooms (e.g., group chats or chats with users not in the user list)
        rooms.forEach(room => {
            if (processedRoomIds.has(room.id)) return;

            let otherUser: ChatUser | undefined;

            // Try to find the "other" user if it's a direct chat but wasn't matched above
            if (room.type === 'direct') {
                const participants = getParticipants(room);
                const otherParticipant = participants.find((p: any) => getParticipantUserId(p) !== user.id);
                if (otherParticipant) {
                    const participantUserId = getParticipantUserId(otherParticipant);
                    // First try to get from userMap
                    otherUser = userMap.get(participantUserId);

                    // If not in userMap, try to get from the nested users data in participant
                    if (!otherUser && otherParticipant.users) {
                        const pu = otherParticipant.users;
                        otherUser = {
                            id: participantUserId,
                            firstName: pu.first_name || pu.firstName,
                            lastName: pu.last_name || pu.lastName,
                            email: pu.email,
                            role: pu.role,
                            profileImageUrl: pu.profile_image_url || pu.profileImageUrl,
                        };
                    }
                }

                // Skip direct rooms where we can't identify the other user
                if (!otherUser) return;
            }

            contacts.push({ type: 'room', data: room, otherUser });
        });

        // 3. Separate into recent chats (rooms) and new chat users
        const recentChats = contacts.filter(item => item.type === 'room');
        const newChatUsers = contacts.filter(item => item.type === 'user');

        // 4. Filter
        const filterItems = (items: ContactItem[]) => items.filter(item => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();

            if (item.type === 'user') {
                return (
                    item.data.firstName.toLowerCase().includes(q) ||
                    item.data.lastName.toLowerCase().includes(q) ||
                    item.data.role.toLowerCase().includes(q)
                );
            } else {
                // For rooms, search by room name or the other user's name
                const name = item.otherUser
                    ? `${item.otherUser.firstName} ${item.otherUser.lastName}`
                    : (item.data.name || "Chat");
                return name.toLowerCase().includes(q);
            }
        });

        // 5. Sort: Recent chats by time (newest first), users alphabetically
        const sortedRecentChats = filterItems(recentChats).sort((a, b) => {
            const timeA = new Date((a.data as ChatRoom).updatedAt).getTime();
            const timeB = new Date((b.data as ChatRoom).updatedAt).getTime();
            return timeB - timeA;
        });

        const sortedNewChatUsers = filterItems(newChatUsers).sort((a, b) => {
            const nameA = (a.data as ChatUser).firstName;
            const nameB = (b.data as ChatUser).firstName;
            return nameA.localeCompare(nameB);
        });

        return { recentChats: sortedRecentChats, newChatUsers: sortedNewChatUsers };

    }, [rooms, users, user, searchQuery]);

    // Mobile: show chat view when room is selected
    const showChatOnMobile = selectedRoom !== null;

    const handleContactClick = async (item: ContactItem) => {
        if (item.type === 'room') {
            setSelectedRoom(item.data);
            setActiveOtherUser(item.otherUser);
        } else {
            // Optimistically set the user so header updates immediately
            setActiveOtherUser(item.data);
            try {
                const room = await startChatMutation.mutateAsync(item.data.id);
                setSelectedRoom(room);
            } catch {
                // Chat start failed - activeOtherUser already set optimistically
            }
        }
    };

    // Helper to get display name for mobile header
    const mobileHeaderName = activeOtherUser
        ? `${activeOtherUser.firstName} ${activeOtherUser.lastName}`
        : (selectedRoom?.name || "Chat");

    return (
        <>
            <SEO
                title="Messages | Visit Dzaleka"
                description="Chat with team members and guides."
                robots="noindex, nofollow"
            />

            <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Header - Desktop only */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
                        <p className="text-muted-foreground">
                            Chat with team members and guides
                        </p>
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="flex md:hidden items-center gap-2 mb-4">
                    {showChatOnMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setSelectedRoom(null);
                                setActiveOtherUser(undefined);
                            }}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h1 className="text-xl font-bold truncate">
                        {showChatOnMobile ? mobileHeaderName : "Messages"}
                    </h1>
                </div>

                <div className="flex flex-1 gap-4 min-h-0">
                    {/* Left Panel - Contact List */}
                    <Card className={cn(
                        "w-full md:w-80 flex flex-col",
                        showChatOnMobile && "hidden md:flex"
                    )}>
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-full">
                                <div className="p-2">
                                    {roomsLoading || usersLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : unifiedList.recentChats.length === 0 && unifiedList.newChatUsers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                            <MessageCircle className="h-10 w-10 text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground text-sm">No contacts found</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Recent Chats Section */}
                                            {unifiedList.recentChats.length > 0 && (
                                                <div className="mb-4">
                                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                                                        Recent Chats
                                                    </h3>
                                                    <div className="space-y-1">
                                                        {unifiedList.recentChats.map((item) => (
                                                            <ContactButton
                                                                key={(item.data as ChatRoom).id}
                                                                item={item}
                                                                isSelected={selectedRoom?.id === (item.data as ChatRoom).id}
                                                                onClick={() => handleContactClick(item)}
                                                                getInitials={getInitials}
                                                                currentUserId={user?.id}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Start New Chat Section */}
                                            {unifiedList.newChatUsers.length > 0 && (
                                                <div>
                                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">
                                                        Start New Chat
                                                    </h3>
                                                    <div className="space-y-1">
                                                        {unifiedList.newChatUsers.map((item) => (
                                                            <ContactButton
                                                                key={(item.data as ChatUser).id}
                                                                item={item}
                                                                isSelected={false}
                                                                onClick={() => handleContactClick(item)}
                                                                getInitials={getInitials}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Right Panel - Chat View */}
                    <Card className={cn(
                        "flex-1 flex flex-col",
                        !showChatOnMobile && "hidden md:flex"
                    )}>
                        {selectedRoom ? (
                            <ChatView
                                room={selectedRoom}
                                otherUser={activeOtherUser}
                                currentUserId={user?.id || ""}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">Select a conversation</h3>
                                <p className="text-muted-foreground text-sm">
                                    Select a contact from the list to start chatting
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}

function ChatView({
    room,
    otherUser,
    currentUserId,
}: {
    room: ChatRoom;
    otherUser?: ChatUser;
    currentUserId: string;
}) {
    const [messageInput, setMessageInput] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Fetch messages
    const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
        queryKey: [`/api/chat/rooms/${room.id}/messages`],
        refetchInterval: isRealtimeEnabled ? false : 5000,
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
            // Also invalidate rooms to update timestamp
            queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
        },
    });

    // Delete message mutation
    const deleteMessageMutation = useMutation({
        mutationFn: async (messageId: string) => {
            const res = await apiRequest("DELETE", `/api/chat/messages/${messageId}`);
            return res.json();
        },
        onSuccess: () => {
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

    // Delete chat room mutation
    const deleteChatMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("DELETE", `/api/chat/rooms/${room.id}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
            // This will need to trigger parent to deselect room
            window.location.reload(); // Simple approach - refresh page
        },
    });

    const handleDeleteChat = () => {
        setShowDeleteDialog(true);
    };

    const confirmDeleteChat = () => {
        deleteChatMutation.mutate();
        setShowDeleteDialog(false);
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim()) {
            sendMessageMutation.mutate(messageInput.trim());
        }
    };

    const displayName = otherUser
        ? `${otherUser.firstName} ${otherUser.lastName}`
        : (room.name || "Chat");

    const displayInitials = otherUser
        ? `${otherUser.firstName.charAt(0)}${otherUser.lastName.charAt(0)}`.toUpperCase()
        : (room.name?.charAt(0) || "C");

    return (
        <>
            {/* Desktop header */}
            <CardHeader className="hidden md:flex border-b pb-4 flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={otherUser?.profileImageUrl} />
                        <AvatarFallback>
                            {displayInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div>{displayName}</div>
                        {otherUser?.role && (
                            <div className="text-xs font-normal text-muted-foreground capitalize">
                                {otherUser.role}
                            </div>
                        )}
                    </div>
                </CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteChat}
                    disabled={deleteChatMutation.isPending}
                    className="text-muted-foreground hover:text-destructive"
                    title="Delete chat history"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea ref={scrollRef} className="h-full p-4">
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
                        <div className="space-y-3">
                            {messages.map((message) => {
                                const isOwn = message.senderId === currentUserId;
                                return (
                                    <div
                                        key={message.id}
                                        className={cn("flex group", isOwn ? "justify-end" : "justify-start")}
                                    >
                                        {isOwn && (
                                            <button
                                                onClick={() => deleteMessageMutation.mutate(message.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 self-center text-muted-foreground hover:text-destructive"
                                                disabled={deleteMessageMutation.isPending}
                                                title="Delete message"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                        <div
                                            className={cn(
                                                "max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2",
                                                isOwn
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            )}
                                        >
                                            {/* Sender name */}
                                            <p
                                                className={cn(
                                                    "text-xs font-medium mb-1",
                                                    isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                                                )}
                                            >
                                                {isOwn ? "You" : (otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Unknown")}
                                            </p>
                                            <p className="text-sm break-words">{message.content}</p>
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
            </CardContent>

            <div className="p-3 md:p-4 border-t">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sendMessageMutation.isPending}
                        className="flex-1"
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
                </form>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat History</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this entire chat history with {displayName}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteChat}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// Reusable contact button component
function ContactButton({
    item,
    isSelected,
    onClick,
    getInitials,
    currentUserId,
}: {
    item: ContactItem;
    isSelected: boolean;
    onClick: () => void;
    getInitials: (firstName: string, lastName: string) => string;
    currentUserId?: string;
}) {
    const isRoom = item.type === 'room';
    const otherUser = isRoom ? item.otherUser : item.data as ChatUser;

    const displayName = otherUser
        ? `${otherUser.firstName} ${otherUser.lastName}`
        : (isRoom ? ((item.data as ChatRoom).name || "Chat") : "Unknown");

    const displayImage = otherUser?.profileImageUrl;
    const displayInitials = otherUser
        ? getInitials(otherUser.firstName, otherUser.lastName)
        : "?";
    const displayRole = otherUser?.role;

    // Calculate unread status for rooms
    let hasUnread = false;
    if (isRoom && currentUserId) {
        const room = item.data as ChatRoom;
        const participants = room.chat_participants || (room as any).chatParticipants || [];
        const myParticipant = participants.find((p: any) =>
            p.user_id === currentUserId || p.userId === currentUserId
        );
        if (myParticipant) {
            const lastReadStr = myParticipant.last_read_at || myParticipant.lastReadAt;
            const lastRead = lastReadStr ? new Date(lastReadStr) : new Date(0);
            const roomUpdated = new Date(room.updatedAt);
            hasUnread = roomUpdated > lastRead;
        }
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                isSelected ? "bg-primary/10" : "hover:bg-muted/50"
            )}
        >
            <div className="relative">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={displayImage} />
                    <AvatarFallback>{displayInitials}</AvatarFallback>
                </Avatar>
                {hasUnread && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <p className={cn("truncate", hasUnread ? "font-bold" : "font-medium")}>
                        {displayName}
                    </p>
                    {isRoom && (
                        <span className="text-[10px] text-muted-foreground ml-2">
                            {format(new Date((item.data as ChatRoom).updatedAt), "MMM d")}
                        </span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {displayRole
                        ? <span className="capitalize">{displayRole}</span>
                        : (isRoom ? "Active chat" : "Start a conversation")
                    }
                </p>
            </div>
        </button>
    );
}
