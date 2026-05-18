import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const BRISBANE_TIME_ZONE = "Australia/Brisbane";
const MALAWI_TIME_ZONE = "Africa/Blantyre";

function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function zoneDifferenceHours(date: Date) {
  const brisbaneTime = new Date(date.toLocaleString("en-US", { timeZone: BRISBANE_TIME_ZONE })).getTime();
  const malawiTime = new Date(date.toLocaleString("en-US", { timeZone: MALAWI_TIME_ZONE })).getTime();

  return Math.round((malawiTime - brisbaneTime) / (60 * 60 * 1000));
}

function formatDifference(hours: number) {
  if (hours === 0) return "same time";
  return hours < 0 ? `Malawi ${Math.abs(hours)}h behind` : `Malawi ${hours}h ahead`;
}

export function TimezoneClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const times = useMemo(() => ({
    brisbane: formatTime(now, BRISBANE_TIME_ZONE),
    malawi: formatTime(now, MALAWI_TIME_ZONE),
    difference: formatDifference(zoneDifferenceHours(now)),
  }), [now]);

  return (
    <div
      className="hidden min-w-0 items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm xl:flex"
      aria-label={`Brisbane ${times.brisbane}, Malawi ${times.malawi}, ${times.difference}`}
      title={`Brisbane ${times.brisbane}. Malawi ${times.malawi}. ${times.difference}.`}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="whitespace-nowrap font-medium text-foreground">AUS {times.brisbane}</span>
      <span aria-hidden="true">/</span>
      <span className="whitespace-nowrap">MWI {times.malawi}</span>
      <span className="hidden whitespace-nowrap text-[11px] 2xl:inline">({times.difference})</span>
    </div>
  );
}
