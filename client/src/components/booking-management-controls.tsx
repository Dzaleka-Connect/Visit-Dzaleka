import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calendar, Loader2, Pencil, RotateCcw } from "lucide-react";
import type { Booking } from "@shared/schema";
import { bookingCorrectionSchema, bookingDetailsEditSchema, bookingRescheduleSchema } from "@shared/booking-management";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Mode = "details" | "correction" | "reschedule";
const fields = [
  ["visitorName", "Full name", "text"], ["visitorEmail", "Email", "email"],
  ["visitorPhone", "Phone", "tel"], ["visitorCountry", "Country / region", "text"],
  ["visitorOrganization", "Organization", "text"],
] as const;
const titles = { details: "Edit visitor details", correction: "Correct booking status", reschedule: "Reschedule booking" };

export function BookingManagementControls({ booking, onSaved }: { booking: Booking; onSaved: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useUnsavedChanges(Boolean(mode && dirty));
  const open = (next: Mode) => {
    setDraft({
      visitorName: booking.visitorName, visitorEmail: booking.visitorEmail, visitorPhone: booking.visitorPhone || "",
      visitorCountry: booking.visitorCountry || "", visitorOrganization: booking.visitorOrganization || "",
      specialRequests: booking.specialRequests || "", accessibilityNeeds: booking.accessibilityNeeds || "",
      status: booking.status === "confirmed" ? "pending" : "confirmed", reason: "",
      visitDate: String(booking.visitDate).slice(0, 10), visitTime: booking.visitTime.slice(0, 5),
    });
    setSnapshot(booking.updatedAt instanceof Date ? booking.updatedAt.toISOString() : booking.updatedAt || null);
    setErrors({}); setDirty(false); setMode(next);
  };
  const mutation = useMutation({
    mutationFn: async ({ action, data }: { action: Mode; data: unknown }) => apiRequest("PATCH", `/api/bookings/${booking.id}/${action}`, data),
    onSuccess: () => {
      setDirty(false); setMode(null); onSaved();
      toast({ title: "Booking updated", description: "Your changes have been saved." });
    },
    onError: (error: Error) => { setErrors({ submit: error.message }); onSaved(); },
  });
  const change = (key: string, value: string) => { setDraft(previous => ({ ...previous, [key]: value })); setDirty(true); };
  const close = () => {
    if (mutation.isPending) return;
    if (!dirty || window.confirm("Discard your unsaved booking changes?")) { setMode(null); setDirty(false); }
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mode || mutation.isPending) return;
    const data = mode === "details"
      ? Object.fromEntries([...fields.map(([key]) => [key, draft[key]]), ["specialRequests", draft.specialRequests], ["accessibilityNeeds", draft.accessibilityNeeds], ["expectedUpdatedAt", snapshot]])
      : mode === "correction" ? { status: draft.status, reason: draft.reason, expectedUpdatedAt: snapshot }
      : { visitDate: draft.visitDate, visitTime: draft.visitTime };
    const result = (mode === "details" ? bookingDetailsEditSchema : mode === "correction" ? bookingCorrectionSchema : bookingRescheduleSchema).safeParse(data);
    if (!result.success) {
      const next: Record<string, string> = {};
      result.error.issues.forEach(issue => { next[String(issue.path[0])] ??= issue.message; });
      setErrors(next);
      event.currentTarget.querySelector<HTMLElement>(`[name="${result.error.issues[0].path[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    mutation.mutate({ action: mode, data });
  };
  const errorFor = (key: string) => errors[key] && <p id={`edit-${key}-error`} className="text-sm text-destructive" aria-live="polite">{errors[key]}</p>;
  const props = (key: string) => ({ id: `edit-${key}`, name: key, value: draft[key] || "", "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `edit-${key}-error` : undefined, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => change(key, event.target.value) });

  if (user?.role !== "admin" && user?.role !== "coordinator") return null;
  return <>
    <Button variant="outline" onClick={() => open("details")}><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />Edit visitor…</Button>
    {["pending", "confirmed", "in_progress"].includes(booking.status || "") && <Button variant="outline" onClick={() => open("reschedule")}><Calendar className="mr-2 h-4 w-4" aria-hidden="true" />Reschedule…</Button>}
    {user.role === "admin" && <Button variant="outline" onClick={() => open("correction")}><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />Correct status…</Button>}
    <Dialog open={Boolean(mode)} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto overscroll-contain sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode ? titles[mode] : "Manage booking"}</DialogTitle>
          <DialogDescription>{mode === "correction" ? "Reopen a booking marked complete, cancelled, or no-show by mistake. Previous emails stay in the history; you can email the visitor an update after saving." : mode === "details" ? "Update contact details and visitor needs. Changing the email also updates which visitor account can access this booking." : "Update the visit date and time. The visitor will receive the existing reschedule notification; confirm guide and transport availability separately."}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submit} className="space-y-4" onKeyDown={event => { if (event.target instanceof HTMLTextAreaElement && event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); event.currentTarget.requestSubmit(); } }}>
          {mode === "details" && <>
            <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key, label, type]) => <div key={key} className="space-y-2"><Label htmlFor={`edit-${key}`}>{label}</Label><Input {...props(key)} type={type} autoComplete="off" spellCheck={type === "email" ? false : undefined} />{errorFor(key)}</div>)}</div>
            {([['specialRequests', 'Special requests'], ['accessibilityNeeds', 'Accessibility needs']] as const).map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`edit-${key}`}>{label}</Label><Textarea {...props(key)} />{errorFor(key)}</div>)}
          </>}
          {mode === "correction" && <>
            <p className="text-sm">Current status: <strong className="capitalize">{booking.status?.replaceAll("_", " ")}</strong></p>
            <div className="space-y-2"><Label htmlFor="edit-status">Correct status</Label><select {...props("status")} className="h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground"><option value="pending" disabled={booking.status === "pending"}>Pending — needs confirmation</option><option value="confirmed" disabled={booking.status === "confirmed"}>Confirmed — visit has not started</option><option value="in_progress" disabled={booking.status === "in_progress"}>In progress — visit is still happening</option></select>{errorFor("status")}</div>
            <p className="text-sm text-muted-foreground">Check-out and cancellation fields will be cleared. Pending or confirmed also clears check-in. Payment records stay as recorded.</p>
            <div className="space-y-2"><Label htmlFor="edit-reason">Reason for correction</Label><Textarea {...props("reason")} placeholder="For example, the tour was marked complete before the visit…" />{errorFor("reason")}</div>
          </>}
          {mode === "reschedule" && <div className="grid gap-4 sm:grid-cols-2">{([['visitDate', 'Visit date', 'date'], ['visitTime', 'Visit time (Malawi)', 'time']] as const).map(([key, label, type]) => <div key={key} className="space-y-2"><Label htmlFor={`edit-${key}`}>{label}</Label><Input {...props(key)} type={type} />{errorFor(key)}</div>)}</div>}
          {errorFor("submit")}
          <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={close}>Cancel</Button><Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Save changes</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
