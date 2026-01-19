import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insertBlogPostSchema, BlogPost, InsertBlogPost } from "@shared/schema";
import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";

export default function AdminBlogEditor() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const [, params] = useRoute("/admin/blog/edit/:id");
    const id = params?.id;
    const isEditing = !!id;

    const { data: post, isLoading: isLoadingPost } = useQuery<BlogPost>({
        queryKey: [`/api/blog/id/${id}`],
        enabled: isEditing,
    });

    const form = useForm<InsertBlogPost>({
        resolver: zodResolver(insertBlogPostSchema),
        defaultValues: {
            title: "",
            slug: "",
            content: "",
            excerpt: "",
            coverImage: "",
            published: false,
        },
    });

    useEffect(() => {
        if (post) {
            form.reset({
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt || "",
                coverImage: post.coverImage || "",
                published: post.published || false,
            });
        }
    }, [post, form]);

    const mutation = useMutation({
        mutationFn: async (data: InsertBlogPost) => {
            if (isEditing) {
                return apiRequest("PATCH", `/api/blog/${id}`, data);
            } else {
                return apiRequest("POST", "/api/blog", data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
            if (isEditing) {
                queryClient.invalidateQueries({ queryKey: [`/api/blog/id/${id}`] });
            }
            toast({
                title: "Success",
                description: `Blog post ${isEditing ? "updated" : "created"} successfully`,
            });
            setLocation("/admin/blog");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || `Failed to ${isEditing ? "update" : "create"} blog post`,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data: InsertBlogPost) => {
        mutation.mutate(data);
    };

    const generateSlug = () => {
        const title = form.getValues("title");
        if (title) {
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");
            form.setValue("slug", slug, { shouldValidate: true });
        }
    };

    if (isEditing && isLoadingPost) {
        return <div className="flex h-dvh items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/blog"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{isEditing ? "Edit Blog Post" : "Create New Blog Post"}</h1>
                    <p className="text-muted-foreground">{isEditing ? "Make changes to your article." : "Write a new story for your audience."}</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter post title" {...field} onChange={(e) => {
                                                field.onChange(e);
                                                if (!isEditing && !form.getValues("slug")) {
                                                    // Auto-generate slug for new posts if slug is empty
                                                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                                                    form.setValue("slug", slug);
                                                }
                                            }} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input placeholder="post-url-slug" {...field} />
                                                </FormControl>
                                                <Button type="button" variant="outline" size="sm" onClick={generateSlug} title="Generate from Title">
                                                    Generate
                                                </Button>
                                            </div>
                                            <FormDescription>The URL-friendly identifier for the post.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="published"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Published</FormLabel>
                                                <FormDescription>
                                                    Make this post visible to the public.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="coverImage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cover Image URL</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                                            </div>
                                        </FormControl>
                                        <FormDescription>A representative image for the article.</FormDescription>
                                        <FormMessage />
                                        {field.value && (
                                            <div className="mt-2 h-40 w-full overflow-hidden rounded-md border bg-muted">
                                                <img src={field.value} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                            </div>
                                        )}
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="excerpt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Excerpt</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="A brief summary of the post..." className="h-20" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormDescription>Shown in the blog list and meta description.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Write your story here... (Markdown supported)" className="min-h-[400px] font-mono" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-4">
                                <Button variant="outline" asChild type="button">
                                    <Link href="/admin/blog">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    {isEditing ? "Update Post" : "Create Post"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
