import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import type { Task, User } from "@shared/schema";
import {
    Plus,
    Pencil,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle,
    Users,
    ListTodo,
    Calendar,
    Filter,
    Search,
} from "lucide-react";
import { format } from "date-fns";
import { DataErrorState } from "@/components/data-error-state";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const STATUSES = ["pending", "in_progress", "under_review", "completed", "cancelled"] as const;
const CATEGORIES = ["tour_prep", "training", "admin", "maintenance", "communication", "documentation", "other"] as const;

const priorityColors: Record<string, string> = {
    low: "bg-slate-100 text-slate-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    under_review: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
};

export default function TaskAdmin() {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [deleteTask, setDeleteTask] = useState<Task | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [taskSearch, setTaskSearch] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "other",
        priority: "medium",
        status: "pending",
        assignedTo: "",
        dueDate: "",
        estimatedHours: "",
    });

    // Fetch tasks
    const { data: tasks, isLoading: tasksLoading, isError: tasksError, refetch: refetchTasks } = useQuery<Task[]>({
        queryKey: ["/api/tasks", statusFilter, priorityFilter],
        queryFn: async () => {
            let url = "/api/tasks";
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
            if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);
            if (params.toString()) url += `?${params.toString()}`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch tasks");
            return res.json();
        },
    });

    // Fetch users for assignment
    const { data: users, isError: usersError, refetch: refetchUsers } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    // Fetch task stats
    const { data: stats, isError: statsError, refetch: refetchStats } = useQuery<{ total: number; pending: number; inProgress: number; completed: number; overdue: number }>({
        queryKey: ["/api/tasks/stats"],
    });

    // Client-side text search
    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        if (!taskSearch) return tasks;
        const q = taskSearch.toLowerCase();
        return tasks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q)
        );
    }, [tasks, taskSearch]);

    // Build a user lookup map for assignee display
    const userMap = useMemo(() => {
        const m = new Map<string, string>();
        users?.forEach(u => m.set(u.id, `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Unknown"));
        return m;
    }, [users]);
    const statValue = (value?: number) => statsError ? "Unavailable" : (value ?? 0);

    // Task input type for API (dates as ISO strings)
    type TaskInput = {
        title: string;
        description: string | null;
        category: string;
        priority: string;
        status: string;
        assignedTo: string | null;
        dueDate: string | null;
        estimatedHours: number | null;
        id?: string;
    };

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (task: TaskInput) => {
            const res = await apiRequest("POST", "/api/tasks", task);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
            setIsCreateOpen(false);
            resetForm();
            toast({ title: "Task created successfully" });
        },
        onError: () => {
            toast({ title: "Failed to create task", variant: "destructive" });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, ...task }: TaskInput & { id: string }) => {
            const res = await apiRequest("PATCH", `/api/tasks/${id}`, task);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
            setEditTask(null);
            resetForm();
            toast({ title: "Task updated successfully" });
        },
        onError: () => {
            toast({ title: "Failed to update task", variant: "destructive" });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
            setDeleteTask(null);
            toast({ title: "Task deleted successfully" });
        },
        onError: () => {
            toast({ title: "Failed to delete task", variant: "destructive" });
        },
    });

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            category: "other",
            priority: "medium",
            status: "pending",
            assignedTo: "",
            dueDate: "",
            estimatedHours: "",
        });
    };

    const handleEdit = (task: Task) => {
        setFormData({
            title: task.title,
            description: task.description || "",
            category: task.category || "other",
            priority: task.priority || "medium",
            status: task.status || "pending",
            assignedTo: task.assignedTo || "",
            dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
            estimatedHours: task.estimatedHours?.toString() || "",
        });
        setEditTask(task);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            priority: formData.priority,
            status: formData.status,
            assignedTo: formData.assignedTo || null,
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        };

        if (editTask) {
            updateMutation.mutate({ id: editTask.id, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6">
            <SEO title="Task Management" description="Manage and assign tasks" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Task Management</h1>
                    <p className="text-muted-foreground">Create and assign tasks to team members</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm} disabled={usersError}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Task
                        </Button>
                    </DialogTrigger>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <ListTodo className="h-5 w-5 text-blue-600" />
                            <div>
                                <div className="text-2xl font-bold tabular-nums">{statValue(stats?.total)}</div>
                                <p className="text-sm text-muted-foreground">Total Tasks</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            <div>
                                <div className="text-2xl font-bold tabular-nums">{statValue(stats?.pending)}</div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <div>
                                <div className="text-2xl font-bold tabular-nums">{statValue(stats?.inProgress)}</div>
                                <p className="text-sm text-muted-foreground">In Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                                <div className="text-2xl font-bold tabular-nums">{statValue(stats?.completed)}</div>
                                <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <div className="text-2xl font-bold tabular-nums">{statValue(stats?.overdue)}</div>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {(statsError || usersError) && (
                <div className="grid gap-3 md:grid-cols-2">
                    {statsError && (
                        <DataErrorState
                            title="Task stats unavailable"
                            description="Task totals could not be loaded. Retry before treating these metrics as zero."
                            onRetry={() => void refetchStats()}
                        />
                    )}
                    {usersError && (
                        <DataErrorState
                            title="Assignable users unavailable"
                            description="User data could not be loaded, so assignment controls are disabled."
                            onRetry={() => void refetchUsers()}
                        />
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks\u2026"
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 h-9">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40 h-9">
                        <SelectValue placeholder="All Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        {PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tasks Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Tasks</CardTitle>
                    <CardDescription>Manage all tasks and their assignments</CardDescription>
                </CardHeader>
                <CardContent>
                    {tasksLoading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading tasks\u2026</p>
                    ) : tasksError ? (
                        <DataErrorState
                            title="Tasks unavailable"
                            description="Task queue data could not be loaded. Retry before treating the queue as empty."
                            onRetry={() => void refetchTasks()}
                        />
                    ) : filteredTasks && filteredTasks.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{task.category}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={priorityColors[task.priority || "medium"]}>
                                                {task.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[task.status || "pending"]}>
                                                {task.status?.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {task.assignedTo ? (
                                                <span className="text-sm">{userMap.get(task.assignedTo) || "Unknown"}</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {task.dueDate ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">No due date</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(task)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTask(task)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">No tasks found. Create your first task!</p>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen || !!editTask} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditTask(null); } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editTask ? "Edit Task" : "Create New Task"}</DialogTitle>
                        <DialogDescription>
                            {editTask ? "Update task details" : "Fill in the details to create a new task"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((c) => (
                                                <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Priority</Label>
                                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRIORITIES.map((p) => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map((s) => (
                                                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Assign To</Label>
                                    <Select value={formData.assignedTo || "none"} onValueChange={(v) => setFormData({ ...formData, assignedTo: v === "none" ? "" : v })}>
                                        <SelectTrigger disabled={usersError}>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Unassigned</SelectItem>
                                            {users?.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="estimatedHours">Est. Hours</Label>
                                    <Input
                                        id="estimatedHours"
                                        type="number"
                                        min="0"
                                        value={formData.estimatedHours}
                                        onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditTask(null); }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || usersError}>
                                {createMutation.isPending || updateMutation.isPending ? "Saving…" : editTask ? "Update Task" : "Create Task"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTask} onOpenChange={() => setDeleteTask(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteTask?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTask && deleteMutation.mutate(deleteTask.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
