import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCcw,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { EmptyState } from "@/components/empty-state";

interface RevenueDashboard {
  totalRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  pendingRevenue: number;
  refundedAmount: number;
  byPaymentMethod: { method: string; amount: number; count: number }[];
  byTourType: { type: string; amount: number; count: number }[];
  byPaymentStatus: { status: string; amount: number; count: number }[];
  recentTransactions: { id: string; reference: string; visitorName: string; amount: number; status: string; date: string }[];
  monthlyTrend: { month: string; revenue: number; bookings: number }[];
}

interface PayoutData {
  guideId: string;
  guideName: string;
  completedTours: number;
  paidTours: number;
  pendingTours: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  guideShare: number;
  platformShare: number;
}

const COLORS = ["#0284c7", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-MW", {
    style: "currency",
    currency: "MWK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// CSV Export helper
const downloadCSV = (data: RevenueDashboard) => {
  // Create CSV content
  let csv = "Revenue Report - Dzaleka Online Services\n\n";

  // Summary
  csv += "Summary\n";
  csv += `Total Revenue,${data.totalRevenue}\n`;
  csv += `Weekly Revenue,${data.weeklyRevenue}\n`;
  csv += `Monthly Revenue,${data.monthlyRevenue}\n`;
  csv += `Pending Revenue,${data.pendingRevenue}\n`;
  csv += `Refunded Amount,${data.refundedAmount}\n\n`;

  // By Payment Method
  csv += "Revenue by Payment Method\n";
  csv += "Method,Amount,Count\n";
  data.byPaymentMethod.forEach(item => {
    csv += `${item.method},${item.amount},${item.count}\n`;
  });
  csv += "\n";

  // By Tour Type
  csv += "Revenue by Tour Type\n";
  csv += "Type,Amount,Count\n";
  data.byTourType.forEach(item => {
    csv += `${item.type},${item.amount},${item.count}\n`;
  });
  csv += "\n";

  // Recent Transactions
  csv += "Recent Transactions\n";
  csv += "Reference,Visitor,Amount,Status,Date\n";
  data.recentTransactions.forEach(tx => {
    csv += `${tx.reference},"${tx.visitorName}",${tx.amount},${tx.status},${tx.date}\n`;
  });
  csv += "\n";

  // Monthly Trend
  csv += "Monthly Trend\n";
  csv += "Month,Revenue,Bookings\n";
  data.monthlyTrend.forEach(item => {
    csv += `${item.month},${item.revenue},${item.bookings}\n`;
  });

  // Download
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


const formatMethodName = (method: string) => {
  const names: Record<string, string> = {
    airtel_money: "Airtel Money",
    tnm_mpamba: "TNM Mpamba",
    cash: "Cash",
    unknown: "Unknown",
  };
  return names[method] || method;
};

const formatTourType = (type: string) => {
  const names: Record<string, string> = {
    standard: "Standard",
    extended: "Extended",
    custom: "Custom",
  };
  return names[type] || type;
};

const formatStatus = (status: string) => {
  const names: Record<string, string> = {
    paid: "Paid",
    pending: "Pending",
    refunded: "Refunded",
  };
  return names[status] || status;
};

function PayoutsTab() {
  const { data: payouts, isLoading } = useQuery<PayoutData[]>({
    queryKey: ["/api/reports/payouts"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!payouts || payouts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No payout data"
        description="No guides with completed tours found."
        className="py-12"
      />
    );
  }

  const totalGuideShare = payouts.reduce((sum, p) => sum + p.guideShare, 0);
  const totalPlatformShare = payouts.reduce((sum, p) => sum + p.platformShare, 0);
  const totalPendingRevenue = payouts.reduce((sum, p) => sum + p.pendingRevenue, 0);
  const totalCompletedTours = payouts.reduce((sum, p) => sum + p.completedTours, 0);
  const totalPaidTours = payouts.reduce((sum, p) => sum + p.paidTours, 0);
  const totalPendingTours = payouts.reduce((sum, p) => sum + p.pendingTours, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Guide Payouts (80%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalGuideShare)}</div>
            <p className="text-xs text-muted-foreground">{totalPaidTours} paid tours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue (20%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalPlatformShare)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPendingRevenue)}</div>
            <p className="text-xs text-muted-foreground">{totalPendingTours} tours awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Tours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedTours}</div>
            <p className="text-xs text-muted-foreground">{totalPaidTours} paid, {totalPendingTours} pending</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guide Payout Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guide Name</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Paid</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-right">Paid Revenue</TableHead>
                  <TableHead className="text-right">Pending Revenue</TableHead>
                  <TableHead className="text-right">Guide Share (80%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.guideId}>
                    <TableCell className="font-medium">{payout.guideName}</TableCell>
                    <TableCell className="text-center">{payout.completedTours}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {payout.paidTours}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {payout.pendingTours > 0 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                          {payout.pendingTours}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(payout.paidRevenue)}</TableCell>
                    <TableCell className="text-right text-amber-600">
                      {payout.pendingRevenue > 0 ? formatCurrency(payout.pendingRevenue) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">{formatCurrency(payout.guideShare)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Revenue() {
  const { data, isLoading, error } = useQuery<RevenueDashboard>({
    queryKey: ["/api/revenue"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Revenue</h1>
          <p className="text-muted-foreground">Track revenue and payments.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Revenue</h1>
          <p className="text-muted-foreground">Track revenue and payments.</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={DollarSign}
              title="Unable to load revenue data"
              description="Please try again later."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieData = data.byPaymentMethod.map((item, index) => ({
    name: formatMethodName(item.method),
    value: item.amount,
    count: item.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Revenue</h1>
          <p className="text-muted-foreground">
            Track revenue and payments.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payouts">Guide Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => downloadCSV(data)} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-revenue">
                  {formatCurrency(data.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">All time earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
                  {formatCurrency(data.monthlyRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600" data-testid="text-pending-revenue">
                  {formatCurrency(data.pendingRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Refunded</CardTitle>
                <RefreshCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="text-refunded-amount">
                  {formatCurrency(data.refundedAmount)}
                </div>
                <p className="text-xs text-muted-foreground">Total refunds</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {data.monthlyTrend.every((m) => m.revenue === 0) ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="No revenue data yet"
                    description="Revenue trends will appear here once bookings are completed."
                    className="py-8"
                  />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis
                          className="text-xs"
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelClassName="font-medium"
                        />
                        <Bar dataKey="revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">By Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    title="No payment data yet"
                    description="Payment breakdown will appear here once payments are received."
                    className="py-8"
                  />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">By Tour Type</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byTourType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data available</p>
                ) : (
                  <div className="space-y-4">
                    {data.byTourType.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{formatTourType(item.type)}</p>
                          <p className="text-xs text-muted-foreground">{item.count} bookings</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {data.byPaymentStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data available</p>
                ) : (
                  <div className="space-y-4">
                    {data.byPaymentStatus.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.status === "paid" && (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          )}
                          {item.status === "pending" && (
                            <Clock className="h-4 w-4 text-amber-500" />
                          )}
                          {item.status === "refunded" && (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          )}
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{formatStatus(item.status)}</p>
                            <p className="text-xs text-muted-foreground">{item.count} bookings</p>
                          </div>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Weekly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Weekly Revenue</p>
                    <p className="font-semibold text-green-600">{formatCurrency(data.weeklyRevenue)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Pending This Week</p>
                    <p className="font-semibold text-amber-600">{formatCurrency(data.pendingRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentTransactions.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No transactions yet"
                  description="Recent transactions will appear here."
                  className="py-8"
                />
              ) : (
                <div className="rounded-md border overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Visitor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`transaction-row-${transaction.id}`}>
                          <TableCell className="font-mono text-sm">
                            {transaction.reference}
                          </TableCell>
                          <TableCell>{transaction.visitorName}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {transaction.date}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                transaction.status === "paid"
                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                                  : transaction.status === "pending"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                              }
                            >
                              {formatStatus(transaction.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <PayoutsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
