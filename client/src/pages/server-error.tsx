import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { SEO } from "@/components/seo";

interface ServerErrorProps {
  error?: Error;
  resetError?: () => void;
}

export default function ServerError({ error, resetError }: ServerErrorProps) {
  const [, setLocation] = useLocation();

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <SEO
        title="500 - Server Error"
        description="Something went wrong on our end."
      />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700">500 - Server Error</CardTitle>
          <CardDescription>
            Something went wrong on our end
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-muted-foreground">
            <p>We're sorry, but something unexpected happened.</p>
            <p className="mt-2 text-sm">Our team has been notified and is working on it.</p>
          </div>

          {error && process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
              <p className="text-xs font-mono text-red-600 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            If this problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
