import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Mail, Search, CheckCircle, XCircle, Plus, Send, RotateCw } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EmailLog } from "@shared/schema";

export default function SendEmail() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientName: "",
    recipientEmail: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();

  const { data: emailLogs, isLoading } = useQuery<EmailLog[]>({
    queryKey: ["/api/email-logs"],
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

  const handleSendEmail = () => {
    if (!emailForm.recipientEmail || !emailForm.subject || !emailForm.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(emailForm);
  };

  const filteredLogs = emailLogs?.filter(
    (log) =>
      log.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Send Email</h1>
          <p className="text-muted-foreground">Compose and send emails.</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Send Email</h1>
        <p className="text-muted-foreground">
          Compose emails and view sent history.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4 flex-wrap">
          <CardTitle className="text-lg font-semibold">Sent Emails</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-emails"
              />
            </div>
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-send-email">
                  <Plus className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Compose Email</DialogTitle>
                  <DialogDescription>
                    Send an email to a visitor or contact.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="recipientName">Recipient Name</Label>
                    <Input
                      id="recipientName"
                      placeholder="John Doe"
                      value={emailForm.recipientName}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, recipientName: e.target.value })
                      }
                      data-testid="input-recipient-name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recipientEmail">
                      Recipient Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={emailForm.recipientEmail}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, recipientEmail: e.target.value })
                      }
                      data-testid="input-recipient-email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subject">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Email subject"
                      value={emailForm.subject}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, subject: e.target.value })
                      }
                      data-testid="input-email-subject"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">
                      Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      value={emailForm.message}
                      onChange={(e) =>
                        setEmailForm({ ...emailForm, message: e.target.value })
                      }
                      className="min-h-[120px]"
                      data-testid="input-email-message"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
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
                    data-testid="button-submit-email"
                  >
                    {sendEmailMutation.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredLogs || filteredLogs.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No emails sent yet"
              description="Emails sent from the system will appear here."
              className="py-8"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`email-row-${log.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          {log.recipientName && (
                            <div className="font-medium">{log.recipientName}</div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {log.recipientEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {log.subject}
                      </TableCell>
                      <TableCell>
                        {log.status === "sent" ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.createdAt
                          ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEmail(log)}
                              data-testid={`button-view-email-${log.id}`}
                            >
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Email Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid gap-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                  To
                                </div>
                                <div>
                                  {log.recipientName && (
                                    <span className="font-medium">{log.recipientName} </span>
                                  )}
                                  <span className="text-muted-foreground">
                                    &lt;{log.recipientEmail}&gt;
                                  </span>
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                  Subject
                                </div>
                                <div className="font-medium">{log.subject}</div>
                              </div>
                              <div className="grid gap-2">
                                <div className="text-sm font-medium text-muted-foreground">
                                  Message
                                </div>
                                <div className="rounded-md border bg-muted/50 p-4 whitespace-pre-wrap text-sm">
                                  {log.message}
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                  Sent{" "}
                                  {log.createdAt
                                    ? formatDistanceToNow(new Date(log.createdAt), {
                                      addSuffix: true,
                                    })
                                    : "Unknown"}
                                </span>
                                {log.status === "sent" ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200"
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Delivered
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-700 border-red-200"
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Failed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {log.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryEmailMutation.mutate(log.id)}
                            disabled={retryEmailMutation.isPending}
                            className="text-blue-600 hover:text-blue-700"
                            data-testid={`button-retry-email-${log.id}`}
                          >
                            <RotateCw className={`h-4 w-4 ${retryEmailMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
