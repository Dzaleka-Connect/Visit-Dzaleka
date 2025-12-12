import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

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
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: 'currentColor', fontSize: 11 }}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="bookings"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBookings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const chartData = (data || []).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Popular Zones</CardTitle>
        <CardDescription>Most visited areas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="40%"
                innerRadius={40}
                outerRadius={60}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="visits"
                nameKey="name"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [Number(value), 'Visits']}
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

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
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: 'currentColor', fontSize: 11 }} orientation="bottom" />
              <YAxis
                type="category"
                dataKey="displayName"
                tickLine={false}
                axisLine={false}
                width={80}
                tick={{ fill: 'currentColor', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [Number(value), 'Tours']}
                labelFormatter={(label) => {
                  const original = data?.find(d => d.name.startsWith(String(label).replace('...', '')));
                  return original?.name || String(label);
                }}
              />
              <Bar dataKey="tours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
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

interface MonthlyTrendData {
  month: string;
  bookings: number;
  revenue: number;
}

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

  // Transform data to use numeric Y axis for reliable rendering
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
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                type="number"
                name="Hour"
                domain={[0, 23]}
                tickCount={12}
                tickFormatter={(hour) => `${hour}:00`}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                dataKey="dayIndex"
                type="number"
                name="Day"
                domain={[0, 6]}
                tickCount={7}
                tickFormatter={(index) => days[index]}
                tick={{ fontSize: 10 }}
              />
              <ZAxis dataKey="value" range={[50, 400]} name="Bookings" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border p-2 rounded shadow text-sm">
                        <p className="font-bold">{data.dayLabel} at {data.hour}:00</p>
                        <p>Bookings: {data.value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* @ts-ignore */}
              <Scatter name="Bookings" data={chartData} shape="circle">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.value > 0 ? `rgba(16, 185, 129, ${Math.min(0.2 + (entry.value / 3), 1)})` : 'transparent'}
                    stroke={entry.value > 0 ? "#10b981" : "transparent"}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

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
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#8884d8" activeDot={{ r: 8 }} name="Bookings" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (MWK)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

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
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="tours" name="Tours" unit="" />
              <YAxis type="number" dataKey="rating" name="Rating" domain={[0, 5]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border p-2 rounded shadow text-sm">
                      <p className="font-bold">{payload[0].payload.name}</p>
                      <p>Tours: {payload[0].value}</p>
                      <p>Rating: {payload[1].value}</p>
                    </div>
                  );
                }
                return null;
              }} />
              {/* @ts-ignore */}
              <Scatter name="Guides" data={chartData} fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
