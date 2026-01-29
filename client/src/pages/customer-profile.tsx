import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import {
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    Tag,
    Edit2,
    Save,
    ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/constants";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";

interface CustomerProfileData {
    user: any;
    bookings: any[];
    stats: {
        totalVisits: number;
        totalSpend: number;
        lastVisit: string | null;
    };
}

export default function CustomerProfile() {
    const [, params] = useRoute("/customers/:id");
    const id = params?.id;
    const { toast } = useToast();

    const { data, isLoading } = useQuery<CustomerProfileData>({
        queryKey: [`/api/customers/${id}`],
        enabled: !!id,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        adminNotes: "",
        preferences: "", // JSON stringified for simple editing, or managed input
        tags: "", // Comma separated
        dateOfBirth: "",
        address: "",
        country: "",
        preferredLanguage: "",
        preferredContactMethod: "",
        marketingConsent: false
    });

    useEffect(() => {
        if (data?.user) {
            setFormData({
                adminNotes: data.user.adminNotes || "",
                preferences: JSON.stringify(data.user.preferences || {}, null, 2),
                tags: (data.user.tags || []).join(", "),
                dateOfBirth: data.user.dateOfBirth ? format(new Date(data.user.dateOfBirth), "yyyy-MM-dd") : "",
                address: data.user.address || "",
                country: data.user.country || "",
                preferredLanguage: data.user.preferredLanguage || "en",
                preferredContactMethod: data.user.preferredContactMethod || "email",
                marketingConsent: data.user.marketingConsent || false
            });
        }
    }, [data]);

    const updateCustomerMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            return apiRequest("PATCH", `/api/customers/${id}`, updatedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/customers/${id}`] });
            setIsEditing(false);
            toast({
                title: "Profile Updated",
                description: "Customer details saved successfully.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update profile.",
                variant: "destructive",
            });
        }
    });

    const handleSave = () => {
        let parsedPreferences = {};
        try {
            parsedPreferences = JSON.parse(formData.preferences || "{}");
        } catch (e) {
            toast({
                title: "Invalid JSON",
                description: "Preferences must be valid JSON.",
                variant: "destructive"
            });
            return;
        }

        const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);

        updateCustomerMutation.mutate({
            adminNotes: formData.adminNotes,
            preferences: parsedPreferences,
            tags: tagsArray,
            dateOfBirth: formData.dateOfBirth || null,
            address: formData.address,
            country: formData.country,
            preferredLanguage: formData.preferredLanguage,
            preferredContactMethod: formData.preferredContactMethod,
            marketingConsent: formData.marketingConsent
        });
    };

    if (isLoading) {
        return <div className="flex h-dvh items-center justify-center">Loading…</div>;
    }

    if (!data || !data.user) {
        return <div className="p-8">Customer not found.</div>;
    }

    const { user, stats, bookings } = data;

    return (
        <div className="space-y-6">
            <SEO title={`${user.firstName} ${user.lastName}`} description="Customer Profile" />

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Customers
                    </Link>
                </Button>
            </div>

            {/* Profile Header */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={user.profileImageUrl} />
                                <AvatarFallback className="text-lg">{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
                                <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground items-center md:items-start">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> {user.email}
                                    </div>
                                    {user.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3" /> {user.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button variant={isEditing ? "secondary" : "outline"} onClick={() => setIsEditing(!isEditing)} className="w-full md:w-auto">
                            <Edit2 className="mr-2 h-4 w-4" />
                            {isEditing ? "Cancel" : "Edit Profile"}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Date of Birth</Label>
                                        <Input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Country</Label>
                                        <Input
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            placeholder="Country"
                                        />
                                    </div>
                                    <div className="grid gap-2 col-span-2">
                                        <Label>Address</Label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="123 Main St..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Language</Label>
                                        <Input
                                            value={formData.preferredLanguage}
                                            onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                            placeholder="en"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Contact Method</Label>
                                        <Input
                                            value={formData.preferredContactMethod}
                                            onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                                            placeholder="email/phone"
                                        />
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.marketingConsent}
                                                onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Marketing Consent</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Tags (comma separated)</Label>
                                    <Input
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="vip, foodie, recurring"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Admin Notes</Label>
                                    <Textarea
                                        value={formData.adminNotes}
                                        onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                                        placeholder="Internal notes about this customer..."
                                        rows={4}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Preferences (JSON)</Label>
                                    <Textarea
                                        value={formData.preferences}
                                        onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                                        className="font-mono text-xs"
                                        rows={4}
                                    />
                                </div>
                                <Button onClick={handleSave} disabled={updateCustomerMutation.isPending}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Personal Information Display */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                        <h4 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4" /> Personal Details</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span className="text-muted-foreground">DOB:</span>
                                            <span>{user.dateOfBirth ? format(new Date(user.dateOfBirth), "MMM d, yyyy") : "-"}</span>
                                            <span className="text-muted-foreground">Country:</span>
                                            <span>{user.country || "-"}</span>
                                            <span className="text-muted-foreground">Address:</span>
                                            <span className="truncate" title={user.address}>{user.address || "-"}</span>
                                        </div>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                        <h4 className="font-semibold text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Communication</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <span className="text-muted-foreground">Language:</span>
                                            <Badge variant="outline">{user.preferredLanguage || "en"}</Badge>
                                            <span className="text-muted-foreground">Method:</span>
                                            <Badge variant="outline">{user.preferredContactMethod || "email"}</Badge>
                                            <span className="text-muted-foreground">Marketing:</span>
                                            <Badge variant={user.marketingConsent ? "default" : "secondary"}>
                                                {user.marketingConsent ? "Subscribed" : "Unsubscribed"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><Tag className="h-4 w-4" /> Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.tags && user.tags.length > 0 ? (
                                            user.tags.map((tag: string) => (
                                                <Badge key={tag} variant="secondary">{tag}</Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">No tags assigned.</span>
                                        )}
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2 text-sm">Admin Notes</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {user.adminNotes || "No notes available."}
                                        </p>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2 text-sm">Preferences (JSON)</h4>
                                        <pre className="text-xs text-muted-foreground overflow-auto">
                                            {JSON.stringify(user.preferences, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatCurrency(stats.totalSpend)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalVisits}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Last Visit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-semibold">
                                {stats.lastVisit ? format(new Date(stats.lastVisit), "MMM d, yyyy") : "Never"}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Booking History */}
            <Card>
                <CardHeader>
                    <CardTitle>Booking History</CardTitle>
                </CardHeader>
                <CardContent>
                    {bookings.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Service</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((booking: any) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>{format(new Date(booking.visitDate), "MMM d, yyyy")}</TableCell>
                                        <TableCell className="font-mono">{booking.bookingReference}</TableCell>
                                        <TableCell>
                                            <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                                                {booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                                        <TableCell>{booking.tourType}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">No bookings found.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
