import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
    Search,
    HelpCircle,
    BookOpen,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    Loader2,
    Send,
    CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/seo";
import type { HelpArticle, HelpCategory } from "@shared/schema";

const CATEGORY_INFO: Record<HelpCategory, { label: string; icon: React.ReactNode; description: string }> = {
    faq: {
        label: "FAQs",
        icon: <HelpCircle className="h-5 w-5" />,
        description: "Frequently asked questions",
    },
    getting_started: {
        label: "Getting Started",
        icon: <BookOpen className="h-5 w-5" />,
        description: "Learn the basics",
    },
    guide_help: {
        label: "Guide Resources",
        icon: <BookOpen className="h-5 w-5" />,
        description: "Help for guides",
    },
    visitor_help: {
        label: "Visitor Help",
        icon: <BookOpen className="h-5 w-5" />,
        description: "Help for visitors",
    },
    general: {
        label: "General",
        icon: <HelpCircle className="h-5 w-5" />,
        description: "General information",
    },
};

export default function HelpCenter() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [showContactForm, setShowContactForm] = useState(false);
    const [ticketSubject, setTicketSubject] = useState("");
    const [ticketMessage, setTicketMessage] = useState("");

    const { data: articles = [], isLoading } = useQuery<HelpArticle[]>({
        queryKey: ["/api/help/articles"],
    });

    const createTicketMutation = useMutation({
        mutationFn: async (data: { subject: string; message: string }) => {
            const res = await apiRequest("POST", "/api/support/tickets", data);
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: "Ticket Submitted",
                description: "We'll get back to you as soon as possible.",
            });
            setShowContactForm(false);
            setTicketSubject("");
            setTicketMessage("");
            queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to submit ticket. Please try again.",
                variant: "destructive",
            });
        },
    });

    const toggleArticle = (id: string) => {
        setExpandedArticles((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Filter articles by search and category
    const filteredArticles = articles.filter((article) => {
        const matchesSearch =
            !searchQuery ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            activeCategory === "all" || article.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    // Group articles by category
    const groupedArticles = filteredArticles.reduce((acc, article) => {
        const category = article.category || "general";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(article);
        return acc;
    }, {} as Record<string, HelpArticle[]>);

    // Get unique categories from articles
    const availableCategories = Array.from(
        new Set(articles.map((a) => a.category))
    ).filter(Boolean) as HelpCategory[];

    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketSubject.trim() || !ticketMessage.trim()) {
            toast({
                title: "Missing Information",
                description: "Please fill in both subject and message.",
                variant: "destructive",
            });
            return;
        }
        createTicketMutation.mutate({
            subject: ticketSubject,
            message: ticketMessage,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <SEO
                title="Help Center | Visit Dzaleka"
                description="Get help and learn about the Visit Dzaleka platform"
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-4 py-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">How can we help you?</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Find answers to common questions, learn how to use the platform, or contact our support team.
                    </p>

                    {/* Search */}
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search help articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 text-lg"
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveCategory("getting_started")}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Getting Started</h3>
                                <p className="text-sm text-muted-foreground">Learn the basics</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveCategory("faq")}>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <HelpCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold">FAQs</h3>
                                <p className="text-sm text-muted-foreground">Common questions</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
                        <DialogTrigger asChild>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                        <MessageSquare className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Contact Support</h3>
                                        <p className="text-sm text-muted-foreground">Get in touch</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Contact Support</DialogTitle>
                                <DialogDescription>
                                    Submit a support ticket and we'll get back to you as soon as possible.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input
                                        placeholder="What do you need help with?"
                                        value={ticketSubject}
                                        onChange={(e) => setTicketSubject(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <Textarea
                                        placeholder="Describe your issue or question in detail..."
                                        rows={5}
                                        value={ticketMessage}
                                        onChange={(e) => setTicketMessage(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        disabled={createTicketMutation.isPending}
                                    >
                                        {createTicketMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        Submit Ticket
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Category Tabs */}
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="all">All Topics</TabsTrigger>
                        {availableCategories.map((category) => (
                            <TabsTrigger key={category} value={category}>
                                {CATEGORY_INFO[category]?.label || category}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <TabsContent value={activeCategory} className="mt-6">
                        {filteredArticles.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold">No articles found</h3>
                                    <p className="text-muted-foreground mt-2">
                                        {searchQuery
                                            ? "Try adjusting your search terms"
                                            : "No help articles available in this category"}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
                                    <div key={category} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            {CATEGORY_INFO[category as HelpCategory]?.icon}
                                            <h2 className="text-xl font-semibold">
                                                {CATEGORY_INFO[category as HelpCategory]?.label || category}
                                            </h2>
                                            <Badge variant="outline">{categoryArticles.length}</Badge>
                                        </div>

                                        <div className="grid gap-3">
                                            {categoryArticles.map((article) => (
                                                <Card key={article.id}>
                                                    <Collapsible
                                                        open={expandedArticles.has(article.id)}
                                                        onOpenChange={() => toggleArticle(article.id)}
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
                                                                <div className="flex items-center justify-between">
                                                                    <CardTitle className="text-base font-medium">
                                                                        {article.title}
                                                                    </CardTitle>
                                                                    {expandedArticles.has(article.id) ? (
                                                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                                    ) : (
                                                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                            </CardHeader>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <CardContent className="pt-0">
                                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                        {article.content}
                                                                    </ReactMarkdown>
                                                                </div>
                                                            </CardContent>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* My Tickets Section */}
                {user && (
                    <MyTicketsSection />
                )}
            </div>
        </>
    );
}

// Sub-component to show user's own tickets
function MyTicketsSection() {
    const { data: tickets = [], isLoading } = useQuery<any[]>({
        queryKey: ["/api/support/tickets"],
    });

    if (isLoading || tickets.length === 0) return null;

    const statusColors: Record<string, string> = {
        open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    My Support Tickets
                </CardTitle>
                <CardDescription>Track the status of your support requests</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                        >
                            <div>
                                <p className="font-medium">{ticket.subject}</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Badge className={statusColors[ticket.status] || statusColors.open}>
                                {ticket.status === "in_progress" ? "In Progress" :
                                    ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
