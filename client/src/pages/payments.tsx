import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Wallet, ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle, Clock, CreditCard, ExternalLink, Search, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const ZERO_DECIMAL_CURRENCIES = new Set([
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "JPY",
    "KMF",
    "KRW",
    "MGA",
    "PYG",
    "RWF",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
]);

function amountFromMinorUnits(amount: number, currency: string) {
    return amount / (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 1 : 100);
}

function formatPaymentAmount(amount: number, currency: string) {
    const normalizedCurrency = currency.toUpperCase();
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency) || normalizedCurrency === "MWK";

    return new Intl.NumberFormat(normalizedCurrency === "MWK" ? "en-MW" : "en-US", {
        style: "currency",
        currency: normalizedCurrency,
        minimumFractionDigits: isZeroDecimal ? 0 : 2,
        maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount || 0);
}

function formatMinorPaymentAmount(amount: number, currency: string) {
    return formatPaymentAmount(amountFromMinorUnits(amount, currency), currency);
}

interface AmountProps {
    amount: number;
    currency: string;
    className?: string;
}

function Amount({ amount, currency, className }: AmountProps) {
    return (
        <span className={className}>
            {formatPaymentAmount(amount, currency)}
        </span>
    );
}

interface PaymentConfig {
    isLiveMode: boolean;
    provider: string;
    currency: string;
    secretKeyConfigured: boolean;
    webhookConfigured: boolean;
    usdConversionConfigured: boolean;
    usdConversionRate: number | null;
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
        brand?: string | null;
        last4?: string | null;
        country?: string | null;
        funding?: string;
        checkoutCurrency?: string | null;
        checkoutAmount?: number | null;
        checkoutAmountMinor?: number | null;
        balanceCurrency?: string | null;
        stripeFee?: number | null;
        stripeNet?: number | null;
        receiptUrl?: string | null;
        checkoutSessionId?: string | null;
        paymentIntentId?: string | null;
    };
}

export default function PaymentsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [datePreset, setDatePreset] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [txSearch, setTxSearch] = useState("");

    // Redirect non-admins
    if (user && user.role !== "admin") {
        return <Redirect to="/" />;
    }

    // Fetch Transactions
    const { data: transactions, isLoading: isLoadingTransactions, isError, error, refetch: refetchTransactions } = useQuery<Transaction[]>({
        queryKey: ["/api/admin/transactions"],
    });

    // Fetch Payment Config
    const { data: config } = useQuery<PaymentConfig>({
        queryKey: ["/api/admin/payment-config"],
        staleTime: 0,
    });

    // Fetch Stripe Balance
    interface StripeBalance {
        available: { amount: number; currency: string }[];
        pending: { amount: number; currency: string }[];
    }
    const { data: stripeBalance, isLoading: isLoadingBalance } = useQuery<StripeBalance>({
        queryKey: ["/api/admin/stripe/balance"],
        refetchInterval: 60000,
    });

    // Filtered transactions
    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx => {
            // Date filter
            if (datePreset !== "all") {
                const days = parseInt(datePreset);
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                if (new Date(tx.date) < cutoff) return false;
            }
            // Status filter
            if (statusFilter !== "all" && tx.status !== statusFilter) return false;
            // Search
            if (txSearch) {
                const q = txSearch.toLowerCase();
                if (
                    !tx.visitorName?.toLowerCase().includes(q) &&
                    !tx.bookingReference?.toLowerCase().includes(q) &&
                    !tx.reference?.toLowerCase().includes(q)
                ) return false;
            }
            return true;
        });
    }, [transactions, datePreset, statusFilter, txSearch]);

    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.status === 'paid' ? t.amount : 0), 0);
    const totalFees = filteredTransactions.reduce((sum, t) => sum + (t.paymentFees || 0), 0);
    const netRevenue = filteredTransactions.reduce((sum, t) => sum + (t.netAmount || (t.status === 'paid' ? t.amount : 0)), 0);

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
                                    {stripeBalance?.available?.length
                                        ? stripeBalance.available.map((balance) => (
                                            <div key={`${balance.currency}-${balance.amount}`}>
                                                {formatMinorPaymentAmount(balance.amount, balance.currency)}
                                            </div>
                                        ))
                                        : <Amount amount={0} currency={config?.currency || "MWK"} />}
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
                                    {stripeBalance?.pending?.length
                                        ? stripeBalance.pending.map((balance) => (
                                            <div key={`${balance.currency}-${balance.amount}`}>
                                                {formatMinorPaymentAmount(balance.amount, balance.currency)}
                                            </div>
                                        ))
                                        : <Amount amount={0} currency={config?.currency || "MWK"} />}
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
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Transaction History</CardTitle>
                                        <CardDescription>
                                            {filteredTransactions.length} of {transactions?.length || 0} transactions
                                        </CardDescription>
                                    </div>
                                </div>
                                {/* Filters */}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                                    <div className="relative flex-1 sm:max-w-xs">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or reference\u2026"
                                            value={txSearch}
                                            onChange={(e) => setTxSearch(e.target.value)}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                    <div className="flex gap-1">
                                        {(["7", "30", "90", "all"] as const).map(preset => (
                                            <Button
                                                key={preset}
                                                variant={datePreset === preset ? "default" : "outline"}
                                                size="sm"
                                                className="h-9 text-xs"
                                                onClick={() => setDatePreset(preset)}
                                            >
                                                {preset === "all" ? "All" : `${preset}d`}
                                            </Button>
                                        ))}
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32 h-9">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                            <SelectItem value="refunded">Refunded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!filteredTransactions || filteredTransactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <Clock className="h-10 w-10 mb-3 opacity-20" />
                                    <p>{transactions && transactions.length > 0 ? "No transactions match your filters." : "No recent transactions found."}</p>
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
                                                    {filteredTransactions.map((tx) => (
                                                        <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                                            <td className="p-2 sm:p-3 whitespace-nowrap text-xs sm:text-sm">{format(new Date(tx.date), "MMM d, yyyy")}</td>
                                                            <td className="p-2 sm:p-3 font-medium whitespace-nowrap text-xs sm:text-sm">{tx.visitorName}</td>
                                                            <td className="p-2 sm:p-3 text-muted-foreground font-mono text-xs whitespace-nowrap">{tx.bookingReference}</td>
                                                            <td className="p-2 sm:p-3">
                                                                <div className="flex flex-col">
                                                                    <span className="capitalize font-medium">
                                                                        {tx.paymentDetails?.brand && tx.paymentDetails?.last4 ? (
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
                                                                {tx.paymentDetails?.checkoutCurrency && tx.paymentDetails.checkoutAmount != null && (
                                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                                        Stripe charge: {formatPaymentAmount(tx.paymentDetails.checkoutAmount, tx.paymentDetails.checkoutCurrency)}
                                                                    </div>
                                                                )}
                                                                {tx.paymentDetails?.receiptUrl && (
                                                                    <a
                                                                        href={tx.paymentDetails.receiptUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                                    >
                                                                        Receipt
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </a>
                                                                )}
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
                                                                ) : tx.paymentDetails?.stripeFee != null && tx.paymentDetails.balanceCurrency ? (
                                                                    <div className="flex flex-col text-xs">
                                                                        {tx.paymentDetails.stripeNet != null && (
                                                                            <span className="text-emerald-600 font-medium">
                                                                                Stripe net: {formatPaymentAmount(tx.paymentDetails.stripeNet, tx.paymentDetails.balanceCurrency)}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-muted-foreground">
                                                                            Stripe fee: {formatPaymentAmount(tx.paymentDetails.stripeFee, tx.paymentDetails.balanceCurrency)}
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
                                        <span className="font-mono font-bold">{config?.currency || "MWK"}</span>
                                        <span className="text-muted-foreground text-sm">
                                            {config?.currency === "USD" ? "(Stripe card charge currency)" : "(Malawian Kwacha)"}
                                        </span>
                                    </div>
                                    {config?.currency === "USD" && (
                                        <p className="text-xs text-muted-foreground">
                                            Booking prices remain tracked in MWK. Stripe checkout converts the charge to USD using your configured MWK per USD rate.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-md border p-3 bg-muted/20">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium">Stripe key</span>
                                        {config?.secretKeyConfigured ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Set
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Missing
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-md border p-3 bg-muted/20">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium">Webhook</span>
                                        {config?.webhookConfigured ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Set
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Missing
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-md border p-3 bg-muted/20">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium">USD conversion</span>
                                        {config?.usdConversionConfigured ? (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Ready
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                <XCircle className="mr-1 h-3 w-3" />
                                                Missing
                                            </Badge>
                                        )}
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
                                {!config?.webhookConfigured && (
                                    <p className="text-xs text-destructive">
                                        Payments will not be marked paid automatically until STRIPE_WEBHOOK_SECRET is set for the Stripe webhook endpoint.
                                    </p>
                                )}
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
