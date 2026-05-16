import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle,
  MapPin,
  Users,
  Shield,
  FileText
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import type { Incident } from "@shared/schema";

const severityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-400" },
  medium: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-400" },
  high: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-400" },
  critical: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-400" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  reported: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-400" },
  investigating: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-400" },
  resolved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-400" },
  closed: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-800 dark:text-gray-400" },
};

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [actionsTaken, setActionsTaken] = useState("");
  const [status, setStatus] = useState<string>("");

  const { data: incident, isLoading } = useQuery<Incident>({
    queryKey: [`/api/incidents/${id}`],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Incident>) => {
      const res = await apiRequest("PATCH", `/api/incidents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Incident updated",
        description: "The incident details have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/incidents/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update incident",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Incident Not Found</h2>
        <p className="text-muted-foreground">The incident you are looking for does not exist or you don't have permission to view it.</p>
        <Button asChild variant="outline">
          <Link href="/security">Return to Security Dashboard</Link>
        </Button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateMutation.mutate({ status: newStatus as any });
  };

  const handleSaveActions = () => {
    updateMutation.mutate({ actionsTaken });
  };

  const sColor = severityColors[incident.severity || "medium"];
  const stColor = statusColors[incident.status || "reported"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SEO title={`Incident: ${incident.title}`} robots="noindex" />

      {/* Header Area */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-3 text-muted-foreground">
          <Link href="/security">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Security
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{incident.title}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              Reported on {incident.createdAt ? format(new Date(incident.createdAt), "PPP 'at' p") : "Unknown"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${sColor.bg} ${sColor.text} capitalize border-none`}>
              Severity: {incident.severity}
            </Badge>
            <Badge className={`${stColor.bg} ${stColor.text} capitalize border-none`}>
              Status: {incident.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Incident Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{incident.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                Resolution & Actions Taken
              </CardTitle>
              <CardDescription>
                Document the steps taken to investigate and resolve this incident.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe the actions taken..."
                defaultValue={incident.actionsTaken || ""}
                onChange={(e) => setActionsTaken(e.target.value)}
                className="min-h-[150px]"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveActions} 
                  disabled={!actionsTaken || updateMutation.isPending || actionsTaken === incident.actionsTaken}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Actions Log"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Metadata & Workflow */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <Select 
                    value={status || incident.status || "reported"} 
                    onValueChange={handleStatusChange}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reported">Reported</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {incident.resolvedAt && (
                  <div className="pt-4 border-t border-border flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    Resolved {format(new Date(incident.resolvedAt), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{incident.location || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Involved Parties</p>
                  <p className="text-sm text-muted-foreground">{incident.involvedParties || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">Reported By</p>
                  <p className="text-sm text-muted-foreground">{incident.reportedBy}</p>
                </div>
              </div>

              {incident.bookingId && (
                <div className="flex items-start gap-3 pt-4 border-t border-border">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Related Booking</p>
                    <Button variant="link" asChild className="p-0 h-auto text-sm">
                      <Link href={`/bookings/${incident.bookingId}`}>
                        View Booking #{incident.bookingId.slice(0, 8)}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
