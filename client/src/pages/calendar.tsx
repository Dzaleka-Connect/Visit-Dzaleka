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
  eachHourOfInterval,
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
  const [guideFilter, setGuideFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [showAvailability, setShowAvailability] = useState(false);
  const [draggedBooking, setDraggedBooking] = useState<BookingWithGuide | null>(null);

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithGuide[]>({
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
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
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
    const availableDays = guide.availableDays as string[];
    return availableDays.includes(dayName);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View and manage tour schedules. Drag bookings to reschedule.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg font-semibold">
                {viewMode === "month"
                  ? format(currentDate, "MMMM yyyy")
                  : `Week of ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={goToPrev} data-testid="button-prev">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext} data-testid="button-next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode("month")}
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Month
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setViewMode("week")}
                >
                  <List className="h-4 w-4 mr-1" />
                  Week
                </Button>
              </div>

              {/* Guide Availability Toggle */}
              <Button
                variant={showAvailability ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAvailability(!showAvailability)}
              >
                {showAvailability ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                Availability
              </Button>

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
                          {dayBookings.slice(0, 2).map((booking) => (
                            <div
                              key={booking.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, booking)}
                              onDragEnd={handleDragEnd}
                              className={`truncate rounded px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs cursor-grab active:cursor-grabbing ${STATUS_COLORS[booking.status || "pending"].bg
                                } ${STATUS_COLORS[booking.status || "pending"].text}`}
                            >
                              <GripVertical className="inline h-3 w-3 mr-0.5 opacity-50" />
                              {formatTime(booking.visitTime)} - {booking.visitorName.split(" ")[0]}
                            </div>
                          ))}
                          {dayBookings.length > 2 && (
                            <div className="px-1.5 text-xs text-muted-foreground">
                              +{dayBookings.length - 2} more
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
                              {slotBookings.map((booking) => (
                                <div
                                  key={booking.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, booking)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => {
                                    setSelectedDate(day);
                                  }}
                                  className={`rounded px-2 py-1 text-xs cursor-grab active:cursor-grabbing mb-1 ${STATUS_COLORS[booking.status || "pending"].bg
                                    } ${STATUS_COLORS[booking.status || "pending"].text}`}
                                >
                                  <div className="font-medium truncate">
                                    <GripVertical className="inline h-3 w-3 mr-0.5 opacity-50" />
                                    {booking.visitorName}
                                  </div>
                                  <div className="text-[10px] opacity-75">
                                    {booking.numberOfPeople} people
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
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
          </CardContent>
        </Card>

        {/* Day Detail Panel */}
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
                    className="rounded-lg border p-4 hover-elevate"
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
      </div>
    </div>
  );
}
