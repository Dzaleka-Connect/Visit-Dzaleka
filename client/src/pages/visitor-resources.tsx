import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  CheckCircle,
  Clock,
  ExternalLink,
  Info,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrainingModule } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/seo";
import { apiRequest } from "@/lib/queryClient";

type ResourceProgress = Record<string, { status: "completed"; completedAt?: string }>;

export default function VisitorResourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modules, isLoading } = useQuery<TrainingModule[]>({
    queryKey: ["/api/visitor-resources"],
  });

  const { data: resourceProgress = {}, isLoading: progressLoading } = useQuery<ResourceProgress>({
    queryKey: ["/api/visitor-resources/progress"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await apiRequest("PATCH", `/api/visitor-resources/progress/${moduleId}`, {
        status: "completed",
      });
      return response.json() as Promise<ResourceProgress>;
    },
    onSuccess: (progress) => {
      queryClient.setQueryData(["/api/visitor-resources/progress"], progress);
      toast({
        title: "Marked as read",
        description: "Your progress is saved to your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Progress not saved",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsRead = (moduleId: string) => markAsReadMutation.mutate(moduleId);

  const categories = modules
    ? Array.from(new Set(modules.map((m) => m.category)))
    : [];

  // Group modules by category
  const modulesByCategory = modules?.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, TrainingModule[]>);

  const calculateProgress = () => {
    if (!modules || modules.length === 0) return 0;
    const readCount = Object.keys(resourceProgress).filter((id) =>
      modules.some((m) => m.id === id)
    ).length;
    return Math.round((readCount / modules.length) * 100);
  };

  if (isLoading || progressLoading) {
    return (
      <div className="space-y-6 overflow-x-hidden">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Before You Visit</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 lg:col-span-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="h-4 w-full max-w-[300px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[100px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="space-y-6 overflow-x-hidden">
      <SEO
        title="Before You Visit"
        description="Essential information and guides for your visit to Dzaleka."
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Before You Visit</h2>
          <p className="break-words text-muted-foreground">
            Essential information and guides for your visit to Dzaleka.
          </p>
        </div>
        <div className="flex items-center w-full md:w-auto">
          <Card className="bg-primary/5 border-primary/20 w-full md:w-auto">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Your Progress
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{progress}%</span>
                  <span className="text-xs text-muted-foreground">read</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 md:col-span-2 lg:col-span-5">
          <Tabs defaultValue={categories[0]} className="space-y-4">
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <div className="flex w-max space-x-4 p-4">
                <TabsList>
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </ScrollArea>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                {modulesByCategory?.[category]?.map((module) => (
                  <Card key={module.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="flex min-w-0 flex-wrap items-center gap-2 break-words text-lg leading-tight sm:text-xl">
                            {module.title}
                            {resourceProgress[module.id] && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 whitespace-nowrap">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Read
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex min-w-0 items-center gap-2 break-words">
                            <Clock className="h-3 w-3" />
                            {module.estimatedMinutes} min read
                          </CardDescription>
                        </div>
                        {resourceProgress[module.id] ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground w-full sm:w-auto"
                            disabled
                          >
                            Completed
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto shrink-0"
                            onClick={() => markAsRead(module.id)}
                            disabled={markAsReadMutation.isPending && markAsReadMutation.variables === module.id}
                          >
                            {markAsReadMutation.isPending && markAsReadMutation.variables === module.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving…
                              </>
                            ) : (
                              "Mark as Read"
                            )}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 sm:p-6">
                      <div className="prose prose-sm max-w-none break-words text-muted-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {module.description}
                        </ReactMarkdown>
                      </div>

                      {module.content && (
                        <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                          <div className="prose prose-sm max-w-none break-words">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {module.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {module.externalUrl && (
                        <div className="flex items-center gap-2 pt-4">
                          <Button asChild variant="ghost" className="h-auto min-h-10 max-w-full px-0 text-primary hover:underline">
                            <a
                              href={module.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex min-w-0 items-center gap-1 break-words"
                            >
                              Read full article <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="col-span-1 md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Respect Privacy</p>
                  <p className="text-xs text-muted-foreground">
                    Always ask before taking photos. Many residents have sensitive backgrounds.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Dress Code</p>
                  <p className="text-xs text-muted-foreground">
                    Please dress modestly. Shoulders and knees should generally be covered.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-xs text-muted-foreground">
                    English, Swahili, and French are commonly spoken. A simple "Jambo" (Hello) goes a long way!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Why Learn?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Understanding the context, history, and culture of Dzaleka before your visit deepens your connection with the community and ensures a respectful, meaningful experience for everyone.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
