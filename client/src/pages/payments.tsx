import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Wallet, ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle, Clock, CreditCard, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";

interface AmountProps {
    amount: number;
    currency: string;
    className?: string;
}

function Amount({ amount, currency, className }: AmountProps) {
    return (
        <span className={className}>
            {currency} {amount.toLocaleString()}
        </span>
    );
}

interface PayChanguBalance {
    message: string;
    status: "success" | "error";
    data: {
        wallet_currency: string;
        wallet_balance: number;
    } | null;
    configured: boolean;
    available: number;
    pending: number;
    currency: string;
}

interface Transaction {
    id: string;
    date: string;
    visitorName: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    reference: string;
    bookingReference: string;
    paymentFees?: number;
    netAmount?: number;
    paymentDetails?: {
        brand: string;
        last4: string;
        country: string;
    };
}

export default function PaymentsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Redirect non-admins
    if (user && user.role !== "admin") {
        return <Redirect to="/" />;
    }

    // Fetch Transactions
    const { data: transactions, isLoading: isLoadingTransactions, isError, error, refetch: refetchTransactions } = useQuery<Transaction[]>({
        queryKey: ["/api/admin/transactions"],
    });

    // Fetch Payment Config
    const { data: config } = useQuery<{ isLiveMode: boolean, provider: string, currency: string }>({
        queryKey: ["/api/admin/payment-config"],
        staleTime: 0, // Always fetch fresh data
    });

    // Fetch Stripe Balance
    interface StripeBalance {
        available: { amount: number; currency: string }[];
        pending: { amount: number; currency: string }[];
    }
    const { data: stripeBalance, isLoading: isLoadingBalance } = useQuery<StripeBalance>({
        queryKey: ["/api/admin/stripe/balance"],
        refetchInterval: 60000, // Refresh every minute
    });

    const totalRevenue = transactions?.reduce((sum, t) => sum + (t.status === 'paid' ? t.amount : 0), 0) || 0;
    const totalFees = transactions?.reduce((sum, t) => sum + (t.paymentFees || 0), 0) || 0;
    const netRevenue = transactions?.reduce((sum, t) => sum + (t.netAmount || (t.status === 'paid' ? t.amount : 0)), 0) || 0;

    if (isLoadingTransactions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <XCircle className="h-12 w-12 text-destructive" />
                    <h2 className="text-xl font-semibold">Failed to load transactions</h2>
                    <p className="text-muted-foreground">{error instanceof Error ? error.message : "An unknown error occurred"}</p>
                    <Button onClick={() => refetchTransactions()}>Try Again</Button>
                </div>
            </PageContainer>
        );
    }



    return (
        <PageContainer>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <PageHeader
                    title="Payments Dashboard"
                    description="Overview of bookings, revenue, and fees"
                />
                <Button variant="outline" size="sm" onClick={() => refetchTransactions()} className="w-full sm:w-auto">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {/* Total Revenue (Gross) */}
                <Card className="col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Gross Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold">
                            <Amount amount={totalRevenue} currency="MWK" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total sales before fees
                        </p>
                    </CardContent>
                </Card>

                {/* Net Revenue */}
                <Card className="col-span-1 border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Net Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            <Amount amount={netRevenue} currency="MWK" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Actual payout (Fees: {new Intl.NumberFormat('en-MW', { style: 'currency', currency: 'MWK' }).format(totalFees)})
                        </p>
                    </CardContent>
                </Card>

                {/* Stripe Available Balance */}
                <Card className="col-span-1 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Available Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingBalance ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {stripeBalance?.available?.[0]
                                        ? formatCurrency(stripeBalance.available[0].amount / 100)
                                        : formatCurrency(0)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Ready to payout
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Stripe Pending Balance */}
                <Card className="col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingBalance ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <div className="text-xl sm:text-2xl font-bold">
                                    {stripeBalance?.pending?.[0]
                                        ? formatCurrency(stripeBalance.pending[0].amount / 100)
                                        : formatCurrency(0)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Awaiting clearance
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="transactions">
                <TabsList>
                    <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
                    <TabsTrigger value="payouts">Guide Payouts</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>Recent booking payments and transfers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!transactions || transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <Clock className="h-10 w-10 mb-3 opacity-20" />
                                    <p>No recent transactions found.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-6 sm:mx-0">
                                    <div className="inline-block min-w-full align-middle">
                                        <div className="rounded-md border">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/50 text-muted-foreground">
                                                    <tr>
                                                        <th className="p-2 sm:p-3 font-medium whitespace-nowrap">Date</th>
                                                        <th className="p-2 sm:p-3 font-medium whitespace-nowrap">Visitor</th>
                                                        <th className="p-2 sm:p-3 font-medium whitespace-nowrap">Reference</th>
                                                        <th className="p-2 sm:p-3 font-medium whitespace-nowrap">Method</th>
                                                        <th className="p-2 sm:p-3 font-medium whitespace-nowrap">Amount</th>
                                                        <th className="p-2 sm:p-3 font-medium whitespace-nowrap">Fees / Net</th>
                                                        <th className="p-2 sm:p-3 font-medium whitespace-nowrap">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {transactions.map((tx) => (
                                                        <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                                            <td className="p-2 sm:p-3 whitespace-nowrap text-xs sm:text-sm">{format(new Date(tx.date), "MMM d, yyyy")}</td>
                                                            <td className="p-2 sm:p-3 font-medium whitespace-nowrap text-xs sm:text-sm">{tx.visitorName}</td>
                                                            <td className="p-2 sm:p-3 text-muted-foreground font-mono text-xs whitespace-nowrap">{tx.bookingReference}</td>
                                                            <td className="p-2 sm:p-3">
                                                                <div className="flex flex-col">
                                                                    <span className="capitalize font-medium">
                                                                        {tx.paymentDetails?.brand ? (
                                                                            <span className="flex items-center gap-1">
                                                                                {tx.paymentDetails.brand.toUpperCase()} <span className="text-muted-foreground text-xs">•••• {tx.paymentDetails.last4}</span>
                                                                            </span>
                                                                        ) : (
                                                                            tx.method?.replace('_', ' ') || 'Unknown'
                                                                        )}
                                                                    </span>
                                                                    {tx.paymentDetails?.country && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {tx.paymentDetails.country} {tx.paymentDetails.funding && `(${tx.paymentDetails.funding})`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="font-medium">
                                                                    <Amount amount={tx.amount} currency={tx.currency} />
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                {tx.paymentFees ? (
                                                                    <div className="flex flex-col text-xs">
                                                                        <span className="text-emerald-600 font-medium">
                                                                            Net: <Amount amount={tx.netAmount || 0} currency={tx.currency} />
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            Fee: <Amount amount={tx.paymentFees} currency={tx.currency} />
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground">-</span>
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                <Badge
                                                                    variant={tx.status === 'paid' ? 'default' : 'secondary'}
                                                                    className={tx.status === 'paid' ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
                                                                >
                                                                    {tx.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Guide Payouts</CardTitle>
                            <CardDescription>Manage disbursements to tour guides.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">Go to the Guides page to initiate payouts for specific guides.</p>
                                <Button asChild>
                                    <a href="/guides">View Guides</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Configuration</CardTitle>
                            <CardDescription>Manage your payment gateway settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Active Provider</Label>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                                        <CreditCard className="h-5 w-5 text-emerald-600" />
                                        <span className="font-medium">Stripe Payments</span>
                                        <Badge variant="outline" className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                                        <span className="font-mono font-bold">MWK</span>
                                        <span className="text-muted-foreground text-sm">(Malawian Kwacha)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Environment</Label>
                                <div className="flex items-center space-x-2">
                                    <div className={`h-2.5 w-2.5 rounded-full ${config?.isLiveMode ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    <span className="text-sm font-medium">
                                        {config?.isLiveMode ? 'Live Mode' : 'Test Mode'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {config?.isLiveMode
                                        ? "Processing real payments. All transactions will be charged."
                                        : "Using Stripe Test Key (sk_test_...). No actual charges will be made."}
                                </p>
                            </div>

                            <div className="pt-4 border-t">
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => {
                                        const dashboardUrl = config?.isLiveMode
                                            ? 'https://dashboard.stripe.com'
                                            : 'https://dashboard.stripe.com/test';
                                        window.open(dashboardUrl, '_blank');
                                    }}
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View in Stripe Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </PageContainer>
    );
}
