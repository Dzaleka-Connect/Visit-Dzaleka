import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

export default function VisitorResourcesPage() {
  const { toast } = useToast();
  // We'll use local storage to track "read" status for visitors since there's no backend table for it
  const [readModules, setReadModules] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("visitor_read_modules");
    return saved ? JSON.parse(saved) : {};
  });

  const { data: modules, isLoading } = useQuery<TrainingModule[]>({
    queryKey: ["/api/visitor-resources"],
  });

  const markAsRead = (moduleId: string) => {
    const newReadState = { ...readModules, [moduleId]: true };
    setReadModules(newReadState);
    localStorage.setItem("visitor_read_modules", JSON.stringify(newReadState));
    toast({
      title: "Marked as read",
      description: "Progress saved locally.",
    });
  };

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
    const readCount = Object.keys(readModules).filter((id) =>
      modules.some((m) => m.id === id)
    ).length;
    return Math.round((readCount / modules.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Visitor Resources</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 lg:col-span-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Learning Center</h2>
          <p className="text-muted-foreground">
            Essential information and guides for your visit to Dzaleka.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Your Progress
                </p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold">{progress}%</span>
                  <span className="text-xs text-muted-foreground">read</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-5">
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
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {module.title}
                            {readModules[module.id] && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Read
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {module.estimatedMinutes} min read
                          </CardDescription>
                        </div>
                        {readModules[module.id] ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            disabled
                          >
                            Completed
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(module.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        {module.description}
                      </div>
                      
                      {module.content && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                          {module.content}
                        </div>
                      )}

                      {module.externalUrl && (
                        <div className="pt-4 flex items-center gap-2">
                          <Button asChild variant="link" className="px-0 h-auto">
                            <a
                              href={module.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
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

        <div className="col-span-4 lg:col-span-2 space-y-4">
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
