import { SEO } from "@/components/seo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Webhook, Activity, AlertCircle, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WebhookEndpointRecord {
  id: string;
  description: string;
  url: string;
  events: string[];
  secret?: string | null;
  status?: string | null;
}

interface WebhookDeliveryRecord {
  id: string;
  endpointId: string;
  event: string;
  status: string;
  timestamp?: string | Date | null;
}

export default function Webhooks() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpointRecord | null>(null);

  const { data: endpoints = [] } = useQuery<WebhookEndpointRecord[]>({
    queryKey: ["/api/webhooks"],
  });

  const { data: recentDeliveries = [] } = useQuery<WebhookDeliveryRecord[]>({
    queryKey: ["/api/webhooks/deliveries"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      description: FormDataEntryValue | null;
      url: FormDataEntryValue | null;
      events: string[];
      secret: FormDataEntryValue | null;
      status: FormDataEntryValue | null;
      approvalConfirmed?: boolean;
    }) => {
      const res = await apiRequest(
        editingEndpoint ? "PATCH" : "POST",
        `/api/webhooks${editingEndpoint ? `/${editingEndpoint.id}` : ""}`,
        data,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Success", description: "Webhook endpoint saved." });
      setIsDialogOpen(false);
      setEditingEndpoint(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/webhooks/${id}`, { approvalConfirmed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Deleted", description: "Webhook endpoint removed." });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/webhooks/deliveries/${id}/retry`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Webhook retried", description: "A new delivery attempt has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Retry failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      description: formData.get("description"),
      url: formData.get("url"),
      events: (formData.get("events") as string).split(",").map(s => s.trim()).filter(Boolean),
      secret: formData.get("secret"),
      status: formData.get("status") || "active",
      approvalConfirmed: true,
    };
    const approved = window.confirm("Confirm webhook approval: this will create or update an outgoing integration endpoint.");
    if (!approved) {
      return;
    }
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SEO title="Webhooks" robots="noindex" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Manage outgoing webhooks to integrate with external systems
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingEndpoint(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Endpoint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEndpoint ? "Edit Endpoint" : "Add Endpoint"}</DialogTitle>
              <DialogDescription>
                Configure a webhook to receive real-time updates.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" required defaultValue={editingEndpoint?.description} placeholder="Zapier Sync…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Payload URL</Label>
                <Input id="url" name="url" type="url" required defaultValue={editingEndpoint?.url} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="events">Events (comma separated)</Label>
                <Input id="events" name="events" required defaultValue={editingEndpoint?.events?.join(", ")} placeholder="booking.created, incident.reported…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="secret">Secret Token (Optional)</Label>
                  <Input id="secret" name="secret" type="password" defaultValue={editingEndpoint?.secret || ""} placeholder="For signature verification…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingEndpoint?.status || "active"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="failing">Failing</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Endpoint"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{endpoints.filter((e: any) => e.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently receiving events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentDeliveries.length > 0 
                ? ((recentDeliveries.filter((d: any) => d.status === "success").length / recentDeliveries.length) * 100).toFixed(1) + "%" 
                : "100%"}
            </div>
            <p className="text-xs text-muted-foreground">Successful deliveries (24h)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {recentDeliveries.filter((d: any) => d.status === "failed").length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="mb-8 bg-card border rounded-lg px-4">
        <AccordionItem value="docs">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
            Documentation & Payloads
          </AccordionTrigger>
          <AccordionContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground mb-1">Supported Events</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><code className="bg-muted px-1 py-0.5 rounded text-xs text-foreground">booking.created</code> - Fired when a new tour or guide booking is made.</li>
                <li><code className="bg-muted px-1 py-0.5 rounded text-xs text-foreground">booking.updated</code> - Fired when a booking status changes (e.g., approved, completed, cancelled).</li>
                <li><code className="bg-muted px-1 py-0.5 rounded text-xs text-foreground">incident.reported</code> - Fired when a new security incident is logged.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-1">Payload Structure</h3>
              <p className="mb-2">All webhooks send a standardized JSON payload via POST request:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs text-foreground">
{`{
  "event": "booking.created",
  "timestamp": "2026-05-16T15:00:00Z",
  "data": {
    "id": "123",
    "status": "pending",
    "createdAt": "2026-05-16T15:00:00Z",
    ...
  }
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-1">Security & Signature Verification</h3>
              <p>
                If you provide a Secret Token, the system will include an <code>X-Dzaleka-Signature</code> header in the request. 
                This signature is an HMAC SHA-256 hash of the JSON payload string, using your secret token as the key. 
                Compute the hash on your server to verify the request originated from Dzaleka.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Webhook Endpoints</CardTitle>
            <CardDescription>Configure URLs to receive event payloads</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell className="font-medium max-w-[180px] break-words">{ep.description}</TableCell>
                    <TableCell className="text-xs font-mono max-w-[240px] break-all">{ep.url}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {ep.events.map((ev: string) => (
                          <Badge key={ev} variant="outline" className="text-[10px]">
                            {ev}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ep.status === "active" ? "default" : "destructive"}>
                        {ep.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingEndpoint(ep);
                        setIsDialogOpen(true);
                      }}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                        if (window.confirm("Confirm webhook approval: delete this endpoint?")) {
                          deleteMutation.mutate(ep.id);
                        }
                      }}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
            <CardDescription>Log of recently fired webhooks</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-xs">{delivery.event}</TableCell>
                    <TableCell className="text-sm">
                      {endpoints.find(e => e.id === delivery.endpointId)?.description || "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {delivery.timestamp ? new Date(delivery.timestamp).toLocaleString() : "Not recorded"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={delivery.status === "success" ? "default" : "destructive"} className={delivery.status === "success" ? "bg-green-500 hover:bg-green-600" : ""}>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Retry"
                        aria-label={`Retry ${delivery.event} webhook delivery`}
                        disabled={retryMutation.isPending}
                        onClick={() => retryMutation.mutate(delivery.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
