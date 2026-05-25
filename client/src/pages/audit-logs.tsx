import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
    FileText,
    User,
    Calendar,
    Shield,
    Pencil,
    Trash2,
    LogIn,
    LogOut,
    UserPlus,
    Settings,
    CreditCard,
    CheckCircle,
    XCircle,
    Power,
    AlertTriangle,
    Search,
    Download,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/empty-state";
import { DataErrorState } from "@/components/data-error-state";
import { apiRequest } from "@/lib/queryClient";
import type { AuditLog } from "@shared/schema";
import { SEO } from "@/components/seo";

const actionIcons: Record<string, any> = {
    create: UserPlus,
    update: Pencil,
    delete: Trash2,
    login: LogIn,
    logout: LogOut,
    activate: Power,
    deactivate: Power,
    approve: CheckCircle,
    reject: XCircle,
    payment: CreditCard,
};

const actionColors: Record<string, { bg: string; text: string }> = {
    create: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    update: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
    delete: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
    login: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-400" },
    logout: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-400" },
    activate: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    deactivate: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
    approve: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    reject: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
    payment: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
};

const entityIcons: Record<string, any> = {
    user: User,
    booking: Calendar,
    guide: Shield,
    zone: Settings,
    payment: CreditCard,
};

// Extended type with enriched fields from API
interface EnrichedAuditLog extends AuditLog {
    userName?: string;
    entityDisplay?: string | null;
}

export default function AuditLogs() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [cleanupDays, setCleanupDays] = useState("30");
    const [actionFilter, setActionFilter] = useState("all");
    const [entityFilter, setEntityFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const {
        data: logs,
        isLoading,
        isError: logsIsError,
        error: logsError,
        refetch: refetchLogs,
    } = useQuery<EnrichedAuditLog[]>({
        queryKey: ["/api/audit-logs"],
    });

    const logsErrorMessage = logsError instanceof Error
        ? logsError.message
        : "Audit log data could not be loaded.";

    // Derive unique actions and entities for filter options
    const uniqueActions = useMemo(() => {
        if (!logs) return [];
        return Array.from(new Set(logs.map(l => l.action).filter(Boolean)));
    }, [logs]);

    const uniqueEntities = useMemo(() => {
        if (!logs) return [];
        return Array.from(new Set(logs.map(l => l.entityType).filter(Boolean)));
    }, [logs]);

    // Client-side filtering
    const filteredLogs = useMemo(() => {
        if (!logs) return [];
        return logs.filter(log => {
            if (actionFilter !== "all" && log.action !== actionFilter) return false;
            if (entityFilter !== "all" && log.entityType !== entityFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (
                    !log.userName?.toLowerCase().includes(q) &&
                    !log.entityDisplay?.toLowerCase().includes(q) &&
                    !log.entityId?.toLowerCase().includes(q) &&
                    !log.ipAddress?.toLowerCase().includes(q) &&
                    !log.action?.toLowerCase().includes(q)
                ) return false;
            }
            return true;
        });
    }, [logs, actionFilter, entityFilter, searchQuery]);

    const handleExportCsv = () => {
        if (!filteredLogs.length) return;
        const headers = ["Timestamp", "Action", "Entity Type", "Entity", "User", "IP Address", "Changes"];
        const rows = filteredLogs.map(log => [
            log.createdAt ? new Date(log.createdAt).toISOString() : "",
            log.action || "",
            log.entityType || "",
            log.entityDisplay || log.entityId || "",
            log.userName || "System",
            log.ipAddress || "",
            formatChanges(log.oldValues, log.newValues) || "",
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("DELETE", `/api/audit-logs/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
            toast({ title: "Log deleted", description: "Audit log has been removed." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete audit log.", variant: "destructive" });
        },
    });

    const cleanupMutation = useMutation({
        mutationFn: async (days: number) => {
            const res = await apiRequest("DELETE", `/api/audit-logs/cleanup/${days}`);
            return res.json();
        },
        onSuccess: (data: { deleted: number }) => {
            queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
            toast({
                title: "Cleanup complete",
                description: `Deleted ${data.deleted} logs older than ${cleanupDays} days.`
            });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to clean up logs.", variant: "destructive" });
        },
    });

    const formatChanges = (oldValue: any, newValue: any) => {
        if (!oldValue && !newValue) return null;

        const changes: string[] = [];
        const allKeys = new Set([
            ...Object.keys(oldValue || {}),
            ...Object.keys(newValue || {}),
        ]);

        allKeys.forEach(key => {
            const old = oldValue?.[key];
            const newVal = newValue?.[key];
            if (old !== newVal) {
                if (key === 'password' || key === 'passwordHash') {
                    changes.push(`${key}: [changed]`);
                } else {
                    changes.push(`${key}: ${old ?? 'null'} → ${newVal ?? 'null'}`);
                }
            }
        });

        return changes.length > 0 ? changes.join(', ') : null;
    };

    return (
        <div className="space-y-6">
            <SEO
                title="Audit Logs"
                description="Track all system activities and changes made by users in Visit Dzaleka."
            />
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground">
                    Track all system activities and changes made by users.
                </p>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search logs\u2026"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-36 h-9">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {uniqueActions.map(a => (
                            <SelectItem key={a} value={a!} className="capitalize">{a}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="w-36 h-9">
                        <SelectValue placeholder="Entity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        {uniqueEntities.map(e => (
                            <SelectItem key={e} value={e!} className="capitalize">{e}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={logsIsError || !filteredLogs.length} className="h-9">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Activity Log
                            </CardTitle>
                            <CardDescription>
                                {filteredLogs.length} of {logs?.length || 0} entries
                            </CardDescription>
                        </div>

                        {/* Cleanup Controls */}
                        <div className="flex items-center gap-2">
                                    <Select value={cleanupDays} onValueChange={setCleanupDays} disabled={logsIsError}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Older than 7 days</SelectItem>
                                    <SelectItem value="30">Older than 30 days</SelectItem>
                                    <SelectItem value="60">Older than 60 days</SelectItem>
                                    <SelectItem value="90">Older than 90 days</SelectItem>
                                </SelectContent>
                            </Select>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={logsIsError}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Cleanup
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-destructive" />
                                            Delete Old Audit Logs?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete all audit logs older than {cleanupDays} days.
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => cleanupMutation.mutate(parseInt(cleanupDays))}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            Delete Logs
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground">Loading audit logs...</p>
                    ) : logsIsError ? (
                        <DataErrorState
                            title="Audit logs unavailable"
                            description={`The audit trail could not be loaded. ${logsErrorMessage}`}
                            onRetry={() => refetchLogs()}
                            className="py-12"
                        />
                    ) : !filteredLogs || filteredLogs.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title={logs && logs.length > 0 ? "No matching logs" : "No audit logs"}
                            description={logs && logs.length > 0 ? "Try adjusting your filters." : "System activities will be recorded here."}
                            className="py-12"
                        />
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Entity</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log) => {
                                        const ActionIcon = actionIcons[log.action || 'update'] || Pencil;
                                        const actionStyle = actionColors[log.action || 'update'] || actionColors.update;
                                        const EntityIcon = entityIcons[log.entityType || 'user'] || FileText;
                                        const changes = formatChanges(log.oldValues, log.newValues);

                                        return (
                                            <React.Fragment key={log.id}>
                                            <TableRow>
                                                <TableCell className="whitespace-nowrap">
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {log.createdAt
                                                                ? new Date(log.createdAt).toLocaleDateString()
                                                                : "-"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {log.createdAt
                                                                ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                                                                : ""}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${actionStyle.bg} ${actionStyle.text}`}>
                                                        <ActionIcon className="mr-1 h-3 w-3" />
                                                        {log.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <EntityIcon className="h-4 w-4 text-muted-foreground" />
                                                            <span className="capitalize font-medium">{log.entityType}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {log.entityDisplay || log.entityId?.slice(0, 8) + "..."}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium">
                                                        {log.userName || "System"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        type="button"
                                                        className="max-w-xs truncate text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                                                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                                        aria-label={expandedLogId === log.id ? "Collapse details" : "Expand details"}
                                                    >
                                                        {changes ? (
                                                            <>
                                                                {expandedLogId === log.id
                                                                    ? <ChevronDown className="h-3 w-3 shrink-0" />
                                                                    : <ChevronRight className="h-3 w-3 shrink-0" />}
                                                                <span className="truncate">{changes}</span>
                                                            </>
                                                        ) : (
                                                            <span className="italic">No changes recorded</span>
                                                        )}
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs">
                                                        {log.ipAddress || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => deleteMutation.mutate(log.id)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {expandedLogId === log.id && !!(log.oldValues || log.newValues) && (
                                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                    <TableCell colSpan={7} className="p-4">
                                                        <div className="grid gap-4 md:grid-cols-2 text-xs font-mono">
                                                            {!!log.oldValues && Object.keys(log.oldValues as Record<string, unknown>).length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-semibold font-sans text-muted-foreground mb-2">Previous Values</p>
                                                                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3 space-y-1">
                                                                        {Object.entries(log.oldValues as Record<string, unknown>).map(([key, val]) => (
                                                                            <div key={key} className="flex gap-2">
                                                                                <span className="text-muted-foreground shrink-0">{key}:</span>
                                                                                <span className="text-red-700 dark:text-red-400 break-all">
                                                                                    {key === 'password' || key === 'passwordHash' ? '[redacted]' : String(val ?? 'null')}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!!log.newValues && Object.keys(log.newValues as Record<string, unknown>).length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-semibold font-sans text-muted-foreground mb-2">New Values</p>
                                                                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-3 space-y-1">
                                                                        {Object.entries(log.newValues as Record<string, unknown>).map(([key, val]) => (
                                                                            <div key={key} className="flex gap-2">
                                                                                <span className="text-muted-foreground shrink-0">{key}:</span>
                                                                                <span className="text-green-700 dark:text-green-400 break-all">
                                                                                    {key === 'password' || key === 'passwordHash' ? '[redacted]' : String(val ?? 'null')}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
