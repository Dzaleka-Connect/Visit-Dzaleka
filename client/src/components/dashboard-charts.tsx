import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Loader2 } from "lucide-react";

interface WeeklyData {
  date: string;
  bookings: number;
  revenue: number;
}

interface ZoneData {
  name: string;
  visits: number;
}

interface GuidePerformance {
  name: string;
  tours: number;
  rating: number;
}

const weeklyChartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function WeeklyBookingTrends() {
  const { data, isLoading } = useQuery<WeeklyData[]>({
    queryKey: ["/api/stats/weekly"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Booking Trends</CardTitle>
          <CardDescription>Bookings over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekly Booking Trends</CardTitle>
        <CardDescription>Bookings over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full min-w-0">
          <ChartContainer config={weeklyChartConfig} className="h-full w-full aspect-auto">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-bookings)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-bookings)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                width={30}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area
                dataKey="bookings"
                type="natural"
                fill="url(#fillBookings)"
                stroke="var(--color-bookings)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const zoneChartConfig = {
  visits: {
    label: "Visits",
  },
} satisfies ChartConfig;

export function PopularZonesChart() {
  const { data, isLoading } = useQuery<ZoneData[]>({
    queryKey: ["/api/stats/zones"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular Zones</CardTitle>
          <CardDescription>Most visited areas</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Assign colors dynamically for the pie chart config
  const chartData = (data || []).slice(0, 5).map((item, index) => ({
    ...item,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  const dynamicConfig = {
    visits: { label: "Visits" },
    ...Object.fromEntries(chartData.map((item) => [
      item.name,
      { label: item.name, color: item.fill }
    ]))
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Popular Zones</CardTitle>
        <CardDescription>Most visited areas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full min-w-0">
          <ChartContainer config={dynamicConfig} className="h-full w-full aspect-auto">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="visits"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
                paddingAngle={2}
              >
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const guidePerformanceConfig = {
  tours: {
    label: "Tours",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function GuidePerformanceChart() {
  const { data, isLoading } = useQuery<GuidePerformance[]>({
    queryKey: ["/api/stats/guide-performance"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guide Performance</CardTitle>
          <CardDescription>Tours completed this month</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Truncate long guide names for display and limit to top 5
  const chartData = (data || [])
    .slice(0, 5)
    .map(item => ({
      ...item,
      displayName: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Guide Performance</CardTitle>
        <CardDescription>Tours completed this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full min-w-0">
          <ChartContainer config={guidePerformanceConfig} className="h-full w-full aspect-auto">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="displayName"
                tickLine={false}
                axisLine={false}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="tours" fill="var(--color-tours)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
}

const heatmapConfig = {
  value: {
    label: "Bookings",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

// Heatmap still requires some manual work as ScatterChart isn't fully standardized in the same way for color mapping by value
// But we can still wrap it in ChartContainer for tooltips
export function BookingTimeHeatmap() {
  const { data, isLoading } = useQuery<HeatmapData[]>({
    queryKey: ["/api/stats/heatmap"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular Visit Times</CardTitle>
          <CardDescription>Heatmap of booking frequency</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const chartData = (data || []).map(d => ({
    ...d,
    dayIndex: days.indexOf(d.day),
    dayLabel: d.day
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Popular Visit Times</CardTitle>
        <CardDescription>Darker green indicates higher booking volume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full min-w-0">
          {/* Heatmap implementation is custom, so we just use ChartContainer for consistent tooltip styling context */}
          <ChartContainer config={heatmapConfig} className="h-full w-full aspect-auto">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                type="number"
                name="Hour"
                domain={[0, 23]}
                tickCount={12}
                tickFormatter={(hour) => `${hour}:00`}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="dayIndex"
                type="number"
                name="Day"
                domain={[0, 6]}
                tickCount={7}
                tickFormatter={(index) => days[index]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <ZAxis dataKey="value" range={[50, 400]} name="Bookings" />
              <ChartTooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <div className="grid gap-1.5">
                          <span className="font-medium">{data.dayLabel} at {data.hour}:00</span>
                          <div className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground items-center">
                            <div className="shrink-0 rounded-[2px] bg-[--color-value] h-2.5 w-2.5" />
                            <span className="text-muted-foreground">Bookings</span>
                            <span className="font-mono font-medium tabular-nums text-foreground ml-auto">{data.value}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null;
                }}
              />
              {/* @ts-ignore */}
              <Scatter name="Bookings" data={chartData} shape="circle">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(var(--chart-1))`}
                    fillOpacity={0.2 + (Math.min(entry.value, 15) / 15) * 0.8}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface MonthlyTrendData {
  month: string;
  bookings: number;
  revenue: number;
}

const seasonalConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function SeasonalTrendsChart() {
  const { data, isLoading } = useQuery<MonthlyTrendData[]>({
    queryKey: ["/api/stats/seasonal"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seasonal Trends</CardTitle>
          <CardDescription>Monthly bookings and revenue</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Seasonal Trends</CardTitle>
        <CardDescription>Bookings vs Revenue (Last 12 Months)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer config={seasonalConfig} className="h-full w-full">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} width={40} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="bookings"
                stroke="var(--color-bookings)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const guideComparisonConfig = {
  rating: {
    label: "Rating",
    color: "hsl(var(--chart-3))",
  },
  tours: {
    label: "Tours",
    color: "hsl(var(--chart-4))",
  }
} satisfies ChartConfig;

export function GuideComparisonChart() {
  const { data, isLoading } = useQuery<GuidePerformance[]>({
    queryKey: ["/api/stats/guide-performance"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Guide Comparison</CardTitle>
          <CardDescription>Rating vs Tours Completed</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Guide Comparison</CardTitle>
        <CardDescription>Performance Matrix (Rating vs Volume)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ChartContainer config={guideComparisonConfig} className="h-full w-full">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="tours" name="Tours" unit="" tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="rating" name="Rating" domain={[0, 5]} tickLine={false} axisLine={false} width={30} />
              <ChartTooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <div className="font-bold mb-1">{data.name}</div>
                        <div className="grid gap-1.5">
                          <div className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground items-center">
                            <div className="shrink-0 rounded-[2px] bg-[--color-tours] h-2.5 w-2.5" />
                            <span className="text-muted-foreground">Tours</span>
                            <span className="font-mono font-medium tabular-nums text-foreground ml-auto">{data.tours}</span>
                          </div>
                          <div className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground items-center">
                            <div className="shrink-0 rounded-[2px] bg-[--color-rating] h-2.5 w-2.5" />
                            <span className="text-muted-foreground">Rating</span>
                            <span className="font-mono font-medium tabular-nums text-foreground ml-auto">{data.rating}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* @ts-ignore */}
              <Scatter name="Guides" data={chartData} fill="var(--color-tours)">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
