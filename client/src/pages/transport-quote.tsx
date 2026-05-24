import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/seo";
import { formatCurrency, formatDate, formatTime } from "@/lib/constants";

interface PublicTransportQuote {
  id: string;
  visitorEmailHint?: string | null;
  partnerName: string;
  route: string;
  pickupLocation?: string | null;
  visitDate?: string | null;
  visitTime?: string | null;
  quotedAmount?: number | null;
  currency?: string | null;
  estimatedPickupTime?: string | null;
  partnerNotes?: string | null;
  status?: string | null;
  quoteDecision?: string | null;
  quoteExpiresAt?: string | null;
}

function humanize(value?: string | null) {
  return (value || "pending").replace(/_/g, " ");
}

export default function TransportQuote() {
  const [, params] = useRoute("/transport-quote/:token");
  const token = params?.token || "";
  const [notes, setNotes] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const { data: quote, isLoading, refetch } = useQuery<PublicTransportQuote>({
    queryKey: [`/api/public/transport-quotes/${token}`],
    enabled: !!token,
  });

  const decisionMutation = useMutation({
    mutationFn: async (decision: "approved" | "declined") => {
      const response = await fetch(`/api/public/transport-quotes/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          decision,
          confirmationEmail: confirmationEmail.trim(),
          notes: notes.trim() || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Could not save your response");
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  return (
    <main className="min-h-dvh bg-background px-4 py-8">
      <SEO
        title="Review Transport Quote | Visit Dzaleka"
        description="Approve or decline your Visit Dzaleka transport quote."
        robots="noindex, nofollow"
      />
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Review Transport Quote</CardTitle>
            <CardDescription>
              Confirm whether the quoted transport details work for your visit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading quote…
              </div>
            ) : !quote ? (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                This transport quote could not be found or the link has expired.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h1 className="text-xl font-semibold">Transport quote from {quote.partnerName}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review the quote for your Visit Dzaleka transport request.
                  </p>
                </div>

                {quote.quoteDecision ? (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="font-medium">Your response has been recorded: {humanize(quote.quoteDecision)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Visit Dzaleka will use this decision to finalize transport arrangements.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Request</p>
                        <p className="font-medium">Transport quote</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Quote</p>
                        <p className="font-medium tabular-nums">
                          {quote.quotedAmount ? formatCurrency(quote.quotedAmount, quote.currency || "MWK") : "To be confirmed"}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Visit</p>
                        <p className="font-medium">
                          {quote.visitDate ? formatDate(quote.visitDate) : "Date pending"}
                          {quote.visitTime ? ` at ${formatTime(quote.visitTime)}` : ""}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">Pickup</p>
                        <p className="font-medium">{quote.estimatedPickupTime ? formatTime(quote.estimatedPickupTime) : "To be confirmed"}</p>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 text-sm">
                      <p><span className="text-muted-foreground">Route:</span> {humanize(quote.route)}</p>
                      <p><span className="text-muted-foreground">Pickup location:</span> {quote.pickupLocation || "To be confirmed"}</p>
                      <p><span className="text-muted-foreground">Driver and vehicle:</span> Shared after confirmation</p>
                      {quote.partnerNotes && <p className="mt-2"><span className="text-muted-foreground">Notes:</span> {quote.partnerNotes}</p>}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="transport-confirmation-email">Confirm booking email</Label>
                        <Input
                          id="transport-confirmation-email"
                          name="confirmationEmail"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder={quote.visitorEmailHint ? `${quote.visitorEmailHint}…` : "name@example.com…"}
                          value={confirmationEmail}
                          onChange={(event) => setConfirmationEmail(event.target.value)}
                          spellCheck={false}
                        />
                      </div>
                      <Textarea
                        placeholder="Optional note for the transport partner…"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                      {decisionMutation.error && (
                        <p className="text-sm text-destructive">{decisionMutation.error.message}</p>
                      )}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          className="flex-1"
                          disabled={decisionMutation.isPending}
                          onClick={() => decisionMutation.mutate("approved")}
                        >
                          {decisionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve quote
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          disabled={decisionMutation.isPending}
                          onClick={() => decisionMutation.mutate("declined")}
                        >
                          <XCircle className="h-4 w-4" />
                          Decline quote
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
