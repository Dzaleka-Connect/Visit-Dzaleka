import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    FileText,
    MessageSquare,
    Loader2,
    Eye,
    EyeOff,
    ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import type { HelpArticle, SupportTicket, HelpCategory, HelpAudience, TicketStatus } from "@shared/schema";

const CATEGORIES: { value: HelpCategory; label: string }[] = [
    { value: "faq", label: "FAQs" },
    { value: "getting_started", label: "Getting Started" },
    { value: "guide_help", label: "Guide Resources" },
    { value: "visitor_help", label: "Visitor Help" },
    { value: "general", label: "General" },
];

const AUDIENCES: { value: HelpAudience; label: string }[] = [
    { value: "both", label: "Everyone" },
    { value: "visitor", label: "Visitors Only" },
    { value: "guide", label: "Guides Only" },
];

const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

export default function HelpAdmin() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("articles");
    const [editingArticle, setEditingArticle] = useState<Partial<HelpArticle> | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    const { data: articles = [], isLoading: articlesLoading } = useQuery<HelpArticle[]>({
        queryKey: ["/api/admin/help/articles"],
    });

    const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
        queryKey: ["/api/support/tickets"],
    });

    const createArticleMutation = useMutation({
        mutationFn: async (data: Partial<HelpArticle>) => {
            const res = await apiRequest("POST", "/api/admin/help/articles", data);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Article Created" });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/help/articles"] });
            setIsDialogOpen(false);
            setEditingArticle(null);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create article", variant: "destructive" });
        },
    });

    const updateArticleMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<HelpArticle> }) => {
            const res = await apiRequest("PUT", `/api/admin/help/articles/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Article Updated" });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/help/articles"] });
            setIsDialogOpen(false);
            setEditingArticle(null);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update article", variant: "destructive" });
        },
    });

    const deleteArticleMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/admin/help/articles/${id}`);
        },
        onSuccess: () => {
            toast({ title: "Article Deleted" });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/help/articles"] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete article", variant: "destructive" });
        },
    });

    const updateTicketMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<SupportTicket> }) => {
            const res = await apiRequest("PUT", `/api/support/tickets/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Ticket Updated" });
            queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
            setSelectedTicket(null);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update ticket", variant: "destructive" });
        },
    });

    const handleSubmitArticle = () => {
        if (!editingArticle?.title || !editingArticle?.content || !editingArticle?.slug) {
            toast({
                title: "Missing Fields",
                description: "Please fill in title, slug, and content",
                variant: "destructive",
            });
            return;
        }

        if (editingArticle.id) {
            updateArticleMutation.mutate({
                id: editingArticle.id,
                data: editingArticle,
            });
        } else {
            createArticleMutation.mutate(editingArticle);
        }
    };

    const openNewArticleDialog = () => {
        setEditingArticle({
            title: "",
            slug: "",
            content: "",
            category: "general",
            audience: "both",
            isPublished: true,
            sortOrder: 0,
        });
        setIsDialogOpen(true);
    };

    const openEditArticleDialog = (article: HelpArticle) => {
        setEditingArticle({ ...article });
        setIsDialogOpen(true);
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const statusColors: Record<string, string> = {
        open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };

    const priorityColors: Record<string, string> = {
        low: "bg-gray-100 text-gray-800",
        normal: "bg-blue-100 text-blue-800",
        high: "bg-orange-100 text-orange-800",
        urgent: "bg-red-100 text-red-800",
    };

    return (
        <>
            <SEO
                title="Help Center Admin | Visit Dzaleka"
                description="Manage help articles and support tickets"
                robots="noindex"
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Help Center Admin</h1>
                        <p className="text-muted-foreground">Manage help articles and support tickets</p>
                    </div>
                    {activeTab === "articles" && (
                        <Button onClick={openNewArticleDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Article
                        </Button>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="articles" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Articles ({articles.length})
                        </TabsTrigger>
                        <TabsTrigger value="tickets" className="gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Tickets ({tickets.filter((t) => t.status === "open" || t.status === "in_progress").length} open)
                        </TabsTrigger>
                    </TabsList>

                    {/* Articles Tab */}
                    <TabsContent value="articles" className="mt-6">
                        {articlesLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : articles.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold">No Articles Yet</h3>
                                    <p className="text-muted-foreground mt-2">Create your first help article</p>
                                    <Button onClick={openNewArticleDialog} className="mt-4">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Article
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Audience</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {articles.map((article) => (
                                            <TableRow key={article.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{article.title}</p>
                                                        <p className="text-sm text-muted-foreground">/{article.slug}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {CATEGORIES.find((c) => c.value === article.category)?.label || article.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {AUDIENCES.find((a) => a.value === article.audience)?.label || article.audience}
                                                </TableCell>
                                                <TableCell>
                                                    {article.isPublished ? (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            Published
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <EyeOff className="h-3 w-3 mr-1" />
                                                            Draft
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditArticleDialog(article)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm("Delete this article?")) {
                                                                deleteArticleMutation.mutate(article.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Tickets Tab */}
                    <TabsContent value="tickets" className="mt-6">
                        {ticketsLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : tickets.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold">No Tickets</h3>
                                    <p className="text-muted-foreground mt-2">Support tickets will appear here</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tickets.map((ticket) => (
                                            <TableRow key={ticket.id}>
                                                <TableCell>
                                                    <p className="font-medium">{ticket.subject}</p>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                        {ticket.message}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusColors[ticket.status || "open"]}>
                                                        {ticket.status === "in_progress"
                                                            ? "In Progress"
                                                            : (ticket.status || "open").charAt(0).toUpperCase() + (ticket.status || "open").slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={priorityColors[ticket.priority || "normal"]}>
                                                        {(ticket.priority || "normal").charAt(0).toUpperCase() + (ticket.priority || "normal").slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(ticket.createdAt!).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                Update Status
                                                                <ChevronDown className="h-4 w-4 ml-1" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {TICKET_STATUSES.map((status) => (
                                                                <DropdownMenuItem
                                                                    key={status.value}
                                                                    onClick={() =>
                                                                        updateTicketMutation.mutate({
                                                                            id: ticket.id,
                                                                            data: { status: status.value },
                                                                        })
                                                                    }
                                                                >
                                                                    {status.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Article Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingArticle?.id ? "Edit Article" : "New Article"}
                        </DialogTitle>
                        <DialogDescription>
                            Create or edit help center content
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={editingArticle?.title || ""}
                                    onChange={(e) => {
                                        const title = e.target.value;
                                        setEditingArticle((prev) => ({
                                            ...prev,
                                            title,
                                            slug: prev?.slug || generateSlug(title),
                                        }));
                                    }}
                                    placeholder="Article title"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug</label>
                                <Input
                                    value={editingArticle?.slug || ""}
                                    onChange={(e) =>
                                        setEditingArticle((prev) => ({
                                            ...prev,
                                            slug: e.target.value,
                                        }))
                                    }
                                    placeholder="url-friendly-slug"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select
                                    value={editingArticle?.category || "general"}
                                    onValueChange={(value) =>
                                        setEditingArticle((prev) => ({
                                            ...prev,
                                            category: value as HelpCategory,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Audience</label>
                                <Select
                                    value={editingArticle?.audience || "both"}
                                    onValueChange={(value) =>
                                        setEditingArticle((prev) => ({
                                            ...prev,
                                            audience: value as HelpAudience,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AUDIENCES.map((aud) => (
                                            <SelectItem key={aud.value} value={aud.value}>
                                                {aud.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sort Order</label>
                                <Input
                                    type="number"
                                    value={editingArticle?.sortOrder || 0}
                                    onChange={(e) =>
                                        setEditingArticle((prev) => ({
                                            ...prev,
                                            sortOrder: parseInt(e.target.value) || 0,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Content (Markdown)</label>
                            <Textarea
                                value={editingArticle?.content || ""}
                                onChange={(e) =>
                                    setEditingArticle((prev) => ({
                                        ...prev,
                                        content: e.target.value,
                                    }))
                                }
                                rows={12}
                                placeholder="## Heading&#10;&#10;Content here...&#10;&#10;- Bullet point&#10;- Another point"
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={editingArticle?.isPublished ?? true}
                                onCheckedChange={(checked) =>
                                    setEditingArticle((prev) => ({
                                        ...prev,
                                        isPublished: checked,
                                    }))
                                }
                            />
                            <label className="text-sm">Published</label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitArticle}
                            disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
                        >
                            {(createArticleMutation.isPending || updateArticleMutation.isPending) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Article
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
