import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import type { Task, TaskComment } from "@shared/schema";
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    MessageSquare,
    Send,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const priorityColors: Record<string, string> = {
    low: "bg-slate-100 text-slate-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    under_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function Tasks() {
    const { toast } = useToast();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [comment, setComment] = useState("");

    // Fetch user's tasks
    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey: ["/api/tasks"],
    });

    // Fetch comments for selected task
    const { data: comments } = useQuery<TaskComment[]>({
        queryKey: ["/api/tasks", selectedTask?.id, "comments"],
        enabled: !!selectedTask,
    });

    // Update task status
    const updateMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            toast({ title: "Task updated successfully" });
        },
        onError: () => {
            toast({ title: "Failed to update task", variant: "destructive" });
        },
    });

    // Add comment
    const commentMutation = useMutation({
        mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
            const res = await apiRequest("POST", `/api/tasks/${taskId}/comments`, { content });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks", selectedTask?.id, "comments"] });
            setComment("");
            toast({ title: "Comment added" });
        },
        onError: () => {
            toast({ title: "Failed to add comment", variant: "destructive" });
        },
    });

    const pendingTasks = tasks?.filter(t => t.status === "pending" || t.status === "in_progress") || [];
    const completedTasks = tasks?.filter(t => t.status === "completed") || [];

    const handleStatusChange = (taskId: string, newStatus: string) => {
        updateMutation.mutate({ id: taskId, status: newStatus });
    };

    const handleAddComment = () => {
        if (!selectedTask || !comment.trim()) return;
        commentMutation.mutate({ taskId: selectedTask.id, content: comment.trim() });
    };

    const isOverdue = (task: Task) => {
        return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
    };

    return (
        <div className="space-y-6">
            <SEO title="My Tasks" description="View and manage your assigned tasks" />

            <div>
                <h1 className="text-2xl font-bold">My Tasks</h1>
                <p className="text-muted-foreground">Track and complete your assigned tasks</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div>
                            <div className="text-2xl font-bold">{pendingTasks.length}</div>
                            <p className="text-sm text-muted-foreground">Active Tasks</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                            <div className="text-2xl font-bold">{completedTasks.length}</div>
                            <p className="text-sm text-muted-foreground">Completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                        <div>
                            <div className="text-2xl font-bold">{tasks?.filter(t => isOverdue(t)).length || 0}</div>
                            <p className="text-sm text-muted-foreground">Overdue</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tasks List */}
            {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading tasks...</p>
            ) : tasks && tasks.length > 0 ? (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <Card key={task.id} className={isOverdue(task) ? "border-red-300" : ""}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-semibold">{task.title}</h3>
                                            <Badge className={priorityColors[task.priority || "medium"]}>
                                                {task.priority}
                                            </Badge>
                                            <Badge className={statusColors[task.status || "pending"]}>
                                                {task.status?.replace("_", " ")}
                                            </Badge>
                                            {isOverdue(task) && (
                                                <Badge variant="destructive">Overdue</Badge>
                                            )}
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {(task as any).assignee && (
                                                <span className="flex items-center gap-1 font-medium text-foreground">
                                                    Assigned to: {(task as any).assignee.firstName || (task as any).assignee.email}
                                                </span>
                                            )}
                                            {task.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                                                </span>
                                            )}
                                            <Badge variant="outline">{task.category}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={task.status || "pending"}
                                            onValueChange={(v) => handleStatusChange(task.id, v)}
                                        >
                                            <SelectTrigger className="w-36">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="under_review">Under Review</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedTask(task)}
                                            aria-label="View comments"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Tasks Assigned</h3>
                        <p className="text-muted-foreground">You don't have any tasks assigned yet. Check back later!</p>
                    </CardContent>
                </Card>
            )}

            {/* Task Detail Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedTask?.title}</DialogTitle>
                        <DialogDescription>{selectedTask?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Badge className={priorityColors[selectedTask?.priority || "medium"]}>
                                {selectedTask?.priority}
                            </Badge>
                            <Badge className={statusColors[selectedTask?.status || "pending"]}>
                                {selectedTask?.status?.replace("_", " ")}
                            </Badge>
                        </div>

                        {/* Comments Section */}
                        <div>
                            <h4 className="font-semibold mb-2">Comments</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {comments && comments.length > 0 ? (
                                    comments.map((c) => (
                                        <div key={c.id} className="p-2 bg-muted rounded-lg">
                                            <p className="text-sm">{c.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(c.createdAt!), { addSuffix: true })}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No comments yet</p>
                                )}
                            </div>
                        </div>

                        {/* Add Comment */}
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={2}
                            />
                            <Button onClick={handleAddComment} disabled={!comment.trim() || commentMutation.isPending}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedTask(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
