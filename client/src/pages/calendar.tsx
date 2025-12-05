import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatTime, STATUS_COLORS } from "@/lib/constants";
import type { Booking, Guide } from "@shared/schema";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns";

interface BookingWithGuide extends Booking {
  guide?: Guide;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [guideFilter, setGuideFilter] = useState<string>("all");

  const { data: bookings, isLoading: bookingsLoading } = useQuery<
    BookingWithGuide[]
  >({
    queryKey: ["/api/bookings"],
  });

  const { data: guides } = useQuery<Guide[]>({
    queryKey: ["/api/guides"],
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((booking) => {
      if (guideFilter === "all") return true;
      if (guideFilter === "unassigned") return !booking.assignedGuideId;
      return booking.assignedGuideId === guideFilter;
    });
  }, [bookings, guideFilter]);

  const getBookingsForDay = (date: Date) => {
    return filteredBookings.filter((booking) => {
      const bookingDate = parseISO(booking.visitDate);
      return isSameDay(bookingDate, date);
    });
  };

  const selectedDateBookings = selectedDate
    ? getBookingsForDay(selectedDate)
    : [];

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View and manage tour schedules and guide assignments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg font-semibold">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevMonth}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={guideFilter} onValueChange={setGuideFilter}>
                <SelectTrigger className="w-40" data-testid="select-guide-filter">
                  <SelectValue placeholder="All Guides" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Guides</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {guides?.filter((g) => g.isActive).map((guide) => (
                    <SelectItem key={guide.id} value={guide.id}>
                      {guide.firstName} {guide.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={goToToday} data-testid="button-today">
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px rounded-lg border bg-border overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="bg-muted px-2 py-3 text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const dayBookings = getBookingsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative min-h-[100px] bg-background p-2 text-left transition-colors hover-elevate ${
                      !isCurrentMonth ? "bg-muted/50 text-muted-foreground" : ""
                    } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
                    data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isTodayDate
                          ? "bg-primary text-primary-foreground font-semibold"
                          : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayBookings.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className={`truncate rounded px-1.5 py-0.5 text-xs ${
                              STATUS_COLORS[booking.status || "pending"].bg
                            } ${STATUS_COLORS[booking.status || "pending"].text}`}
                          >
                            {formatTime(booking.visitTime)} -{" "}
                            {booking.visitorName.split(" ")[0]}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="px-1.5 text-xs text-muted-foreground">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">Status:</span>
                {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                  <div key={status} className="flex items-center gap-1">
                    <div
                      className={`h-3 w-3 rounded ${colors.bg}`}
                    />
                    <span className="capitalize">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d")
                : "Select a Date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Click on a date to view scheduled tours.
              </p>
            ) : selectedDateBookings.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No tours scheduled"
                description="There are no tours scheduled for this date."
                className="py-8"
              />
            ) : (
              <div className="space-y-4">
                {selectedDateBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-lg border p-4 hover-elevate"
                    data-testid={`booking-detail-${booking.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium">{booking.visitorName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {booking.visitorEmail}
                        </p>
                      </div>
                      <StatusBadge status={booking.status || "pending"} />
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(booking.visitTime)} -{" "}
                          <span className="capitalize">
                            {booking.tourType} tour
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {booking.numberOfPeople}{" "}
                          {booking.numberOfPeople === 1 ? "person" : "people"}
                        </span>
                      </div>
                      {booking.guide && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {booking.guide.firstName} {booking.guide.lastName}
                          </Badge>
                        </div>
                      )}
                      {!booking.guide && (
                        <Badge
                          variant="outline"
                          className="text-xs text-yellow-600"
                        >
                          Guide not assigned
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
