import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Save,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type UserRole = "admin" | "coordinator" | "guide" | "security" | "visitor" | "transport_partner";
type Priority = "low" | "normal" | "high" | "urgent";
type InternalStatus = "active" | "watching" | "paused" | "escalated";

type OperationsUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: UserRole;
  isActive: boolean | null;
};

type WorkflowDefinition = {
  key: string;
  label: string;
  description: string;
  ownerRoles: UserRole[];
  defaultEscalationHours: number;
};

type ApprovalDefinition = {
  key: string;
  label: string;
  description: string;
};

type NotificationDefinition = {
  key: string;
  label: string;
  defaultRoles: UserRole[];
};

type WorkflowSetting = {
  ownerUserId: string | null;
  assignedToUserId: string | null;
  priority: Priority;
  internalStatus: InternalStatus;
  escalationHours: number;
  notes: string;
};

type NotificationSetting = {
  roleRecipients: UserRole[];
  userRecipientIds: string[];
};

type OperationsSettings = {
  workflows: Record<string, WorkflowSetting>;
  approvals: Record<string, boolean>;
  notifications: Record<string, NotificationSetting>;
};

type QueueSummary = Record<string, {
  openCount: number;
  urgentCount: number;
  label: string;
}>;

type OperationsControlResponse = {
  settings: OperationsSettings;
  workflowDefinitions: WorkflowDefinition[];
  approvalDefinitions: ApprovalDefinition[];
  notificationDefinitions: NotificationDefinition[];
  queueSummary: QueueSummary;
  users: OperationsUser[];
};

const NONE_VALUE = "unassigned";
const ROLES: UserRole[] = ["admin", "coordinator", "security"];

function displayName(user?: OperationsUser) {
  if (!user) return "Unassigned";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
}

function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function priorityBadge(priority: Priority) {
  const styles: Record<Priority, string> = {
    low: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
    normal: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    high: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return styles[priority];
}

export default function OperationsControlPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<OperationsSettings | null>(null);

  const { data, isLoading } = useQuery<OperationsControlResponse>({
    queryKey: ["/api/operations-control"],
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings(data.settings);
    }
  }, [data?.settings]);

  const usersById = useMemo(() => new Map((data?.users || []).map((user) => [user.id, user])), [data?.users]);

  const saveMutation = useMutation({
    mutationFn: async (nextSettings: OperationsSettings) => {
      const response = await apiRequest("PATCH", "/api/operations-control", nextSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations-control"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Operations control saved",
        description: "Delegation, approvals, and notification routing have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save operations control",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateWorkflow = (key: string, patch: Partial<WorkflowSetting>) => {
    setSettings((current) => {
      if (!current) return current;
      return {
        ...current,
        workflows: {
          ...current.workflows,
          [key]: {
            ...current.workflows[key],
            ...patch,
          },
        },
      };
    });
  };

  const updateApproval = (key: string, enabled: boolean) => {
    setSettings((current) => current ? {
      ...current,
      approvals: {
        ...current.approvals,
        [key]: enabled,
      },
    } : current);
  };

  const toggleNotificationRole = (key: string, role: UserRole) => {
    setSettings((current) => {
      if (!current) return current;
      const route = current.notifications[key] || { roleRecipients: [], userRecipientIds: [] };
      const hasRole = route.roleRecipients.includes(role);
      return {
        ...current,
        notifications: {
          ...current.notifications,
          [key]: {
            ...route,
            roleRecipients: hasRole
              ? route.roleRecipients.filter((item) => item !== role)
              : [...route.roleRecipients, role],
          },
        },
      };
    });
  };

  if (isLoading || !settings || !data) {
    return (
      <PageContainer className="page-spacing">
        <div className="flex min-h-[360px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="page-spacing overflow-x-hidden">
      <SEO title="Operations Control" description="Manage operational delegation, approvals, and notification routing." robots="noindex" />
      <PageHeader
        title="Operations Control"
        description="Set workflow owners, queue rules, approval guardrails, and internal notification routing."
        actions={
          <Button onClick={() => saveMutation.mutate(settings)} disabled={saveMutation.isPending} className="w-full sm:w-auto">
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save controls
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {data.workflowDefinitions.map((definition) => {
          const queue = data.queueSummary[definition.key];
          const workflow = settings.workflows[definition.key];
          const owner = usersById.get(workflow.ownerUserId || "");
          return (
            <Card key={definition.key}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">{definition.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{queue?.label || "queue"}</p>
                  </div>
                  <Badge className={priorityBadge(workflow.priority)}>
                    {workflow.priority}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">{queue?.openCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Open</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-300">{queue?.urgentCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Urgent</p>
                  </div>
                </div>
                <p className="mt-4 break-words text-xs text-muted-foreground">
                  Owner: <span className="font-medium text-foreground">{displayName(owner)}</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Assignment Queues
          </CardTitle>
          <CardDescription>
            Choose who owns each workflow, who is currently assigned, and when it escalates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.workflowDefinitions.map((definition) => {
            const workflow = settings.workflows[definition.key];
            const allowedUsers = data.users.filter((user) => definition.ownerRoles.includes(user.role) && user.isActive !== false);
            return (
              <section key={definition.key} className="rounded-md border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold">{definition.label}</h2>
                    <p className="break-words text-sm text-muted-foreground">{definition.description}</p>
                  </div>
                  <Badge variant="outline">{settings.workflows[definition.key]?.internalStatus || "active"}</Badge>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-5">
                  <div className="space-y-2 lg:col-span-1">
                    <Label htmlFor={`${definition.key}-owner`}>Owner</Label>
                    <Select
                      value={workflow.ownerUserId || NONE_VALUE}
                      onValueChange={(value) => updateWorkflow(definition.key, { ownerUserId: value === NONE_VALUE ? null : value })}
                    >
                      <SelectTrigger id={`${definition.key}-owner`}>
                        <SelectValue placeholder="Choose owner…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                        {allowedUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {displayName(user)} ({roleLabel(user.role)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 lg:col-span-1">
                    <Label htmlFor={`${definition.key}-assignee`}>Assigned to</Label>
                    <Select
                      value={workflow.assignedToUserId || NONE_VALUE}
                      onValueChange={(value) => updateWorkflow(definition.key, { assignedToUserId: value === NONE_VALUE ? null : value })}
                    >
                      <SelectTrigger id={`${definition.key}-assignee`}>
                        <SelectValue placeholder="Choose assignee…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                        {allowedUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {displayName(user)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${definition.key}-priority`}>Priority</Label>
                    <Select
                      value={workflow.priority}
                      onValueChange={(value: Priority) => updateWorkflow(definition.key, { priority: value })}
                    >
                      <SelectTrigger id={`${definition.key}-priority`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${definition.key}-status`}>Internal status</Label>
                    <Select
                      value={workflow.internalStatus}
                      onValueChange={(value: InternalStatus) => updateWorkflow(definition.key, { internalStatus: value })}
                    >
                      <SelectTrigger id={`${definition.key}-status`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="watching">Watching</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${definition.key}-escalation`}>Escalate after hours</Label>
                    <Input
                      id={`${definition.key}-escalation`}
                      type="number"
                      min={1}
                      max={720}
                      value={workflow.escalationHours}
                      onChange={(event) => updateWorkflow(definition.key, { escalationHours: Number(event.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor={`${definition.key}-notes`}>Internal notes</Label>
                  <Textarea
                    id={`${definition.key}-notes`}
                    value={workflow.notes || ""}
                    onChange={(event) => updateWorkflow(definition.key, { notes: event.target.value })}
                    placeholder="Delegation notes, escalation instructions, or review criteria…"
                  />
                </div>
              </section>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Approval Controls
            </CardTitle>
            <CardDescription>
              Guardrails for sensitive operational actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.approvalDefinitions.map((definition) => (
              <div key={definition.key} className="flex items-start justify-between gap-4 rounded-md border p-4">
                <div className="min-w-0">
                  <Label htmlFor={`approval-${definition.key}`} className="break-words font-medium">
                    {definition.label}
                  </Label>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{definition.description}</p>
                </div>
                <Switch
                  id={`approval-${definition.key}`}
                  checked={settings.approvals[definition.key] !== false}
                  onCheckedChange={(checked) => updateApproval(definition.key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Routing
            </CardTitle>
            <CardDescription>
              Decide which internal roles receive each alert type.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.notificationDefinitions.map((definition) => {
              const route = settings.notifications[definition.key] || { roleRecipients: [], userRecipientIds: [] };
              return (
                <div key={definition.key} className="rounded-md border p-4">
                  <div className="flex items-start gap-2">
                    {route.roleRecipients.length === 0 ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    )}
                    <div className="min-w-0">
                      <h2 className="break-words text-sm font-medium">{definition.label}</h2>
                      <p className="text-xs text-muted-foreground">
                        {route.roleRecipients.length === 0 ? "Fallback routing will be used if no role is selected." : "Selected roles receive these alerts."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <label key={role} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={route.roleRecipients.includes(role)}
                          onChange={() => toggleNotificationRole(definition.key, role)}
                        />
                        <span>{roleLabel(role)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            What This Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <div className="flex gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="break-words">
              Visitor booking messages route to the selected admin under Visitor messages. Coordinators are intentionally excluded from that workflow.
            </p>
          </div>
          <div className="flex gap-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="break-words">
              Internal email routing now respects these role selections for transport, incident, booking, and guide-report alerts.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
