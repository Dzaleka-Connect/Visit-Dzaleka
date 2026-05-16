import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Mail,
  Search,
  CheckCircle,
  XCircle,
  Send,
  RotateCw,
  Inbox,
  Archive,
  Trash2,
  ChevronLeft,
  Clock,
  PenSquare
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EmailLog } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SEO } from "@/components/seo";

export default function EmailHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [bookingReferenceFilter, setBookingReferenceFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientName: "",
    recipientEmail: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();

  const emailLogsQuery = (() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (templateFilter !== "all") params.set("templateType", templateFilter);
    if (archiveFilter !== "active") params.set("archived", archiveFilter);
    if (searchTerm.trim()) params.set("recipient", searchTerm.trim());
    if (bookingReferenceFilter.trim()) params.set("bookingReference", bookingReferenceFilter.trim());
    if (dateFromFilter) params.set("dateFrom", dateFromFilter);
    if (dateToFilter) params.set("dateTo", dateToFilter);
    const query = params.toString();
    return query ? `/api/email-logs?${query}` : "/api/email-logs";
  })();

  const { data: emailLogs, isLoading } = useQuery<EmailLog[]>({
    queryKey: [emailLogsQuery],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof emailForm) => {
      return apiRequest("POST", "/api/send-email", data);
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
      setComposeOpen(false);
      setEmailForm({ recipientName: "", recipientEmail: "", subject: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
    },
    onError: () => {
      toast({
        title: "Failed to send email",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const retryEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/email-logs/${id}/retry`);
    },
    onSuccess: () => {
      toast({
        title: "Email resent",
        description: "The email has been resent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
    },
    onError: () => {
      toast({
        title: "Failed to resend email",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const archiveEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/email-logs/${id}/archive`);
    },
    onSuccess: () => {
      toast({
        title: "Email archived",
        description: "The email has been archived.",
      });
      setSelectedEmail(null);
      queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
    },
    onError: () => {
      toast({
        title: "Failed to archive email",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/email-logs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Email deleted",
        description: "The email has been deleted.",
      });
      setSelectedEmail(null);
      queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
    },
    onError: () => {
      toast({
        title: "Failed to delete email",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendEmail = () => {
    const trimmedForm = {
      recipientName: emailForm.recipientName.trim(),
      recipientEmail: emailForm.recipientEmail.trim(),
      subject: emailForm.subject.trim(),
      message: emailForm.message.trim(),
    };

    if (!trimmedForm.recipientEmail || !trimmedForm.subject || !trimmedForm.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(trimmedForm);
  };

  const filteredLogs = emailLogs || [];
  const templateTypes = Array.from(new Set(filteredLogs.map((log) => log.templateType).filter(Boolean)));

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || "?";
  };

  const stats = {
    total: filteredLogs.length,
    sent: filteredLogs.filter(e => ["sent", "accepted", "delivered"].includes(e.status || "")).length,
    failed: filteredLogs.filter(e => ["failed", "bounced", "complaint"].includes(e.status || "")).length,
  };

  const getStatusBadge = (status?: string | null) => {
    const normalized = status || "sent";
    const isFailure = ["failed", "bounced", "complaint"].includes(normalized);
    const label = normalized === "accepted"
      ? "Accepted"
      : normalized === "delivered"
        ? "Delivered"
        : normalized === "bounced"
          ? "Bounced"
          : normalized === "complaint"
            ? "Complaint"
            : normalized === "failed"
              ? "Failed"
              : "Sent";

    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-1.5 py-0 h-5",
          isFailure
            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
            : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        )}
      >
        {isFailure ? <XCircle className="mr-1 h-2.5 w-2.5" /> : <CheckCircle className="mr-1 h-2.5 w-2.5" />}
        {label}
      </Badge>
    );
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-4">
      <SEO title="Email History" description="Compose and review outgoing Visit Dzaleka emails." />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Email History</h1>
          <p className="text-sm text-muted-foreground">Compose and review outgoing Visit Dzaleka emails.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)} className="w-full gap-2 sm:w-auto" data-testid="button-send-email">
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      <div className="flex min-h-[640px] gap-0 overflow-hidden rounded-lg border bg-background lg:h-[calc(100vh-12rem)]">
        {/* Left Sidebar - Email List */}
        <div className={cn(
          "flex flex-col border-r transition-all",
          selectedEmail ? "hidden md:flex w-[380px]" : "w-full md:flex-1"
        )}>
          {/* Search and Stats */}
          <div className="p-4 border-b space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Filter by recipient"
                  placeholder="Recipient name or email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/50"
                  data-testid="input-search-emails"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={archiveFilter} onValueChange={setArchiveFilter}>
                <SelectTrigger aria-label="Filter archived emails">
                  <SelectValue placeholder="Archive" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="all">All emails</SelectItem>
                </SelectContent>
              </Select>
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger aria-label="Filter by template type">
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All templates</SelectItem>
                  {templateTypes.map((type) => (
                    <SelectItem key={type} value={type || "custom"}>
                      {(type || "custom").replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label="Filter by booking reference"
                placeholder="Booking reference…"
                value={bookingReferenceFilter}
                onChange={(e) => setBookingReferenceFilter(e.target.value)}
                className="bg-muted/50"
              />
              <Input
                aria-label="Filter from date"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="bg-muted/50"
              />
              <Input
                aria-label="Filter to date"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="flex flex-wrap gap-3 text-xs sm:gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
                <span className="text-muted-foreground">{stats.total} Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                <span className="text-muted-foreground">{stats.sent} Sent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                <span className="text-muted-foreground">{stats.failed} Failed</span>
              </div>
            </div>
          </div>

          {/* Email List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : !filteredLogs || filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">No outgoing emails yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Compose a message to start a visitor or staff email thread.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredLogs.map((log) => (
                  <button
                    type="button"
                    key={log.id}
                    onClick={() => setSelectedEmail(log)}
                    className={cn(
                      "flex w-full items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selectedEmail?.id === log.id && "bg-muted"
                    )}
                    data-testid={`email-row-${log.id}`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={cn(
                        "text-xs font-semibold",
                        log.status === "sent" || log.status === "accepted" || log.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {getInitials(log.recipientName, log.recipientEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {log.recipientName || log.recipientEmail}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {log.createdAt
                            ? format(new Date(log.createdAt), "MMM d")
                            : ""}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{log.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(log.status)}
                        <span className="text-xs text-muted-foreground truncate">
                          {log.message
                            ? `${log.message.substring(0, 50)}${log.message.length > 50 ? "…" : ""}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Email Detail */}
        {selectedEmail && (
          <div className="flex-1 flex flex-col w-full md:w-auto">
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSelectedEmail(null)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center gap-2 ml-auto">
                {["failed", "bounced", "complaint"].includes(selectedEmail.status || "") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryEmailMutation.mutate(selectedEmail.id)}
                    disabled={retryEmailMutation.isPending}
                    className="gap-2"
                    data-testid={`button-retry-email-${selectedEmail.id}`}
                  >
                    <RotateCw className={cn("h-4 w-4", retryEmailMutation.isPending && "animate-spin")} />
                    Retry
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveEmailMutation.mutate(selectedEmail.id)}
                  disabled={archiveEmailMutation.isPending}
                  title="Archive email"
                  aria-label="Archive email"
                >
                  <Archive className={cn("h-4 w-4", archiveEmailMutation.isPending && "animate-pulse")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (window.confirm("Delete this email log? This cannot be undone.")) {
                      deleteEmailMutation.mutate(selectedEmail.id);
                    }
                  }}
                  disabled={deleteEmailMutation.isPending}
                  title="Delete email"
                  aria-label="Delete email"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className={cn("h-4 w-4", deleteEmailMutation.isPending && "animate-pulse")} />
                </Button>
              </div>
            </div>

            {/* Email Content */}
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6 max-w-3xl">
                {/* Subject */}
                <h2 className="text-xl font-semibold mb-4">{selectedEmail.subject}</h2>

                {/* Sender/Recipient Info */}
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(selectedEmail.recipientName, selectedEmail.recipientEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        To: {selectedEmail.recipientName || selectedEmail.recipientEmail}
                      </span>
                      {getStatusBadge(selectedEmail.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedEmail.recipientEmail}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {selectedEmail.createdAt
                        ? format(new Date(selectedEmail.createdAt), "PPpp")
                        : "Unknown"}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Message Body */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedEmail.message}
                  </div>
                </div>

                {/* Template Type if available */}
                {selectedEmail.templateType && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      Template: <Badge variant="secondary" className="text-xs">{selectedEmail.templateType}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Empty State for Detail Panel */}
        {!selectedEmail && filteredLogs && filteredLogs.length > 0 && (
          <div className="hidden md:flex flex-1 items-center justify-center text-center p-8">
            <div>
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">Select an email</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Choose an email from the list to view its contents.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="h-5 w-5" />
              New Email
            </DialogTitle>
            <DialogDescription>
              Compose a visitor or staff message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 border-b pb-3">
                <Label className="w-16 text-muted-foreground text-sm">To</Label>
                <div className="flex-1 flex gap-2">
                  <Input
                    name="recipientName"
                    autoComplete="name"
                    placeholder="Recipient name…"
                    value={emailForm.recipientName}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, recipientName: e.target.value })
                    }
                    className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
                    data-testid="input-recipient-name"
                  />
                  <Input
                    type="email"
                    name="recipientEmail"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={emailForm.recipientEmail}
                    onChange={(e) =>
                      setEmailForm({ ...emailForm, recipientEmail: e.target.value })
                    }
                    className="flex-[2] border-0 shadow-none focus-visible:ring-0 px-0"
                    data-testid="input-recipient-email"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 border-b pb-3">
                <Label className="w-16 text-muted-foreground text-sm">Subject</Label>
                <Input
                  name="subject"
                  placeholder="Subject…"
                  value={emailForm.subject}
                  onChange={(e) =>
                    setEmailForm({ ...emailForm, subject: e.target.value })
                  }
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
                  data-testid="input-email-subject"
                />
              </div>
            </div>
            <Textarea
              name="message"
              placeholder="Write your message…"
              value={emailForm.message}
              onChange={(e) =>
                setEmailForm({ ...emailForm, message: e.target.value })
              }
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  handleSendEmail();
                }
              }}
              className="min-h-[200px] border-0 shadow-none focus-visible:ring-0 resize-none"
              data-testid="input-email-message"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setComposeOpen(false)}
              data-testid="button-cancel-email"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sendEmailMutation.isPending}
              className="gap-2"
              data-testid="button-submit-email"
            >
              {sendEmailMutation.isPending ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
