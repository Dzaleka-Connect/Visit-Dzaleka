import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
    BookOpen,
    CheckCircle,
    Clock,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Play,
    Award,
    Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import type { TrainingModule, TrainingProgressStatus } from "@shared/schema";

interface ModuleWithProgress extends TrainingModule {
    progress: {
        status: TrainingProgressStatus;
        completedAt: string | null;
        notes: string | null;
    };
}

const STATUS_COLORS: Record<TrainingProgressStatus, string> = {
    not_started: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_LABELS: Record<TrainingProgressStatus, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
};

export default function GuideTraining() {
    const { toast } = useToast();
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [notes, setNotes] = useState<Record<string, string>>({});

    const { data: modules, isLoading, error } = useQuery<ModuleWithProgress[]>({
        queryKey: ["/api/training/progress"],
        retry: false,
    });

    const { data: stats } = useQuery<{ completed: number; total: number; percentage: number }>({
        queryKey: ["/api/training/stats"],
        retry: false,
    });

    const updateProgressMutation = useMutation({
        mutationFn: async ({ moduleId, status, notes }: { moduleId: string; status: TrainingProgressStatus; notes?: string }) => {
            const res = await apiRequest("POST", `/api/training/progress/${moduleId}`, { status, notes });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/training/progress"] });
            queryClient.invalidateQueries({ queryKey: ["/api/training/stats"] });
            toast({
                title: "Progress Updated",
                description: "Your training progress has been saved.",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to update progress. Please try again.",
                variant: "destructive",
            });
        },
    });

    const toggleExpanded = (moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    const handleStatusChange = (moduleId: string, status: TrainingProgressStatus) => {
        const moduleNotes = notes[moduleId];
        updateProgressMutation.mutate({ moduleId, status, notes: moduleNotes });
    };

    // Get unique categories
    const categories = modules
        ? Array.from(new Set(modules.map(m => m.category))).sort()
        : [];

    // Filter modules by category
    const filteredModules = modules?.filter(m =>
        categoryFilter === "all" || m.category === categoryFilter
    ) || [];

    // Group by category
    const groupedModules = filteredModules.reduce((acc, module) => {
        if (!acc[module.category]) {
            acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
    }, {} as Record<string, ModuleWithProgress[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    // Handle case where guide profile doesn't exist
    if (error || !modules) {
        return (
            <div className="space-y-6">
                <SEO
                    title="Guide Training"
                    description="Complete your training modules to become a certified Dzaleka guide"
                />
                <Card>
                    <CardContent className="p-12 text-center">
                        <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">Guide Profile Required</h3>
                        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                            Your user account is not linked to a guide profile yet.
                            Please contact an administrator to set up your guide profile,
                            then you'll be able to access the training modules.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/">Return to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SEO
                title="Guide Training"
                description="Complete your training modules to become a certified Dzaleka guide"
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Guide Training</h1>
                    <p className="text-muted-foreground">
                        Complete the modules below to become a certified guide
                    </p>
                </div>
            </div>

            {/* Progress Overview */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                                <Award className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Your Progress</h2>
                                <p className="text-muted-foreground">
                                    {stats?.completed || 0} of {stats?.total || 0} required modules completed
                                </p>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Completion</span>
                                <span className="text-sm text-muted-foreground">{stats?.percentage || 0}%</span>
                            </div>
                            <Progress value={stats?.percentage || 0} className="h-3" />
                        </div>
                        {stats?.percentage === 100 && (
                            <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Certified Guide
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Modules by Category */}
            {Object.entries(groupedModules).map(([category, categoryModules]) => (
                <div key={category} className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        {category}
                        <Badge variant="outline" className="ml-2">
                            {categoryModules.filter(m => m.progress.status === "completed").length}/
                            {categoryModules.length}
                        </Badge>
                    </h3>

                    <div className="grid gap-4">
                        {categoryModules.map(module => (
                            <Card key={module.id} className="overflow-hidden">
                                <Collapsible
                                    open={expandedModules.has(module.id)}
                                    onOpenChange={() => toggleExpanded(module.id)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <CardTitle className="text-base">{module.title}</CardTitle>
                                                        <Badge className={STATUS_COLORS[module.progress.status as TrainingProgressStatus]}>
                                                            {STATUS_LABELS[module.progress.status as TrainingProgressStatus]}
                                                        </Badge>
                                                        {module.isRequired && (
                                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                                        )}
                                                    </div>
                                                    <CardDescription className="mt-1">
                                                        {module.description}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        {module.estimatedMinutes}m
                                                    </div>
                                                    {expandedModules.has(module.id) ? (
                                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <CardContent className="pt-0 space-y-4">
                                            {module.content && (
                                                <div className="p-4 rounded-lg bg-muted/50">
                                                    <p className="text-sm">{module.content}</p>
                                                </div>
                                            )}

                                            {module.externalUrl && (
                                                <Button asChild variant="outline" className="w-full">
                                                    <a href={module.externalUrl} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        Open Training Resource
                                                    </a>
                                                </Button>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Your Notes</label>
                                                <Textarea
                                                    placeholder="Add notes about what you learned..."
                                                    value={notes[module.id] || module.progress.notes || ""}
                                                    onChange={(e) => setNotes(prev => ({ ...prev, [module.id]: e.target.value }))}
                                                    rows={2}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                {module.progress.status === "not_started" && (
                                                    <Button
                                                        onClick={() => handleStatusChange(module.id, "in_progress")}
                                                        disabled={updateProgressMutation.isPending}
                                                    >
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Start Module
                                                    </Button>
                                                )}
                                                {module.progress.status === "in_progress" && (
                                                    <Button
                                                        onClick={() => handleStatusChange(module.id, "completed")}
                                                        disabled={updateProgressMutation.isPending}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Mark as Completed
                                                    </Button>
                                                )}
                                                {module.progress.status === "completed" && (
                                                    <div className="flex items-center gap-2 text-green-600">
                                                        <CheckCircle className="h-5 w-5" />
                                                        <span className="font-medium">Completed</span>
                                                        {module.progress.completedAt && (
                                                            <span className="text-sm text-muted-foreground">
                                                                on {new Date(module.progress.completedAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {filteredModules.length === 0 && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Training Modules</h3>
                        <p className="text-muted-foreground">
                            {categoryFilter !== "all"
                                ? "No modules found in this category."
                                : "Training modules will appear here once they are added."}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
