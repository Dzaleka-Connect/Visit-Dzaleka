import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  UserCog,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import type { Guide, GuideProfileChangeRequest } from "@shared/schema";

interface AdminGuideProfileChangeRequest extends GuideProfileChangeRequest {
  guide?: Pick<Guide, "id" | "firstName" | "lastName" | "email" | "phone" | "profileImageUrl"> | null;
  submittedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  reviewedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

function formatProfileValue(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "None";
  if (value === null || value === undefined || value === "") return "None";
  return String(value);
}

export default function GuideProfileReviews() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: requests = [], isLoading, isError } = useQuery<AdminGuideProfileChangeRequest[]>({
    queryKey: ["/api/admin/guide-profile-change-requests"],
  });

  const reviewProfileChangeMutation = useMutation({
    mutationFn: async ({
      id,
      decision,
      notes,
    }: {
      id: string;
      decision: "approved" | "rejected";
      notes?: string;
    }) => {
      const response = await apiRequest("POST", `/api/admin/guide-profile-change-requests/${id}/decision`, {
        decision,
        notes,
      });
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guide-profile-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      toast({
        title: variables.decision === "approved" ? "Guide profile approved" : "Guide profile rejected",
        description: variables.decision === "approved"
          ? "The approved changes are now published."
          : "The guide will see the review note on their profile page.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Review failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getChangedFields = (current: any, proposed: any) => {
    if (!proposed) return [];
    const currentData = current || {};
    const proposedFields = Object.keys(proposed);
    return proposedFields.filter(
      (key) => JSON.stringify(currentData[key]) !== JSON.stringify(proposed[key])
    );
  };

  const filteredRequests = requests.filter((request) => {
    // 1. Filter by Tab
    if (activeTab === "pending" && request.status !== "pending") return false;
    if (activeTab === "approved" && request.status !== "approved") return false;
    if (activeTab === "rejected" && request.status !== "rejected") return false;

    // 2. Filter by Search Term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const guideName = request.guide
      ? `${request.guide.firstName} ${request.guide.lastName}`
      : "";
    const email = request.guide?.email || "";

    return (
      guideName.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term)
    );
  });

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "Not set";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  };

  return (
    <PageContainer>
      <SEO title="Guide Profile Reviews | Visit Dzaleka Admin" />
      
      <PageHeader
        title="Guide Profile Reviews"
        description="Moderate proposed updates to guide profiles, languages, specialties, and bio details before they are visible to visitors."
      />

      <div className="space-y-6">
        {/* Search & Tabs Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search guide name or email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Requests Content */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
            <CardContent className="flex items-center gap-3 p-6 text-red-900 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <p>Failed to load profile requests. Please try again later.</p>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <UserCog className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No requests found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                No guide profile change requests match your active tab or search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRequests.map((request) => {
              const currentData = (request.currentData as any) || {};
              const proposedData = (request.proposedData as any) || {};
              const changedFields = getChangedFields(currentData, proposedData);

              return (
                <Card
                  key={request.id}
                  className="flex flex-col justify-between border shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">
                          {request.guide ? `${request.guide.firstName} ${request.guide.lastName}` : "Unknown Guide"}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground">
                          Email: {request.guide?.email || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Submitted: {formatDate(request.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {request.status === "pending" ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            Pending Review
                          </Badge>
                        ) : request.status === "approved" ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            Rejected
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs font-normal">
                          {changedFields.length} field{changedFields.length === 1 ? "" : "s"} updated
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-4">
                    <div className="space-y-2 border-t pt-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Proposed Changes
                      </h4>
                      {changedFields.slice(0, 3).map((field) => (
                        <div key={field} className="rounded-md bg-muted/50 p-2.5 text-xs">
                          <p className="font-semibold capitalize text-foreground/80">
                            {field.replace(/([A-Z])/g, " $1")}
                          </p>
                          <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center">
                            <span className="text-muted-foreground truncate max-w-[150px]">
                              {formatProfileValue(currentData[field])}
                            </span>
                            <ArrowRight className="hidden h-3 w-3 text-muted-foreground sm:inline shrink-0" />
                            <span className="font-medium text-foreground break-all">
                              {formatProfileValue(proposedData[field])}
                            </span>
                          </div>
                        </div>
                      ))}
                      {changedFields.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-1">
                          +{changedFields.length - 3} more fields modified
                        </p>
                      )}
                    </div>

                    {request.reviewNotes && (
                      <div className="rounded-md border p-2.5 bg-muted/40 text-xs">
                        <span className="font-semibold block text-muted-foreground uppercase tracking-wider mb-1">
                          Review Notes
                        </span>
                        <p className="text-foreground italic break-words">{request.reviewNotes}</p>
                      </div>
                    )}

                    {request.reviewedBy && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        Reviewed by {request.reviewedBy.firstName || request.reviewedBy.email} on {formatDate(request.reviewedAt)}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Button size="sm" variant="outline" className="h-9 flex-1" asChild>
                        <Link href={`/admin/guide-profile-reviews/${request.id}`}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Details
                        </Link>
                      </Button>
                      
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="h-9 flex-1"
                            onClick={() => reviewProfileChangeMutation.mutate({ id: request.id, decision: "approved" })}
                            disabled={reviewProfileChangeMutation.isPending}
                          >
                            {reviewProfileChangeMutation.isPending ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                            onClick={() => {
                              const notes = window.prompt("Add a short reason for rejecting these profile changes:");
                              if (notes === null) return;
                              reviewProfileChangeMutation.mutate({ id: request.id, decision: "rejected", notes });
                            }}
                            disabled={reviewProfileChangeMutation.isPending}
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
