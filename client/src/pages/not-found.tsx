import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { SEO } from "@/components/seo";

export default function NotFound() {

  return (
    <div className="min-h-[70dvh] w-full flex items-center justify-center bg-background p-4">
      <SEO
        title="404 - Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        robots="noindex"
      />
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <CardDescription className="text-lg mt-2">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
