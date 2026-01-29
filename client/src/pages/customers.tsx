import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
    Users,
    Search,
    ArrowUpDown,
    MoreVertical,
    Mail,
    ShoppingBag,
    Calendar,
    Crown,
    TrendingUp,
    DollarSign,
    UserCheck,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { EmptyState } from "@/components/empty-state";
import { SEO } from "@/components/seo";

interface CustomerStats {
    totalVisits: number;
    totalSpend: number;
    lastVisit: string | null;
    bookingCount: number;
}

interface Customer extends Record<string, any> {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    phone?: string;
    tags?: string[];
    country?: string;
    role: string;
    stats: CustomerStats;
}

interface VisitorLTV {
    visitorId: string | null;
    email: string;
    name: string;
    isRegistered: boolean;
    profileImageUrl: string | null;
    metrics: {
        totalSpent: number;
        totalBookings: number;
        completedBookings: number;
        averageBookingValue: number;
        firstVisit: string | null;
        lastVisit: string | null;
        visitFrequencyDays: number | null;
    };
    tier: "vip" | "regular" | "new";
}

interface LTVData {
    summary: {
        totalVisitors: number;
        vipCount: number;
        regularCount: number;
        newCount: number;
        totalRevenue: number;
        averageLTV: number;
    };
    visitors: VisitorLTV[];
}

function getTierBadgeVariant(tier: string): "default" | "secondary" | "outline" {
    switch (tier) {
        case "vip": return "default";
        case "regular": return "secondary";
        default: return "outline";
    }
}

function getTierBadgeColor(tier: string): string {
    switch (tier) {
        case "vip": return "bg-amber-500 hover:bg-amber-600";
        case "regular": return "bg-blue-500 hover:bg-blue-600";
        default: return "";
    }
}

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [ltvSearchQuery, setLtvSearchQuery] = useState("");

    const { data: customers, isLoading } = useQuery<Customer[]>({
        queryKey: ["/api/customers"],
    });

    const { data: ltvData, isLoading: ltvLoading } = useQuery<LTVData>({
        queryKey: ["/api/analytics/visitor-ltv"],
    });

    const filteredCustomers = customers?.filter((customer) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            customer.firstName?.toLowerCase().includes(searchLower) ||
            customer.lastName?.toLowerCase().includes(searchLower) ||
            customer.email?.toLowerCase().includes(searchLower)
        );
    });

    const filteredLtvVisitors = ltvData?.visitors?.filter((visitor) => {
        const searchLower = ltvSearchQuery.toLowerCase();
        return (
            visitor.name?.toLowerCase().includes(searchLower) ||
            visitor.email?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            <SEO title="Customers" description="Manage visitor relationships and history." />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">
                        View visitor history, lifetime value, and manage relationships.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="customers" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="customers">
                        <Users className="mr-2 h-4 w-4" />
                        Registered Customers
                    </TabsTrigger>
                    <TabsTrigger value="ltv">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Visitor LTV
                    </TabsTrigger>
                </TabsList>

                {/* Customers Tab */}
                <TabsContent value="customers">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle>Visitor Database</CardTitle>
                                    <CardDescription>
                                        Total Customers: {customers?.length || 0}
                                    </CardDescription>
                                </div>
                                <div className="relative flex-1 md:w-64 md:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search customers..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex h-40 items-center justify-center">
                                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                            ) : !filteredCustomers || filteredCustomers.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="No customers found"
                                    description={searchQuery ? "Try a different search term." : "No visitors have registered yet."}
                                />
                            ) : (
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead className="text-right"> <div className="flex items-center justify-end gap-1">Visits <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                                                <TableHead className="text-right"><div className="flex items-center justify-end gap-1">Total Spend <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Last Visit</TableHead>
                                                <TableHead>Tags</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredCustomers.map((customer) => (
                                                <TableRow key={customer.id} className="group">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarImage src={customer.profileImageUrl} />
                                                                <AvatarFallback>{customer.firstName[0]}{customer.lastName[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                                                                    {customer.firstName} {customer.lastName}
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</span>
                                                            {customer.phone && <span>{customer.phone}</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="secondary" className="font-mono">
                                                            {customer.stats.totalVisits}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(customer.stats.totalSpend)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.country || "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.stats.lastVisit ? (
                                                            <div className="flex flex-col">
                                                                <span>{format(new Date(customer.stats.lastVisit), "MMM d, yyyy")}</span>
                                                                <span className="text-xs text-muted-foreground">{format(new Date(customer.stats.lastVisit), "HH:mm")}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {customer.tags && customer.tags.length > 0 ? (
                                                                customer.tags.slice(0, 2).map((tag: string) => (
                                                                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                                                ))
                                                            ) : null}
                                                            {customer.tags && customer.tags.length > 2 && (
                                                                <Badge variant="outline" className="text-[10px]">+{customer.tags.length - 2}</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/customers/${customer.id}`}>View Profile</Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/bookings?search=${customer.email}`}>View Bookings</Link>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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

                {/* LTV Analytics Tab */}
                <TabsContent value="ltv" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{ltvData?.summary?.totalVisitors || 0}</div>
                                <p className="text-xs text-muted-foreground">Unique booking visitors</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">VIP Visitors</CardTitle>
                                <Crown className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{ltvData?.summary?.vipCount || 0}</div>
                                <p className="text-xs text-muted-foreground">High-value customers</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(ltvData?.summary?.totalRevenue || 0)}</div>
                                <p className="text-xs text-muted-foreground">From all visitors</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(ltvData?.summary?.averageLTV || 0)}</div>
                                <p className="text-xs text-muted-foreground">Per visitor</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tier Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Visitor Tier Distribution</CardTitle>
                            <CardDescription>Breakdown of visitors by lifetime value tier</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 flex-wrap">
                                <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg flex-1 min-w-[200px]">
                                    <Crown className="h-8 w-8 text-amber-500" />
                                    <div>
                                        <div className="text-2xl font-bold">{ltvData?.summary?.vipCount || 0}</div>
                                        <div className="text-sm text-muted-foreground">VIP (≥5 visits or ≥200,000 MWK)</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex-1 min-w-[200px]">
                                    <UserCheck className="h-8 w-8 text-blue-500" />
                                    <div>
                                        <div className="text-2xl font-bold">{ltvData?.summary?.regularCount || 0}</div>
                                        <div className="text-sm text-muted-foreground">Regular (2+ visits)</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg flex-1 min-w-[200px]">
                                    <Users className="h-8 w-8 text-gray-500" />
                                    <div>
                                        <div className="text-2xl font-bold">{ltvData?.summary?.newCount || 0}</div>
                                        <div className="text-sm text-muted-foreground">New (1 visit)</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visitor LTV Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <CardTitle>Visitor Lifetime Value</CardTitle>
                                    <CardDescription>All visitors ranked by total spend</CardDescription>
                                </div>
                                <div className="relative md:w-64">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search visitors..."
                                        value={ltvSearchQuery}
                                        onChange={(e) => setLtvSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {ltvLoading ? (
                                <div className="flex h-40 items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : !filteredLtvVisitors || filteredLtvVisitors.length === 0 ? (
                                <EmptyState
                                    icon={TrendingUp}
                                    title="No visitor data"
                                    description="Visitor LTV data will appear once bookings are completed."
                                />
                            ) : (
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-8">#</TableHead>
                                                <TableHead>Visitor</TableHead>
                                                <TableHead>Tier</TableHead>
                                                <TableHead className="text-right">Total Spent</TableHead>
                                                <TableHead className="text-right">Bookings</TableHead>
                                                <TableHead className="text-right">Avg. Value</TableHead>
                                                <TableHead>Visit Frequency</TableHead>
                                                <TableHead>First Visit</TableHead>
                                                <TableHead>Last Visit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLtvVisitors.map((visitor, index) => (
                                                <TableRow key={visitor.email}>
                                                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9">
                                                                {visitor.profileImageUrl && <AvatarImage src={visitor.profileImageUrl} />}
                                                                <AvatarFallback>
                                                                    {visitor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{visitor.name}</span>
                                                                <span className="text-xs text-muted-foreground">{visitor.email}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={`${visitor.tier === "vip" ? getTierBadgeColor("vip") : visitor.tier === "regular" ? getTierBadgeColor("regular") : ""}`}
                                                            variant={getTierBadgeVariant(visitor.tier)}
                                                        >
                                                            {visitor.tier === "vip" && <Crown className="h-3 w-3 mr-1" />}
                                                            {visitor.tier.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">
                                                        {formatCurrency(visitor.metrics.totalSpent)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-medium">{visitor.metrics.completedBookings}</span>
                                                        <span className="text-muted-foreground">/{visitor.metrics.totalBookings}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(visitor.metrics.averageBookingValue)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {visitor.metrics.visitFrequencyDays ? (
                                                            <span>Every {visitor.metrics.visitFrequencyDays} days</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {visitor.metrics.firstVisit ? (
                                                            format(new Date(visitor.metrics.firstVisit), "MMM d, yyyy")
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {visitor.metrics.lastVisit ? (
                                                            format(new Date(visitor.metrics.lastVisit), "MMM d, yyyy")
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
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
            </Tabs>
        </div>
    );
}
