import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { Key, Plus, Copy, Trash2, Clock, Activity, Shield, Code, BookOpen, Terminal, AlertTriangle, Layout, Palette, Eye, EyeOff, RefreshCw, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WebhookEndpoint, WebhookDelivery } from "@shared/schema";
import { DataErrorState } from "@/components/data-error-state";

const WEBHOOK_EVENTS = [
    { id: "booking.created", label: "Booking Created" },
    { id: "booking.updated", label: "Booking Updated" },
    { id: "guide.assigned", label: "Guide Assigned" },
    { id: "incident.reported", label: "Incident Reported" },
];

const DEVELOPER_TABS = new Set(["api-keys", "embed-widgets", "api-docs", "webhooks"]);

function normalizeDeveloperTab(value: string | null) {
    return value && DEVELOPER_TABS.has(value) ? value : "api-keys";
}

interface ApiKey {
    id: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    status: "active" | "revoked" | "expired";
    lastUsedAt: string | null;
    expiresAt: string | null;
    requestCount: number;
    createdAt: string;
}

const AVAILABLE_SCOPES = [
    { id: "bookings:read", label: "Read Bookings" },
    { id: "bookings:write", label: "Create/Update Bookings" },
    { id: "guides:read", label: "Read Guide Profiles" },
];

export default function DeveloperSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    const search = useSearch();
    const activeTab = normalizeDeveloperTab(new URLSearchParams(search).get("tab"));
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);

    // Webhooks State
    const [createWebhookOpen, setCreateWebhookOpen] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [webhookEvents, setWebhookEvents] = useState<string[]>(["booking.created"]);
    const [showWebhookSecrets, setShowWebhookSecrets] = useState<Record<string, boolean>>({});
    const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
    const [viewingDelivery, setViewingDelivery] = useState<WebhookDelivery | null>(null);

    const { data: webhookEndpoints, isLoading: isLoadingWebhooks, isError: webhooksError, refetch: refetchWebhooks } = useQuery<WebhookEndpoint[]>({
        queryKey: ["/api/webhooks"],
    });

    const { data: deliveries, isLoading: isLoadingDeliveries, isError: deliveriesError, refetch: refetchDeliveries } = useQuery<WebhookDelivery[]>({
        queryKey: ["/api/webhooks/deliveries", selectedEndpointId],
        queryFn: async () => {
            const url = selectedEndpointId 
                ? `/api/webhooks/deliveries?endpointId=${selectedEndpointId}`
                : `/api/webhooks/deliveries`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch deliveries");
            return res.json();
        },
        refetchInterval: 5000,
    });

    const createWebhookMutation = useMutation({
        mutationFn: async (data: { url: string; description: string; events: string[]; status: "active" | "disabled" }) => {
            const res = await apiRequest("POST", "/api/webhooks", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
            toast({
                title: "Webhook Created",
                description: "The webhook endpoint has been registered.",
            });
            setCreateWebhookOpen(false);
            setWebhookUrl("");
            setWebhookEvents(["booking.created"]);
        },
        onError: (err: any) => {
            toast({
                title: "Error",
                description: err.message || "Failed to create webhook endpoint",
                variant: "destructive",
            });
        },
    });

    const updateWebhookMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<WebhookEndpoint> }) => {
            const res = await apiRequest("PATCH", `/api/webhooks/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
            toast({
                title: "Webhook Updated",
                description: "The endpoint configuration has been updated.",
            });
        },
    });

    const deleteWebhookMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/webhooks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
            toast({
                title: "Webhook Deleted",
                description: "The webhook endpoint was deleted successfully.",
            });
        },
    });

    const retryDeliveryMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiRequest("POST", `/api/webhooks/deliveries/${id}/retry`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/webhooks/deliveries"] });
            toast({
                title: "Delivery Retried",
                description: "A retry attempt has been scheduled.",
            });
        },
    });

    // Widget Builder State
    const [widgetTheme, setWidgetTheme] = useState<"light" | "dark">("light");
    const [widgetColor, setWidgetColor] = useState("#f97316");
    const [widgetTourType, setWidgetTourType] = useState("individual");
    const [widgetShowBranding, setWidgetShowBranding] = useState(true);

    const generateEmbedCode = () => {
        const params = new URLSearchParams({
            theme: widgetTheme,
            primaryColor: widgetColor,
            defaultTourType: widgetTourType,
            showBranding: widgetShowBranding.toString(),
        });
        return `<iframe 
  src="https://visit.dzaleka.com/embed/booking?${params.toString()}"
  width="100%" 
  height="600"
  frameborder="0"
  style="border-radius: 8px;"
></iframe>`;
    };

    const { data: apiKeys, isLoading, isError: apiKeysError, refetch: refetchApiKeys } = useQuery<ApiKey[]>({
        queryKey: ["/api/developer/api-keys"],
    });
    const apiKeysList = apiKeys || [];
    const webhookEndpointsList = webhookEndpoints || [];
    const deliveriesList = deliveries || [];

    const createKeyMutation = useMutation({
        mutationFn: async (data: { name: string; scopes: string[] }) => {
            const res = await apiRequest("POST", "/api/developer/api-keys", data);
            return res.json();
        },
        onSuccess: (data) => {
            setGeneratedKey(data.key);
            queryClient.invalidateQueries({ queryKey: ["/api/developer/api-keys"] });
            toast({
                title: "API Key Created",
                description: "Copy your key now. It won't be shown again!",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to create API key",
                variant: "destructive",
            });
        },
    });

    const revokeKeyMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/developer/api-keys/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/developer/api-keys"] });
            toast({
                title: "API Key Revoked",
                description: "The API key has been revoked and can no longer be used.",
            });
        },
    });

    const handleCreateKey = () => {
        if (!newKeyName.trim()) {
            toast({ title: "Error", description: "Key name is required", variant: "destructive" });
            return;
        }
        createKeyMutation.mutate({ name: newKeyName, scopes: selectedScopes });
    };

    const handleCopyKey = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            toast({ title: "Copied!", description: "API key copied to clipboard" });
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: "Copied!", description: "Code copied to clipboard" });
    };

    const resetCreateDialog = () => {
        setNewKeyName("");
        setSelectedScopes([]);
        setGeneratedKey(null);
        setCreateDialogOpen(false);
    };

    const handleTabChange = (value: string) => {
        const tab = normalizeDeveloperTab(value);
        setLocation(tab === "api-keys" ? "/developer" : `/developer?tab=${tab}`);
    };

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <SEO title="Developer Settings" description="Manage API keys and integrations" />

            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Code className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
                    Developer Settings
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    Manage API keys, webhooks, and integrations for extending Visit Dzaleka
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <TabsList className="inline-flex w-auto min-w-full md:w-auto">
                        <TabsTrigger value="api-keys" className="gap-1 md:gap-2 text-xs md:text-sm">
                            <Key className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">API</span> Keys
                        </TabsTrigger>
                        <TabsTrigger value="embed-widgets" className="gap-1 md:gap-2 text-xs md:text-sm">
                            <Layout className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">Embed</span> Widgets
                        </TabsTrigger>
                        <TabsTrigger value="api-docs" className="gap-1 md:gap-2 text-xs md:text-sm">
                            <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="hidden sm:inline">API</span> Docs
                        </TabsTrigger>
                        <TabsTrigger value="webhooks" className="gap-1 md:gap-2 text-xs md:text-sm">
                            <Activity className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            Webhooks
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="api-keys" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">API Keys</h2>
                            <p className="text-sm text-muted-foreground">
                                Create API keys to authenticate requests from your applications
                            </p>
                        </div>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create API Key
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                {!generatedKey ? (
                                    <>
                                        <DialogHeader>
                                            <DialogTitle>Create New API Key</DialogTitle>
                                            <DialogDescription>
                                                Give your key a name and select the permissions it should have.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="keyName">Key Name</Label>
                                                <Input
                                                    id="keyName"
                                                    placeholder="e.g., Production API Key"
                                                    value={newKeyName}
                                                    onChange={(e) => setNewKeyName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Permissions</Label>
                                                <div className="space-y-2">
                                                    {AVAILABLE_SCOPES.map((scope) => (
                                                        <div key={scope.id} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={scope.id}
                                                                checked={selectedScopes.includes(scope.id)}
                                                                onCheckedChange={(checked) => {
                                                                    setSelectedScopes(
                                                                        checked
                                                                            ? [...selectedScopes, scope.id]
                                                                            : selectedScopes.filter((s) => s !== scope.id)
                                                                    );
                                                                }}
                                                            />
                                                            <label htmlFor={scope.id} className="text-sm">
                                                                {scope.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleCreateKey} disabled={createKeyMutation.isPending}>
                                                {createKeyMutation.isPending ? "Creating…" : "Create Key"}
                                            </Button>
                                        </DialogFooter>
                                    </>
                                ) : (
                                    <>
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                                <Shield className="h-5 w-5" />
                                                API Key Created
                                            </DialogTitle>
                                            <DialogDescription>
                                                Copy your API key now. You won't be able to see it again!
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                                            {generatedKey}
                                        </div>
                                        <DialogFooter className="flex gap-2">
                                            <Button onClick={handleCopyKey} className="gap-2">
                                                <Copy className="h-4 w-4" />
                                                Copy to Clipboard
                                            </Button>
                                            <Button variant="outline" onClick={resetCreateDialog}>
                                                Done
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
                    ) : apiKeysError ? (
                        <DataErrorState
                            title="API keys unavailable"
                            description="API key inventory could not be loaded. Retry before assuming no keys exist."
                            onRetry={() => void refetchApiKeys()}
                        />
                    ) : apiKeysList.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Create an API key to start integrating with Visit Dzaleka
                                </p>
                                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Your First API Key
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {apiKeysList.map((key) => (
                                <Card key={key.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Key className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <CardTitle className="text-lg">{key.name}</CardTitle>
                                                    <CardDescription className="font-mono text-xs">
                                                        {key.keyPrefix}...
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Badge variant={key.status === "active" ? "default" : "secondary"}>
                                                {key.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                Created {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                                            </div>
                                            {key.lastUsedAt && (
                                                <div className="flex items-center gap-1">
                                                    <Activity className="h-4 w-4" />
                                                    Last used {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}
                                                </div>
                                            )}
                                            <div>
                                                {key.requestCount} requests
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {key.scopes?.map((scope) => (
                                                <Badge key={scope} variant="outline" className="text-xs">
                                                    {scope}
                                                </Badge>
                                            ))}
                                            {(!key.scopes || key.scopes.length === 0) && (
                                                <span className="text-sm text-muted-foreground">No scopes assigned</span>
                                            )}
                                        </div>
                                        {key.status === "active" && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" className="gap-2">
                                                        <Trash2 className="h-4 w-4" />
                                                        Revoke Key
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. Any applications using this key will
                                                            lose access immediately.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => revokeKeyMutation.mutate(key.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Revoke Key
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Embed Widgets Tab */}
                <TabsContent value="embed-widgets" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Builder Panel */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="h-5 w-5" />
                                    Widget Builder
                                </CardTitle>
                                <CardDescription>
                                    Customize your booking widget appearance
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Theme</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={widgetTheme === "light" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setWidgetTheme("light")}
                                        >
                                            Light
                                        </Button>
                                        <Button
                                            variant={widgetTheme === "dark" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setWidgetTheme("dark")}
                                        >
                                            Dark
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="color"
                                            value={widgetColor}
                                            onChange={(e) => setWidgetColor(e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer border-0"
                                        />
                                        <Input
                                            value={widgetColor}
                                            onChange={(e) => setWidgetColor(e.target.value)}
                                            className="w-28 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Tour Type</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {["individual", "small_group", "large_group"].map((type) => (
                                            <Button
                                                key={type}
                                                variant={widgetTourType === type ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setWidgetTourType(type)}
                                            >
                                                {type.replace("_", " ")}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="showBranding"
                                        checked={widgetShowBranding}
                                        onCheckedChange={(checked) => setWidgetShowBranding(!!checked)}
                                    />
                                    <label htmlFor="showBranding" className="text-sm">
                                        Show "Powered by Visit Dzaleka" branding
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview Panel */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Preview</CardTitle>
                                <CardDescription>
                                    How your widget will appear on your website
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`rounded-lg p-6 ${widgetTheme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50"
                                        }`}
                                    style={{ borderColor: widgetColor, borderWidth: 2 }}
                                >
                                    <div className="space-y-4">
                                        <h3 className="font-semibold" style={{ color: widgetColor }}>
                                            Book Your Visit
                                        </h3>
                                        <div className="space-y-2">
                                            <div className={`h-10 rounded ${widgetTheme === "dark" ? "bg-gray-800" : "bg-white"} border`} />
                                            <div className={`h-10 rounded ${widgetTheme === "dark" ? "bg-gray-800" : "bg-white"} border`} />
                                            <div className={`h-10 rounded ${widgetTheme === "dark" ? "bg-gray-800" : "bg-white"} border`} />
                                        </div>
                                        <Button style={{ backgroundColor: widgetColor }} className="w-full">
                                            Book Now
                                        </Button>
                                        {widgetShowBranding && (
                                            <p className="text-xs text-center text-muted-foreground">
                                                Powered by Visit Dzaleka
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Embed Code */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                Embed Code
                            </CardTitle>
                            <CardDescription>
                                Copy this code and paste it into your website
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 rounded-lg font-mono text-sm relative group overflow-x-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleCopyCode(generateEmbedCode())}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <pre className="whitespace-pre-wrap">{generateEmbedCode()}</pre>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Documentation Tab */}
                <TabsContent value="api-docs" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Terminal className="h-5 w-5" />
                                Base URL & Authentication
                            </CardTitle>
                            <CardDescription>
                                Developer API endpoints require an API key with the listed scope
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Base URL</p>
                                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                                    <code>https://visit.dzaleka.com/api</code>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">Example Request</p>
                                <div className="bg-muted p-4 rounded-lg font-mono text-sm relative group overflow-x-auto">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Copy example request"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleCopyCode(`curl -X GET "https://visit.dzaleka.com/api/bookings" \\
  -H "Authorization: Bearer dvz_your_api_key_here"`)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <pre>{`curl -X GET "https://visit.dzaleka.com/api/bookings" \\
  -H "Authorization: Bearer dvz_your_api_key_here"`}</pre>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>API Endpoints</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Badge>GET</Badge> /api/bookings
                                </h4>
                                <p className="text-sm text-muted-foreground">List all bookings</p>
                                <Badge variant="outline">bookings:read</Badge>
                                <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                    <pre>{`{
  "id": "uuid",
  "bookingReference": "DVS-2024-ABC123",
  "visitorName": "John Doe",
  "visitDate": "2024-12-20",
  "status": "confirmed"
}`}</pre>
                                </div>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Badge className="bg-green-600">POST</Badge> /api/bookings
                                </h4>
                                <p className="text-sm text-muted-foreground">Create a new booking</p>
                                <Badge variant="outline">bookings:write</Badge>
                                <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                    <pre>{`{
  "visitorName": "John Doe",
  "visitorEmail": "john@example.com",
  "visitDate": "2024-12-20",
  "visitTime": "10:00",
  "groupSize": "small_group",
  "numberOfPeople": 5
}`}</pre>
                                </div>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Badge>GET</Badge> /api/guides
                                </h4>
                                <p className="text-sm text-muted-foreground">List all tour guides</p>
                                <Badge variant="outline">guides:read</Badge>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Badge>GET</Badge> /api/meeting-points, /api/zones
                                </h4>
                                <p className="text-sm text-muted-foreground">Read public tour setup data for booking integrations</p>
                                <Badge variant="outline">guides:read</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Scopes Reference</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                {[
                                    { scope: "bookings:read", desc: "View all bookings" },
                                    { scope: "bookings:write", desc: "Create and update bookings" },
                                    { scope: "guides:read", desc: "View guide profiles, availability, meeting points, and zones" },
                                ].map((item) => (
                                    <div key={item.scope} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <code className="text-sm bg-muted px-2 py-1 rounded">{item.scope}</code>
                                        <span className="text-sm text-muted-foreground">{item.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                Rate Limits & Errors
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Rate Limits</p>
                                <p className="text-sm text-muted-foreground">100 requests per minute per API key</p>
                            </div>
                            <div className="grid gap-2">
                                {[
                                    { code: "400", desc: "Bad Request - Invalid parameters" },
                                    { code: "401", desc: "Unauthorized - Missing/invalid API key" },
                                    { code: "403", desc: "Forbidden - Insufficient scope" },
                                    { code: "429", desc: "Too Many Requests - Rate limited" },
                                ].map((err) => (
                                    <div key={err.code} className="flex items-center gap-3 py-2 border-b last:border-0">
                                        <Badge variant="destructive">{err.code}</Badge>
                                        <span className="text-sm text-muted-foreground">{err.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="webhooks" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Webhooks</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure HTTP POST endpoints to receive real-time event updates
                            </p>
                        </div>
                        <Dialog open={createWebhookOpen} onOpenChange={setCreateWebhookOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Endpoint
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Webhook Endpoint</DialogTitle>
                                    <DialogDescription>
                                        Specify the destination URL and select event triggers.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="webhookUrl">Payload URL</Label>
                                        <Input
                                            id="webhookUrl"
                                            placeholder="https://your-api.com/webhooks"
                                            value={webhookUrl}
                                            onChange={(e) => setWebhookUrl(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Must be HTTPS. Visit Dzaleka sends a POST request with signature verification headers.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Event Triggers</Label>
                                        <div className="space-y-2">
                                            {WEBHOOK_EVENTS.map((event) => (
                                                <div key={event.id} className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`webhook-${event.id}`}
                                                        checked={webhookEvents.includes(event.id)}
                                                        onCheckedChange={(checked) => {
                                                            setWebhookEvents(
                                                                checked
                                                                    ? [...webhookEvents, event.id]
                                                                    : webhookEvents.filter((e) => e !== event.id)
                                                            );
                                                        }}
                                                    />
                                                    <label htmlFor={`webhook-${event.id}`} className="text-sm">
                                                        {event.label} (<code>{event.id}</code>)
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setCreateWebhookOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => createWebhookMutation.mutate({ url: webhookUrl, description: "Integration Webhook", events: webhookEvents, status: "active" })}
                                        disabled={createWebhookMutation.isPending}
                                    >
                                        {createWebhookMutation.isPending ? "Adding…" : "Add Endpoint"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Webhook Endpoints List */}
                        <div className="lg:col-span-1 space-y-4">
                            <h3 className="font-semibold text-lg">Endpoints</h3>
                            {isLoadingWebhooks ? (
                                <div className="text-center py-4 text-muted-foreground">Loading endpoints…</div>
                            ) : webhooksError ? (
                                <DataErrorState
                                    title="Webhook endpoints unavailable"
                                    description="Webhook endpoint inventory could not be loaded. Retry before assuming no endpoints exist."
                                    onRetry={() => void refetchWebhooks()}
                                />
                            ) : webhookEndpointsList.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-8">
                                        <Globe className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground text-center">No endpoints registered</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                webhookEndpointsList.map((endpoint) => {
                                    const isSecretVisible = showWebhookSecrets[endpoint.id];
                                    return (
                                        <Card
                                            key={endpoint.id}
                                            className={cn(
                                                "cursor-pointer hover:border-primary/50 transition-colors",
                                                selectedEndpointId === endpoint.id && "border-primary ring-1 ring-primary"
                                            )}
                                            onClick={() => setSelectedEndpointId(selectedEndpointId === endpoint.id ? null : endpoint.id)}
                                        >
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="font-medium text-sm break-all pr-2 max-w-[80%]">
                                                        {endpoint.url}
                                                    </div>
                                                    <Badge variant={endpoint.status === "active" ? "default" : "secondary"}>
                                                        {endpoint.status}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap gap-1">
                                                    {endpoint.events.map((evt) => (
                                                        <Badge key={evt} variant="outline" className="text-[10px]">
                                                            {evt}
                                                        </Badge>
                                                    ))}
                                                </div>

                                                <div className="pt-2 border-t text-xs space-y-2" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-between items-center text-muted-foreground">
                                                        <span>Signing Secret</span>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() =>
                                                                    setShowWebhookSecrets({
                                                                        ...showWebhookSecrets,
                                                                        [endpoint.id]: !isSecretVisible,
                                                                    })
                                                                }
                                                            >
                                                                {isSecretVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(endpoint.secret || "");
                                                                    toast({ title: "Copied!", description: "Secret copied to clipboard" });
                                                                }}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="font-mono bg-muted p-1.5 rounded break-all select-all">
                                                        {isSecretVisible ? (endpoint.secret || "") : "whsec_••••••••••••••••••••••••"}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={`status-${endpoint.id}`}
                                                            checked={endpoint.status === "active"}
                                                            onCheckedChange={(checked) =>
                                                                updateWebhookMutation.mutate({
                                                                    id: endpoint.id,
                                                                    data: { status: checked ? "active" : "disabled" },
                                                                })
                                                            }
                                                        />
                                                        <label htmlFor={`status-${endpoint.id}`} className="text-xs text-muted-foreground select-none cursor-pointer">
                                                            Enabled
                                                        </label>
                                                    </div>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Webhook Endpoint?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete this endpoint? You will stop receiving webhook dispatches at this URL.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deleteWebhookMutation.mutate(endpoint.id)}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>

                        {/* Webhook Delivery Logs */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-muted-foreground" />
                                    Delivery Logs
                                    {selectedEndpointId && (
                                        <Badge variant="outline" className="text-xs">
                                            Filtered
                                        </Badge>
                                    )}
                                </h3>
                                {selectedEndpointId && (
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedEndpointId(null)}>
                                        Clear Filter
                                    </Button>
                                )}
                            </div>

                            <Card>
                                <CardContent className="p-0">
                                    {isLoadingDeliveries ? (
                                        <div className="text-center py-8 text-muted-foreground">Loading delivery logs…</div>
                                    ) : deliveriesError ? (
                                        <div className="p-6">
                                            <DataErrorState
                                                title="Webhook deliveries unavailable"
                                                description="Webhook delivery history could not be loaded. Retry before assuming no deliveries exist."
                                                onRetry={() => void refetchDeliveries()}
                                            />
                                        </div>
                                    ) : deliveriesList.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center">
                                            <Clock className="h-10 w-10 mb-2" />
                                            <p className="text-sm font-medium">No webhook deliveries recorded</p>
                                            <p className="text-xs text-muted-foreground">
                                                Trigger some actions (e.g. creating bookings) to dispatch logs
                                            </p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[400px]">
                                            <div className="divide-y">
                                                {deliveriesList.map((delivery) => (
                                                    <div
                                                        key={delivery.id}
                                                        className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                                                        onClick={() => setViewingDelivery(delivery)}
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sm font-semibold">
                                                                    {delivery.event}
                                                                </span>
                                                                <Badge
                                                                    variant={
                                                                        delivery.status === "success"
                                                                            ? "default"
                                                                            : delivery.status === "failed"
                                                                            ? "destructive"
                                                                            : "secondary"
                                                                    }
                                                                >
                                                                    {delivery.responseStatus || "—"}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                                                <span>ID: {delivery.id.slice(0, 8)}</span>
                                                                <span>•</span>
                                                                <span>
                                                                    {delivery.timestamp ? formatDistanceToNow(new Date(delivery.timestamp), { addSuffix: true }) : "—"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            {delivery.status !== "success" && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 gap-1"
                                                                    disabled={retryDeliveryMutation.isPending}
                                                                    onClick={() => retryDeliveryMutation.mutate(delivery.id)}
                                                                >
                                                                    <RefreshCw className="h-3 w-3" />
                                                                    Retry
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Delivery Log Details Dialog */}
                    <Dialog open={!!viewingDelivery} onOpenChange={(open) => !open && setViewingDelivery(null)}>
                        {viewingDelivery && (
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="font-mono text-base break-all">
                                        Delivery Details: {viewingDelivery.id}
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center gap-2">
                                        Event: <code>{viewingDelivery.event}</code>
                                        <span>•</span>
                                        Status:{" "}
                                        <Badge
                                            variant={
                                                viewingDelivery.status === "success"
                                                    ? "default"
                                                    : viewingDelivery.status === "failed"
                                                    ? "destructive"
                                                    : "secondary"
                                            }
                                        >
                                            {viewingDelivery.status}
                                        </Badge>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-semibold block text-xs uppercase text-muted-foreground">Status Code</span>
                                            <code>{viewingDelivery.responseStatus || "—"}</code>
                                        </div>
                                        <div>
                                            <span className="font-semibold block text-xs uppercase text-muted-foreground">Dispatched At</span>
                                            <span>{viewingDelivery.timestamp ? new Date(viewingDelivery.timestamp).toLocaleString() : "—"}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="font-semibold block text-xs uppercase text-muted-foreground">Payload (JSON)</span>
                                        <ScrollArea className="h-44 bg-muted rounded-lg border">
                                            <pre className="p-3 text-xs font-mono whitespace-pre overflow-x-auto">
                                                {JSON.stringify(viewingDelivery.payload, null, 2)}
                                            </pre>
                                        </ScrollArea>
                                    </div>

                                    {viewingDelivery.responseBody && (
                                        <div className="space-y-1">
                                            <span className="font-semibold block text-xs uppercase text-muted-foreground">Response Body</span>
                                            <ScrollArea className="h-28 bg-muted rounded-lg border">
                                                <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
                                                    {viewingDelivery.responseBody}
                                                </pre>
                                            </ScrollArea>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="sm:justify-between items-center">
                                    <div className="text-xs text-muted-foreground">
                                        Endpoint ID: {viewingDelivery.endpointId}
                                    </div>
                                    <div className="flex gap-2">
                                        {viewingDelivery.status !== "success" && (
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => {
                                                    retryDeliveryMutation.mutate(viewingDelivery.id);
                                                    setViewingDelivery(null);
                                                }}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Retry Now
                                            </Button>
                                        )}
                                        <Button variant="outline" onClick={() => setViewingDelivery(null)}>
                                            Close
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        )}
                    </Dialog>
                </TabsContent>
            </Tabs>
        </div>
    );
}
