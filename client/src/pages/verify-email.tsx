import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/seo";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("no-token");
      setMessage("No verification token provided.");
      return;
    }

    // Verify the email token
    const verifyEmail = async () => {
      try {
        const response = await apiRequest("POST", "/api/auth/verify-email", { token });
        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          const data = await response.json();
          setStatus("error");
          setMessage(data.message || "Failed to verify email. The token may be invalid or expired.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while verifying your email. Please try again.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <SEO
        title="Verify Email"
        description="Verify your Visit Dzaleka account email address."
      />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center bg-green-100">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" ? "Verifying your email address..." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-green-600" />
              <p className="text-muted-foreground">Please wait while we verify your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <div>
                <p className="text-lg font-semibold text-green-700">{message}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  You can now sign in to your account.
                </p>
              </div>
              <Button
                onClick={() => setLocation("/auth")}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                Sign In
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <div>
                <p className="text-lg font-semibold text-red-600">{message}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please contact support if this issue persists.
                </p>
              </div>
              <Button
                onClick={() => setLocation("/auth")}
                variant="outline"
                className="mt-4"
              >
                Go to Sign In
              </Button>
            </div>
          )}

          {status === "no-token" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-16 w-16 text-amber-500" />
              <div>
                <p className="text-lg font-semibold text-amber-600">{message}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please check your email for the verification link.
                </p>
              </div>
              <Button
                onClick={() => setLocation("/auth")}
                variant="outline"
                className="mt-4"
              >
                Go to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
