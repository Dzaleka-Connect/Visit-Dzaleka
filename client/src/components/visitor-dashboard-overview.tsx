import { Link } from "wouter";
import { ArrowRight, BookOpen, CalendarDays, Car, CheckCircle2, Clock, Compass, MapPin, Phone, ScanLine, Ticket, UserCheck, Users, Wallet, type LucideIcon } from "lucide-react";
import type { Booking } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { QRCodeDisplay } from "@/components/qr-scanner-dialog";
import { formatDate, formatTime, formatCurrency } from "@/lib/constants";
import { visitorPaymentLabel } from "@/lib/visitor-dashboard";

interface Props {
  booking?: Booking;
  meetingPoint?: string | null;
  meetingPointAddress?: string | null;
  guideName?: string | null;
  guidePhone?: string | null;
  transportLabel?: string | null;
  transportDetail?: string;
  hasItinerary: boolean;
  onReportPayment: () => void;
  actions: { id: string; title: string; description: string; href: string; icon: LucideIcon }[];
}

function Detail({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return <div className="flex min-w-0 items-start gap-3">
    <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <div className="flex min-w-0 flex-col gap-1"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{children}</dd></div>
  </div>;
}

export function VisitorDashboardSkeleton() {
  return <div className="flex flex-col gap-6" role="status" aria-label="Loading your dashboard">
    <span className="sr-only">Loading your dashboard…</span>
    <Skeleton className="h-10 w-64 max-w-full" /><Skeleton className="h-5 w-96 max-w-full" />
    <Skeleton className="h-12 w-full" />
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <Skeleton className="h-96 w-full rounded-xl" /><Skeleton className="h-96 w-full rounded-xl" />
    </div>
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>;
}

export function VisitorDashboardOverview({ booking, meetingPoint, meetingPointAddress, guideName, guidePhone, transportLabel, transportDetail, hasItinerary, onReportPayment, actions }: Props) {
  const confirmed = booking?.status === "confirmed" || booking?.status === "in_progress";
  return <div className="flex flex-col gap-6">
    {booking ? <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle><h2>{booking.status === "in_progress" ? "Your visit is underway" : "Your next visit"}</h2></CardTitle>
            <Badge variant={confirmed ? "secondary" : "outline"}>{booking.status === "in_progress" ? "In progress" : confirmed ? "Confirmed" : "Awaiting confirmation"}</Badge>
          </div>
          <CardDescription>Your date, guide, and arrival details in one place.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 rounded-xl bg-primary/5 p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Dzaleka Refugee Camp</p>
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{formatDate(booking.visitDate)}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-2"><Clock className="size-4 text-primary" aria-hidden="true" />{formatTime(booking.visitTime)} · Malawi time</span>
              <span className="inline-flex items-center gap-2"><Users className="size-4 text-primary" aria-hidden="true" />{booking.numberOfPeople || 1} {(booking.numberOfPeople || 1) === 1 ? "visitor" : "visitors"}</span>
            </div>
          </div>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail icon={MapPin} label="Meeting point">{meetingPoint || "To be confirmed"}{meetingPointAddress && <span className="mt-1 block text-xs font-normal text-muted-foreground">{meetingPointAddress}</span>}</Detail>
            <Detail icon={UserCheck} label="Your guide">{guideName || "We’ll introduce your guide here"}{guidePhone && <a className="mt-1 flex min-h-11 items-center gap-2 text-primary underline underline-offset-4" href={`tel:${guidePhone}`}><Phone className="size-4" aria-hidden="true" />Call your guide</a>}</Detail>
            <Detail icon={Wallet} label="Payment">{visitorPaymentLabel(booking)}<span className="mt-1 block text-xs font-normal text-muted-foreground">{formatCurrency(booking.totalAmount || 0)}</span></Detail>
            <Detail icon={Car} label="Transport">{transportLabel || "Not requested"}<span className="mt-1 block text-xs font-normal text-muted-foreground">{transportDetail || "See booking details for travel arrangements."}</span></Detail>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="min-h-11"><Link href={`/my-bookings/${booking.id}`}>View booking<ArrowRight data-icon="inline-end" aria-hidden="true" /></Link></Button>
            {booking.paymentStatus !== "paid" && booking.paymentStatus !== "refunded" && !!booking.totalAmount && <Button variant="outline" onClick={onReportPayment} className="min-h-11">Report payment…</Button>}
            {hasItinerary && <Button variant="outline" asChild className="min-h-11"><Link href={`/my-bookings/${booking.id}/itinerary`}>Open itinerary</Link></Button>}
          </div>
        </CardContent>
      </Card>
      <Card id="arrival-pass" className="scroll-mt-24">
        <CardHeader>
          <CardTitle><h2>Arrival pass</h2></CardTitle>
          <CardDescription>{confirmed ? "Keep this ready to show the team when you arrive." : "Your pass will be ready once your visit is confirmed."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5 text-center">
          {confirmed && booking.bookingReference ? <div role="img" aria-label={`Arrival QR code for booking ${booking.bookingReference}`} className="max-w-full [&_p]:break-all"><QRCodeDisplay value={booking.bookingReference} size={144} /></div> : <div className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl bg-muted p-5"><Ticket className="size-10 text-muted-foreground" aria-hidden="true" /><p className="break-all text-sm font-medium">{booking.bookingReference || "Booking requested"}</p><p className="text-xs text-muted-foreground">We’ll update your booking after confirmation.</p></div>}
          <p className="text-sm text-muted-foreground">{booking.visitorName}<br /><span className="capitalize">{booking.tourType?.replace(/_/g, " ") || "Guided"} tour</span></p>
          <Button variant="outline" asChild className="min-h-11 w-full"><Link href={`/my-bookings/${booking.id}`}><ScanLine data-icon="inline-start" aria-hidden="true" />Open full pass</Link></Button>
        </CardContent>
      </Card>
    </div> : <Card>
      <CardHeader><CardTitle><h2>Plan your next visit</h2></CardTitle><CardDescription>A guided visit is a chance to meet the people, creativity, and everyday life of the community.</CardDescription></CardHeader>
      <CardContent><EmptyState icon={Compass} title="Discover Dzaleka with a local guide" description="Choose a date and tell us what interests you. Our team will help plan your visit." action={<Button asChild className="min-h-11"><Link href="/my-bookings?book=true">Plan a visit<ArrowRight data-icon="inline-end" aria-hidden="true" /></Link></Button>} /></CardContent>
    </Card>}
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle><h2>Your next steps</h2></CardTitle><CardDescription>A short list to keep your visit on track.</CardDescription></CardHeader>
        <CardContent>
          {actions.length ? <ul className="divide-y">{actions.map(action => <li key={action.id}><Link href={action.href} className="flex min-h-16 items-center gap-3 rounded-md py-3 pr-2 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
            <action.icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{action.title}</span><span className="mt-1 block break-words text-xs leading-relaxed text-muted-foreground">{action.description}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link></li>)}</ul> : <div className="flex items-start gap-3 py-4"><CheckCircle2 className="size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-sm font-medium">You’re all caught up</p><p className="mt-1 text-sm text-muted-foreground">Anything that needs your attention will appear here.</p></div></div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle><h2>Before you arrive</h2></CardTitle><CardDescription>A little preparation for a thoughtful visit.</CardDescription></CardHeader>
        <CardContent><ul className="divide-y">{[
          {href:"/resources",icon:BookOpen,title:"Your visitor guide",description:"What to bring and how to prepare"},
          {href:"/plan-your-trip",icon:MapPin,title:"Getting to Dzaleka",description:"Travel, directions, and local information"},
          {href:"/things-to-do",icon:Compass,title:"Meet the community",description:"Arts, culture, and places to explore"},
        ].map(item => <li key={item.href}><Link href={item.href} className="flex min-h-16 items-center gap-3 rounded-md py-3 pr-2 transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><item.icon className="size-5 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.description}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Link></li>)}</ul></CardContent>
      </Card>
    </div>
  </div>;
}
