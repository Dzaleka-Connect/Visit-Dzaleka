import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, formatDistanceToNow, isToday } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  ListTodo,
  Loader2,
  MessageSquare,
  Search,
  Send,
  TimerReset,
} from "lucide-react";
import { SEO } from "@/components/seo";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Task, TaskComment } from "@shared/schema";

const STATUSES = ["pending", "in_progress", "under_review", "completed", "cancelled"] as const;
const PRIORITIES = ["urgent", "high", "medium", "low"] as const;
const CATEGORIES = ["tour_prep", "training", "admin", "maintenance", "communication", "documentation", "other"] as const;

const priorityStyles: Record<string, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200",
  medium: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  high: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  urgent: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200",
};

const priorityAccent: Record<string, string> = {
  low: "border-l-slate-300",
  medium: "border-l-sky-400",
  high: "border-l-amber-500",
  urgent: "border-l-red-500",
};

const statusStyles: Record<string, string> = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-200",
  in_progress: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
  under_review: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  cancelled: "border-muted bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  under_review: "Under review",
  completed: "Completed",
  cancelled: "Cancelled",
};

const categoryLabels: Record<string, string> = {
  tour_prep: "Tour prep",
  training: "Training",
  admin: "Admin",
  maintenance: "Maintenance",
  communication: "Communication",
  documentation: "Documentation",
  other: "Other",
};

const priorityRank: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function getInitialParam(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
}

function labelFromValue(value?: string | null) {
  if (!value) return "Not set";
  return statusLabels[value] || categoryLabels[value] || value.replace(/_/g, " ");
}

function isTaskDone(task: Task) {
  return task.status === "completed" || task.status === "cancelled";
}

function isOverdue(task: Task) {
  if (!task.dueDate || isTaskDone(task)) return false;
  return new Date(task.dueDate) < new Date() && !isToday(new Date(task.dueDate));
}

function dueLabel(task: Task) {
  if (!task.dueDate) return "No due date";
  const dueDate = new Date(task.dueDate);
  if (isToday(dueDate)) return "Due today";
  if (isOverdue(task)) return `Overdue ${formatDistanceToNow(dueDate)} ago`;
  return `Due ${format(dueDate, "MMM d, yyyy")}`;
}

function assigneeName(task: Task) {
  const assignee = (task as any).assignee;
  if (!assignee) return "";
  return `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() || assignee.email || "";
}

export default function Tasks() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comment, setComment] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => getInitialParam("status", "active"));
  const [priorityFilter, setPriorityFilter] = useState(() => getInitialParam("priority", "all"));
  const [categoryFilter, setCategoryFilter] = useState(() => getInitialParam("category", "all"));
  const [search, setSearch] = useState(() => getInitialParam("q", ""));

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<TaskComment[]>({
    queryKey: ["/api/tasks", selectedTask?.id, "comments"],
    enabled: !!selectedTask,
  });

  const updateUrl = (next: {
    status?: string;
    priority?: string;
    category?: string;
    q?: string;
  }) => {
    const values = {
      status: next.status ?? statusFilter,
      priority: next.priority ?? priorityFilter,
      category: next.category ?? categoryFilter,
      q: next.q ?? search,
    };
    const params = new URLSearchParams();
    if (values.status !== "active") params.set("status", values.status);
    if (values.priority !== "all") params.set("priority", values.priority);
    if (values.category !== "all") params.set("category", values.category);
    if (values.q.trim()) params.set("q", values.q.trim());
    setLocation(params.toString() ? `/tasks?${params.toString()}` : "/tasks");
  };

  const setFilter = (key: "status" | "priority" | "category" | "q", value: string) => {
    if (key === "status") setStatusFilter(value);
    if (key === "priority") setPriorityFilter(value);
    if (key === "category") setCategoryFilter(value);
    if (key === "q") setSearch(value);
    updateUrl({ [key]: value });
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
      return res.json();
    },
    onSuccess: (updatedTask: Task) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask);
      toast({ title: "Task status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

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

  const stats = useMemo(() => {
    const active = tasks.filter((task) => task.status === "pending" || task.status === "in_progress");
    return {
      active: active.length,
      dueToday: tasks.filter((task) => task.dueDate && isToday(new Date(task.dueDate)) && !isTaskDone(task)).length,
      overdue: tasks.filter(isOverdue).length,
      review: tasks.filter((task) => task.status === "under_review").length,
      completed: tasks.filter((task) => task.status === "completed").length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...tasks]
      .filter((task) => {
        if (statusFilter === "active" && !(task.status === "pending" || task.status === "in_progress")) return false;
        if (statusFilter === "overdue" && !isOverdue(task)) return false;
        if (statusFilter !== "all" && statusFilter !== "active" && statusFilter !== "overdue" && task.status !== statusFilter) return false;
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
        if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
        if (!normalizedSearch) return true;
        return [
          task.title,
          task.description,
          task.category,
          task.priority,
          task.status,
          assigneeName(task),
        ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        const aDone = isTaskDone(a) ? 1 : 0;
        const bDone = isTaskDone(b) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        if (aDue !== bDue) return aDue - bDue;
        return (priorityRank[a.priority || "medium"] ?? 2) - (priorityRank[b.priority || "medium"] ?? 2);
      });
  }, [categoryFilter, priorityFilter, search, statusFilter, tasks]);

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleAddComment = () => {
    if (!selectedTask || !comment.trim()) return;
    commentMutation.mutate({ taskId: selectedTask.id, content: comment.trim() });
  };

  const resetFilters = () => {
    setStatusFilter("active");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setSearch("");
    setLocation("/tasks");
  };

  const renderTaskCard = (task: Task) => {
    const overdue = isOverdue(task);
    const dueClass = overdue ? "text-red-600 dark:text-red-300" : task.dueDate && isToday(new Date(task.dueDate)) ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground";
    const assignee = assigneeName(task);

    return (
      <Card
        key={task.id}
        className={`overflow-hidden border-l-4 ${priorityAccent[task.priority || "medium"] || priorityAccent.medium} ${overdue ? "border-red-300 bg-red-50/35 dark:bg-red-950/10" : ""}`}
      >
        <CardContent className="p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words text-base font-semibold leading-snug">{task.title}</h3>
                <Badge variant="outline" className={priorityStyles[task.priority || "medium"]}>
                  {labelFromValue(task.priority)}
                </Badge>
                <Badge variant="outline" className={statusStyles[task.status || "pending"]}>
                  {labelFromValue(task.status)}
                </Badge>
                {overdue && <Badge variant="destructive">Overdue</Badge>}
              </div>

              {task.description && (
                <p className="line-clamp-2 max-w-3xl break-words text-sm leading-relaxed text-muted-foreground">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <span className={`inline-flex items-center gap-1.5 ${dueClass}`}>
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {dueLabel(task)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {categoryLabels[task.category || "other"] || labelFromValue(task.category)}
                </span>
                {task.estimatedHours ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {task.estimatedHours}h estimate
                  </span>
                ) : null}
                {assignee ? (
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                    Assigned to <span className="max-w-48 truncate font-medium text-foreground">{assignee}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Label htmlFor={`status-${task.id}`} className="sr-only">Update task status</Label>
              <Select
                value={task.status || "pending"}
                onValueChange={(value) => handleStatusChange(task.id, value)}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger id={`status-${task.id}`} className="h-10 min-h-10 w-full text-base sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-10 justify-center gap-2"
                onClick={() => setSelectedTask(task)}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <SEO title="My Tasks" description="View and manage your assigned tasks" />

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
              <ListTodo className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My Tasks</h1>
                <Badge variant={stats.overdue > 0 ? "destructive" : "secondary"} className="gap-2">
                  <span className={`h-2 w-2 rounded-full ${stats.overdue > 0 ? "bg-white" : "bg-emerald-500"}`} />
                  {stats.overdue > 0 ? `${stats.overdue} overdue` : "On track"}
                </Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Track assigned work, update progress, and keep task notes in one place.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetFilters} className="gap-2">
              <TimerReset className="h-4 w-4" aria-hidden="true" />
              Reset filters
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-sky-600" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-2xl font-semibold tabular-nums">{stats.active}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-8 w-8 text-amber-600" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-2xl font-semibold tabular-nums">{stats.dueToday}</div>
              <p className="text-sm text-muted-foreground">Due today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-2xl font-semibold tabular-nums">{stats.overdue}</div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-2xl font-semibold tabular-nums">{stats.completed}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" aria-hidden="true" />
            Task queue
          </CardTitle>
          <CardDescription>
            Showing {filteredTasks.length} of {tasks.length} tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Label htmlFor="task-search" className="sr-only">Search tasks</Label>
              <Input
                id="task-search"
                name="taskSearch"
                value={search}
                onChange={(event) => setFilter("q", event.target.value)}
                placeholder="Search tasks…"
                className="h-10 min-h-10 pl-9 text-base"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setFilter("status", value)}>
              <SelectTrigger className="h-10 min-h-10 text-base sm:text-sm" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active work</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setFilter("priority", value)}>
              <SelectTrigger className="h-10 min-h-10 text-base sm:text-sm" aria-label="Filter by priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>{labelFromValue(priority)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => setFilter("category", value)}>
              <SelectTrigger className="h-10 min-h-10 text-base sm:text-sm" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{categoryLabels[category]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3" aria-live="polite">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-lg border p-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-3">
              {filteredTasks.map(renderTaskCard)}
            </div>
          ) : tasks.length > 0 ? (
            <EmptyState
              icon={Search}
              title="No tasks match these filters"
              description="Clear the filters or search for a different task title, category, or status."
              action={<Button variant="outline" onClick={resetFilters}>Reset filters</Button>}
            />
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No tasks assigned"
              description="New assigned tasks will appear here with due dates, status, and comments."
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
            setComment("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="break-words">{selectedTask?.title}</DialogTitle>
            <DialogDescription className="break-words">
              {selectedTask?.description || "No task description has been added."}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={priorityStyles[selectedTask.priority || "medium"]}>
                  {labelFromValue(selectedTask.priority)}
                </Badge>
                <Badge variant="outline" className={statusStyles[selectedTask.status || "pending"]}>
                  {labelFromValue(selectedTask.status)}
                </Badge>
                {isOverdue(selectedTask) && <Badge variant="destructive">Overdue</Badge>}
              </div>

              <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Due</p>
                  <p className="mt-1 font-medium">{dueLabel(selectedTask)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Category</p>
                  <p className="mt-1 font-medium">{categoryLabels[selectedTask.category || "other"] || labelFromValue(selectedTask.category)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Estimated time</p>
                  <p className="mt-1 font-medium">{selectedTask.estimatedHours ? `${selectedTask.estimatedHours} hours` : "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Assigned to</p>
                  <p className="mt-1 truncate font-medium">{assigneeName(selectedTask) || "Not shown"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail-status">Status</Label>
                <Select
                  value={selectedTask.status || "pending"}
                  onValueChange={(value) => handleStatusChange(selectedTask.id, value)}
                  disabled={updateMutation.isPending}
                >
                  <SelectTrigger id="detail-status" className="h-10 min-h-10 text-base sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold">Comments</h4>
                  <Badge variant="outline" className="tabular-nums">{comments.length}</Badge>
                </div>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3">
                  {commentsLoading ? (
                    <div className="space-y-2" aria-live="polite">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-5/6" />
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-background p-3">
                        <p className="break-words text-sm">{item.content}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt!), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No comments yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-comment">Add comment</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Textarea
                    id="task-comment"
                    name="taskComment"
                    placeholder="Add a clear update…"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault();
                        handleAddComment();
                      }
                    }}
                    rows={3}
                    className="min-h-24 text-base"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!comment.trim() || commentMutation.isPending}
                    className="h-10 min-h-10 gap-2 sm:self-end"
                  >
                    {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

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
