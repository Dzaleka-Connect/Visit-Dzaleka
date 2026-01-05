import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  Calendar as CalendarIcon,
  List,
  GripVertical,
  Eye,
  EyeOff,
  Kanban,
  LayoutList,
  BarChartHorizontal,
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
  setHours,
  getDay,
} from "date-fns";
import { SEO } from "@/components/seo";
import { BookingListView } from "@/components/booking-list-view";
import { BookingBoardView } from "@/components/booking-board-view";
import { BookingTimelineView } from "@/components/booking-timeline-view";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface BookingWithGuide extends Booking {
  guide?: Guide;
}

// Time slots for week view (8 AM to 7 PM)
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => i + 8); // 8, 9, 10, ... 19

// Days of week for guide availability mapping
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Guide colors for availability overlay
const GUIDE_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-300", text: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-green-100 dark:bg-green-900/30", border: "border-green-300", text: "text-green-700 dark:text-green-300" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-300", text: "text-purple-700 dark:text-purple-300" },
  { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-300", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-300", text: "text-pink-700 dark:text-pink-300" },
  { bg: "bg-teal-100 dark:bg-teal-900/30", border: "border-teal-300", text: "text-teal-700 dark:text-teal-300" },
];

export default function CalendarPage() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithGuide | null>(null); // For non-calendar views
  const [guideFilter, setGuideFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"month" | "week" | "list" | "board" | "timeline">("month");
  const [showAvailability, setShowAvailability] = useState(false);
  const [draggedBooking, setDraggedBooking] = useState<BookingWithGuide | null>(null);

  const { data: bookings } = useQuery<BookingWithGuide[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: guides } = useQuery<Guide[]>({
    queryKey: ["/api/guides"],
  });

  // Reschedule mutation for drag-and-drop
  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, visitDate, visitTime }: { id: string; visitDate: string; visitTime?: string }) => {
      return apiRequest("PATCH", `/api/bookings/${id}/reschedule`, { visitDate, visitTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking rescheduled",
        description: "The booking has been moved to the new date.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to reschedule",
        description: "Could not move the booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Status update mutation for Board view
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Status updated",
        description: "Booking status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update status",
        description: "Could not update booking status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Month view calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week view calculations
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

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

  const getBookingsForTimeSlot = (date: Date, hour: number) => {
    return getBookingsForDay(date).filter((booking) => {
      if (!booking.visitTime) return false;
      const bookingHour = parseInt(booking.visitTime.split(":")[0], 10);
      return bookingHour === hour;
    });
  };

  const selectedDateBookings = selectedDate ? getBookingsForDay(selectedDate) : [];

  // Navigation
  const goToPrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Guide availability check
  const isGuideAvailable = (guide: Guide, date: Date): boolean => {
    if (!guide.availableDays) return false;
    const dayName = DAY_NAMES[getDay(date)];
    return guide.availableDays.includes(dayName);
  };

  const getAvailableGuides = (date: Date): Guide[] => {
    if (!guides) return [];
    return guides.filter((g) => g.isActive && isGuideAvailable(g, date));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, booking: BookingWithGuide) => {
    setDraggedBooking(booking);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", booking.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date, targetTime?: string) => {
    e.preventDefault();
    if (!draggedBooking) return;

    const newDate = format(targetDate, "yyyy-MM-dd");
    rescheduleMutation.mutate({
      id: draggedBooking.id,
      visitDate: newDate,
      visitTime: targetTime,
    });
    setDraggedBooking(null);
  };

  const handleDragEnd = () => {
    setDraggedBooking(null);
  };

  const isWideView = viewMode === "list" || viewMode === "board" || viewMode === "timeline";

  return (
    <div className="space-y-6">
      <SEO
        title="Schedule & Bookings"
        description="View and manage tour schedules for Dzaleka Refugee Camp. Drag bookings to reschedule."
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">
          View and manage tour schedules. Drag bookings to reschedule.
        </p>
      </div>

      <div className={`grid gap-6 ${isWideView ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
        <Card className={isWideView ? "" : "lg:col-span-2"}>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg font-semibold">
                {viewMode === "month" || isWideView
                  ? format(currentDate, "MMMM yyyy")
                  : `Week of ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`}
              </CardTitle>
              {!isWideView && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={goToPrev} data-testid="button-prev">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNext} data-testid="button-next">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-lg overflow-hidden bg-background">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  <LayoutList className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">List</span>
                </Button>
                <Button
                  variant={viewMode === "board" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("board")}
                  title="Board View"
                >
                  <Kanban className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Board</span>
                </Button>
                <Button
                  variant={viewMode === "timeline" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("timeline")}
                  title="Timeline View"
                >
                  <BarChartHorizontal className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Timeline</span>
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("month")}
                  title="Month View"
                >
                  <CalendarIcon className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Month</span>
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none px-3"
                  onClick={() => setViewMode("week")}
                  title="Week View"
                >
                  <List className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Week</span>
                </Button>
              </div>

              {/* Guide Availability Toggle */}
              {(!isWideView) && (
                <Button
                  variant={showAvailability ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAvailability(!showAvailability)}
                >
                  {showAvailability ? <Eye className="h-4 w-4 sm:mr-1" /> : <EyeOff className="h-4 w-4 sm:mr-1" />}
                  <span className="hidden sm:inline">Availability</span>
                </Button>
              )}

              <Select value={guideFilter} onValueChange={setGuideFilter}>
                <SelectTrigger className="w-32 sm:w-40" data-testid="select-guide-filter">
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

              {!isWideView && (
                <Button variant="outline" onClick={goToToday} data-testid="button-today">
                  Today
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className={isWideView ? "p-0 sm:p-4" : ""}>
            {/* List View */}
            {viewMode === "list" && (
              <BookingListView
                bookings={filteredBookings}
                onSelectBooking={setSelectedBooking}
                selectedBookingId={selectedBooking?.id}
                onConfirm={(id) => statusMutation.mutate({ id, status: "confirmed" })}
                onCancel={(id) => statusMutation.mutate({ id, status: "cancelled" })}
              />
            )}

            {/* Board View */}
            {viewMode === "board" && (
              <BookingBoardView
                bookings={filteredBookings}
                onSelectBooking={setSelectedBooking}
                selectedBookingId={selectedBooking?.id}
                onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
              />
            )}

            {/* Timeline View */}
            {viewMode === "timeline" && (
              <BookingTimelineView
                bookings={filteredBookings}
                guides={guides || []}
                onSelectBooking={setSelectedBooking}
                selectedBookingId={selectedBooking?.id}
                onReschedule={(id, date) => rescheduleMutation.mutate({ id, visitDate: date })}
              />
            )}

            {/* Month View */}
            {viewMode === "month" && (
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
                  const availableGuides = showAvailability ? getAvailableGuides(day) : [];

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day)}
                      className={`relative min-h-[80px] sm:min-h-[100px] bg-background p-1 sm:p-2 text-left transition-colors cursor-pointer hover:bg-muted/50 ${!isCurrentMonth ? "bg-muted/50 text-muted-foreground" : ""
                        } ${isSelected ? "ring-2 ring-primary ring-inset" : ""} ${draggedBooking ? "hover:bg-primary/10" : ""
                        }`}
                      data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${isTodayDate ? "bg-primary text-primary-foreground font-semibold" : ""
                            }`}
                        >
                          {format(day, "d")}
                        </span>
                        {showAvailability && availableGuides.length > 0 && (
                          <div className="flex -space-x-1">
                            {availableGuides.slice(0, 3).map((g, i) => (
                              <div
                                key={g.id}
                                className={`h-4 w-4 rounded-full ${GUIDE_COLORS[i % GUIDE_COLORS.length].bg} ${GUIDE_COLORS[i % GUIDE_COLORS.length].border} border`}
                                title={`${g.firstName} ${g.lastName}`}
                              />
                            ))}
                            {availableGuides.length > 3 && (
                              <span className="text-[10px] text-muted-foreground ml-1">
                                +{availableGuides.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {dayBookings.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayBookings.slice(0, 4).map((booking) => {
                            const statusColor = STATUS_COLORS[booking.status || "pending"] || STATUS_COLORS.pending;
                            return (
                              <div
                                key={booking.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, booking)}
                                onDragEnd={handleDragEnd}
                                className={`flex flex-col gap-0.5 rounded px-1 sm:px-1.5 py-1 text-[10px] sm:text-xs cursor-grab active:cursor-grabbing border ${statusColor.bg} ${statusColor.text} border-transparent`}
                              >
                                <div className="flex items-center gap-1">
                                  <GripVertical className="inline h-3 w-3 mr-0.5 opacity-50 shrink-0" />
                                  <span className="truncate font-medium">
                                    {formatTime(booking.visitTime)} {booking.visitorName.split(" ")[0]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 ml-4 opacity-80 text-[9px] truncate">
                                  <span className="capitalize">{booking.status}</span>
                                  {booking.guide && (
                                    <>• {booking.guide.firstName}</>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {dayBookings.length > 4 && (
                            <div className="px-1.5 text-xs text-muted-foreground">
                              +{dayBookings.length - 4} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Week View */}
            {viewMode === "week" && (
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px rounded-lg border bg-border overflow-hidden">
                    {/* Header Row */}
                    <div className="bg-muted px-2 py-3 text-center text-xs font-medium text-muted-foreground">
                      Time
                    </div>
                    {weekDays.map((day) => {
                      const isTodayDate = isToday(day);
                      const availableGuides = showAvailability ? getAvailableGuides(day) : [];
                      return (
                        <div
                          key={day.toISOString()}
                          className={`bg-muted px-2 py-2 text-center ${isTodayDate ? "bg-primary/10" : ""}`}
                        >
                          <div className="text-xs font-medium text-muted-foreground">
                            {format(day, "EEE")}
                          </div>
                          <div className={`text-lg font-semibold ${isTodayDate ? "text-primary" : ""}`}>
                            {format(day, "d")}
                          </div>
                          {showAvailability && availableGuides.length > 0 && (
                            <div className="flex justify-center gap-0.5 mt-1">
                              {availableGuides.slice(0, 3).map((g, i) => (
                                <div
                                  key={g.id}
                                  className={`h-2 w-2 rounded-full ${GUIDE_COLORS[i % GUIDE_COLORS.length].bg}`}
                                  title={`${g.firstName} ${g.lastName}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Time Slot Rows */}
                    {TIME_SLOTS.map((hour) => (
                      <>
                        <div
                          key={`time-${hour}`}
                          className="bg-background px-2 py-4 text-xs text-muted-foreground text-right border-t"
                        >
                          {hour}:00
                        </div>
                        {weekDays.map((day) => {
                          const slotBookings = getBookingsForTimeSlot(day, hour);
                          const timeStr = `${hour.toString().padStart(2, "0")}:00`;
                          return (
                            <div
                              key={`${day.toISOString()}-${hour}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, day, timeStr)}
                              className={`bg-background p-1 min-h-[48px] border-t transition-colors ${draggedBooking ? "hover:bg-primary/10" : ""
                                }`}
                            >
                              {slotBookings.map((booking) => {
                                const statusColor = STATUS_COLORS[booking.status || "pending"] || STATUS_COLORS.pending;
                                return (
                                  <div
                                    key={booking.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, booking)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => {
                                      setSelectedDate(day);
                                    }}
                                    className={`rounded px-2 py-1 text-xs cursor-grab active:cursor-grabbing mb-1 ${statusColor.bg} ${statusColor.text}`}
                                  >
                                    <div className="font-medium truncate">
                                      <GripVertical className="inline h-3 w-3 mr-0.5 opacity-50" />
                                      {booking.visitorName}
                                    </div>
                                    <div className="text-[10px] opacity-75">
                                      {booking.numberOfPeople} people
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Legend - Only show for calendar views */}
            {!isWideView && (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">Status:</span>
                  {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                    <div key={status} className="flex items-center gap-1">
                      <div className={`h-3 w-3 rounded ${colors.bg}`} />
                      <span className="capitalize">{status}</span>
                    </div>
                  ))}
                </div>
                {showAvailability && guides && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">Guides:</span>
                    {guides
                      .filter((g) => g.isActive)
                      .slice(0, 4)
                      .map((guide, i) => (
                        <div key={guide.id} className="flex items-center gap-1">
                          <div className={`h-3 w-3 rounded-full ${GUIDE_COLORS[i % GUIDE_COLORS.length].bg}`} />
                          <span>{guide.firstName}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day Detail Panel - Only for Month/Week Views */}
        {!isWideView && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a Date"}
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
                      className="rounded-lg border p-4 hover-elevate transition-shadow"
                      data-testid={`booking-detail-${booking.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium">{booking.visitorName}</h4>
                          <p className="text-sm text-muted-foreground">{booking.visitorEmail}</p>
                        </div>
                        <StatusBadge status={booking.status || "pending"} />
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(booking.visitTime)} -{" "}
                            <span className="capitalize">{booking.tourType} tour</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {booking.numberOfPeople} {booking.numberOfPeople === 1 ? "person" : "people"}
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
                          <Badge variant="outline" className="text-xs text-yellow-600">
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
        )}
      </div>

      {/* Booking Details Sheet - For List/Board/Timeline Views */}
      <Sheet open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto w-full">
          {selectedBooking && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <StatusBadge status={selectedBooking.status || "pending"} />
                  <span className="text-sm text-muted-foreground font-mono">
                    #{selectedBooking.bookingReference || selectedBooking.id.slice(0, 8)}
                  </span>
                </div>
                <SheetTitle className="text-xl mt-2">{selectedBooking.visitorName}</SheetTitle>
                <SheetDescription>{selectedBooking.visitorEmail}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(selectedBooking.visitDate), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      at {formatTime(selectedBooking.visitTime)}
                    </p>
                  </div>
                </div>

                {/* Tour Type */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tour Details</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedBooking.tourType} Tour
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Users className="h-3 w-3" />
                      {selectedBooking.numberOfPeople} people
                    </div>
                  </div>
                </div>

                {/* Assigned Guide */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Assigned Guide</p>
                    {selectedBooking.guide ? (
                      <div className="text-sm text-muted-foreground">
                        {selectedBooking.guide.firstName} {selectedBooking.guide.lastName}
                        <br />
                        <span className="text-xs">{selectedBooking.guide.phone}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        No guide assigned yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-4 rounded-lg bg-muted/50 border text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{selectedBooking.visitorPhone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium capitalize">{selectedBooking.paymentStatus || "Pending"}</span>
                  </div>
                  <div className="pt-2 border-t mt-2 flex justify-between font-medium">
                    <span>Total Amount</span>
                    <span className="text-primary">{selectedBooking.totalAmount ? `$${selectedBooking.totalAmount}` : "Free"}</span>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Special Requests</p>
                    <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded">
                      "{selectedBooking.specialRequests}"
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-4">
                  <Button className="w-full" asChild>
                    <a href={`/bookings/${selectedBooking.id}`}>
                      View Full Details
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
