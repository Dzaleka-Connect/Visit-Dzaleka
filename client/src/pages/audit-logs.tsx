import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import type { AuditLog } from "@shared/schema";

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
    const { data: logs, isLoading } = useQuery<EnrichedAuditLog[]>({
        queryKey: ["/api/audit-logs"],
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
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground">
                    Track all system activities and changes made by users.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Activity Log
                    </CardTitle>
                    <CardDescription>
                        Showing the most recent 100 activities
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-muted-foreground">Loading audit logs...</p>
                    ) : !logs || logs.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="No audit logs"
                            description="System activities will be recorded here."
                            className="py-12"
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Entity</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead>IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => {
                                        const ActionIcon = actionIcons[log.action || 'update'] || Pencil;
                                        const actionStyle = actionColors[log.action || 'update'] || actionColors.update;
                                        const EntityIcon = entityIcons[log.entityType || 'user'] || FileText;
                                        const changes = formatChanges(log.oldValues, log.newValues);

                                        return (
                                            <TableRow key={log.id}>
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
                                                    <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                        {changes || (
                                                            <span className="italic">No changes recorded</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs">
                                                        {log.ipAddress || "-"}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
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
