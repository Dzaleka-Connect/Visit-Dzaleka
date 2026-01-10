import { useQuery } from "@tanstack/react-query";
import { SEO } from "@/components/seo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { formatDate, formatCurrency } from "@/lib/constants";
import { DollarSign, TrendingUp, Calendar, Loader2 } from "lucide-react";

interface EarningsData {
    totalEarnings: number;
    weeklyEarnings: number;
    monthlyEarnings: number;
    totalTours: number;
    earnings: {
        id: string;
        visitorName: string;
        visitDate: string;
        tourType: string;
        numberOfPeople: number;
        guidePayment: number;
        totalAmount: number;
    }[];
}

export default function MyEarnings() {
    const { data, isLoading } = useQuery<EarningsData>({
        queryKey: ["/api/guides/me/earnings"],
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const earnings = data || {
        totalEarnings: 0,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        totalTours: 0,
        earnings: [],
    };

    return (
        <div className="space-y-6">
            <SEO
                title="My Earnings"
                description="View your earnings from completed tours."
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">My Earnings</h1>
                <p className="text-muted-foreground">
                    Track your earnings from completed tours.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Earnings"
                    value={formatCurrency(earnings.totalEarnings)}
                    subtitle="All time"
                    icon={DollarSign}
                />
                <StatCard
                    title="This Month"
                    value={formatCurrency(earnings.monthlyEarnings)}
                    subtitle={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    icon={Calendar}
                />
                <StatCard
                    title="This Week"
                    value={formatCurrency(earnings.weeklyEarnings)}
                    subtitle="Current week"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Completed Tours"
                    value={earnings.totalTours}
                    subtitle="Total tours"
                    icon={Calendar}
                />
            </div>

            {/* Earnings Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Earnings History</CardTitle>
                    <CardDescription>Detailed breakdown of your earnings from completed tours</CardDescription>
                </CardHeader>
                <CardContent>
                    {earnings.earnings.length === 0 ? (
                        <EmptyState
                            icon={DollarSign}
                            title="No earnings yet"
                            description="Complete tours to start earning."
                            className="py-12"
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Visitor</TableHead>
                                        <TableHead>Tour Type</TableHead>
                                        <TableHead className="text-center">Group Size</TableHead>
                                        <TableHead className="text-right">Tour Total</TableHead>
                                        <TableHead className="text-right">Your Earnings</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {earnings.earnings.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{formatDate(item.visitDate)}</TableCell>
                                            <TableCell className="font-medium">{item.visitorName}</TableCell>
                                            <TableCell className="capitalize">{item.tourType?.replace("_", " ")}</TableCell>
                                            <TableCell className="text-center">{item.numberOfPeople}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {formatCurrency(item.totalAmount)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {formatCurrency(item.guidePayment)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Earnings Summary Card */}
            {earnings.earnings.length > 0 && (
                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-600">
                                <DollarSign className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Lifetime Earnings</p>
                                <p className="text-4xl font-bold text-green-600">{formatCurrency(earnings.totalEarnings)}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    From {earnings.totalTours} completed {earnings.totalTours === 1 ? "tour" : "tours"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
