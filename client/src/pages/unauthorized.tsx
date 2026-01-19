import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/seo";

export default function Unauthorized() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
            <SEO
                title="Unauthorized Access"
                description="You don't have permission to access this page."
                robots="noindex"
            />

            <Card className="w-full max-w-md text-center">
                <CardHeader className="pb-4">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription className="text-base">
                        You don't have permission to access this page.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {user ? (
                        <>
                            <p className="text-sm text-muted-foreground">
                                You're logged in as <span className="font-medium">{user.email}</span> with role <span className="font-medium capitalize">{user.role}</span>.
                                This page requires higher permissions.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button asChild variant="outline">
                                    <Link href="/">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Go to Dashboard
                                    </Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/">
                                        Back to Home
                                    </Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Please log in to access this page.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button asChild>
                                    <Link href="/login">
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Log In
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Home
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
