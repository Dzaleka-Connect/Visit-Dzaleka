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
    Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const { data: customers, isLoading } = useQuery<Customer[]>({
        queryKey: ["/api/customers"],
    });

    const filteredCustomers = customers?.filter((customer) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            customer.firstName?.toLowerCase().includes(searchLower) ||
            customer.lastName?.toLowerCase().includes(searchLower) ||
            customer.email?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            <SEO title="Customers" description="Manage visitor relationships and history." />

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground">
                        View visitor history, lifetime value, and manage relationships.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Future: Add Export Button */}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Visitor Database</CardTitle>
                            <CardDescription>
                                Total Customers: {customers?.length || 0}
                            </CardDescription>
                        </div>
                        <div className="relative flex-1 md:w-64">
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
                        <div className="rounded-md border">
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
        </div>
    );
}
