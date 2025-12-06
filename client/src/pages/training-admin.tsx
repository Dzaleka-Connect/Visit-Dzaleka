import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    BookOpen,
    Plus,
    Edit,
    Trash2,
    ExternalLink,
    Clock,
    Check,
    X,
    GripVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";
import type { TrainingModule } from "@shared/schema";

const CATEGORIES = [
    "About Dzaleka",
    "Visit Dzaleka",
    "Visitor Info",
    "Services",
    "Resources",
    "Culture",
    "Community",
];

interface ModuleFormData {
    title: string;
    description: string;
    category: string;
    content: string;
    externalUrl: string;
    estimatedMinutes: number;
    sortOrder: number;
    isRequired: boolean;
}

const defaultFormData: ModuleFormData = {
    title: "",
    description: "",
    category: "About Dzaleka",
    content: "",
    externalUrl: "",
    estimatedMinutes: 15,
    sortOrder: 0,
    isRequired: true,
};

export default function TrainingAdmin() {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
    const [deleteModule, setDeleteModule] = useState<TrainingModule | null>(null);
    const [formData, setFormData] = useState<ModuleFormData>(defaultFormData);

    const { data: modules, isLoading } = useQuery<TrainingModule[]>({
        queryKey: ["/api/training/modules"],
    });

    const createMutation = useMutation({
        mutationFn: async (data: ModuleFormData) => {
            const res = await apiRequest("POST", "/api/training/modules", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/training/modules"] });
            setIsCreateOpen(false);
            setFormData(defaultFormData);
            toast({ title: "Success", description: "Training module created successfully." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create module.", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<ModuleFormData> }) => {
            const res = await apiRequest("PATCH", `/api/training/modules/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/training/modules"] });
            setEditingModule(null);
            setFormData(defaultFormData);
            toast({ title: "Success", description: "Training module updated successfully." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update module.", variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiRequest("DELETE", `/api/training/modules/${id}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/training/modules"] });
            setDeleteModule(null);
            toast({ title: "Success", description: "Training module deleted successfully." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete module.", variant: "destructive" });
        },
    });

    const handleEdit = (module: TrainingModule) => {
        setEditingModule(module);
        setFormData({
            title: module.title,
            description: module.description || "",
            category: module.category,
            content: module.content || "",
            externalUrl: module.externalUrl || "",
            estimatedMinutes: module.estimatedMinutes || 15,
            sortOrder: module.sortOrder || 0,
            isRequired: module.isRequired ?? true,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingModule) {
            updateMutation.mutate({ id: editingModule.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleCancel = () => {
        setIsCreateOpen(false);
        setEditingModule(null);
        setFormData(defaultFormData);
    };

    // Group modules by category
    const groupedModules = (modules || []).reduce((acc, module) => {
        if (!acc[module.category]) {
            acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
    }, {} as Record<string, TrainingModule[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const isEditing = isCreateOpen || editingModule;

    return (
        <div className="space-y-6">
            <SEO
                title="Training Management"
                description="Manage training modules for guides"
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Training Management</h1>
                    <p className="text-muted-foreground">
                        Create and manage training modules for guides
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Module
                        </Button>
                    </DialogTrigger>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{modules?.length || 0}</div>
                        <p className="text-sm text-muted-foreground">Total Modules</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {modules?.filter(m => m.isRequired).length || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">Required</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {Object.keys(groupedModules).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Categories</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">
                            {modules?.reduce((sum, m) => sum + (m.estimatedMinutes || 0), 0) || 0}m
                        </div>
                        <p className="text-sm text-muted-foreground">Total Time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Module List by Category */}
            {Object.entries(groupedModules).map(([category, categoryModules]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {category}
                            <Badge variant="outline">{categoryModules.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {categoryModules.map((module) => (
                                <div
                                    key={module.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{module.title}</span>
                                                {module.isRequired && (
                                                    <Badge variant="secondary" className="text-xs">Required</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate max-w-md">
                                                {module.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            {module.estimatedMinutes}m
                                        </div>
                                        {module.externalUrl && (
                                            <a
                                                href={module.externalUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-600"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(module)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => setDeleteModule(module)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {(!modules || modules.length === 0) && (
                <Card>
                    <CardContent className="p-12 text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Training Modules</h3>
                        <p className="text-muted-foreground mb-4">
                            Get started by creating your first training module.
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Module
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen || !!editingModule} onOpenChange={(open) => !open && handleCancel()}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingModule ? "Edit Training Module" : "Create Training Module"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingModule
                                ? "Update the training module details below."
                                : "Add a new training module for guides to complete."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Module title"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of what this module covers"
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Content / Instructions</Label>
                                <Textarea
                                    id="content"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Detailed content or instructions for the guide"
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="externalUrl">External Resource URL</Label>
                                <Input
                                    id="externalUrl"
                                    type="url"
                                    value={formData.externalUrl}
                                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                                    placeholder="https://example.com/resource"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="estimatedMinutes">Est. Time (min)</Label>
                                    <Input
                                        id="estimatedMinutes"
                                        type="number"
                                        min="1"
                                        value={formData.estimatedMinutes}
                                        onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 15 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sortOrder">Sort Order</Label>
                                    <Input
                                        id="sortOrder"
                                        type="number"
                                        value={formData.sortOrder}
                                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-6">
                                    <Label htmlFor="isRequired">Required</Label>
                                    <Switch
                                        id="isRequired"
                                        checked={formData.isRequired}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {createMutation.isPending || updateMutation.isPending ? (
                                    "Saving..."
                                ) : editingModule ? (
                                    "Update Module"
                                ) : (
                                    "Create Module"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteModule} onOpenChange={() => setDeleteModule(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Training Module</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteModule?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteModule && deleteMutation.mutate(deleteModule.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
