import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const acceptInviteSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>;

export default function AcceptInvite() {
    const [, setLocation] = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "accepted">("loading");
    const { toast } = useToast();

    const form = useForm<AcceptInviteForm>({
        resolver: zodResolver(acceptInviteSchema),
        defaultValues: { firstName: "", lastName: "", password: "", confirmPassword: "" },
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get("token");

        if (!tokenParam) {
            setStatus("invalid");
            return;
        }

        setToken(tokenParam);
        // For now, we assume the token is valid and let the server validate on submit
        setStatus("valid");
    }, []);

    const acceptInviteMutation = useMutation({
        mutationFn: async (data: AcceptInviteForm) => {
            const response = await apiRequest("POST", "/api/auth/accept-invite", {
                token,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
            });
            return response.json();
        },
        onSuccess: (user) => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({
                title: "Welcome!",
                description: `Your account has been created. Welcome, ${user.firstName}!`,
            });
            setLocation("/");
        },
        onError: (error: Error) => {
            const message = error.message || "Failed to accept invitation";
            if (message.includes("expired")) {
                setStatus("expired");
            } else if (message.includes("already")) {
                setStatus("accepted");
            } else {
                toast({
                    title: "Error",
                    description: message,
                    variant: "destructive",
                });
            }
        },
    });

    const onSubmit = (data: AcceptInviteForm) => {
        acceptInviteMutation.mutate(data);
    };

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Verifying invitation...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === "invalid") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center py-12 text-center">
                        <XCircle className="h-12 w-12 text-destructive mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
                        <p className="text-muted-foreground mb-6">
                            This invitation link is invalid. Please check the link or contact an administrator.
                        </p>
                        <Button onClick={() => setLocation("/auth")}>Go to Sign In</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === "expired") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center py-12 text-center">
                        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
                        <p className="text-muted-foreground mb-6">
                            This invitation has expired. Please contact an administrator to request a new invitation.
                        </p>
                        <Button onClick={() => setLocation("/auth")}>Go to Sign In</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === "accepted") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center py-12 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Invitation Already Used</h2>
                        <p className="text-muted-foreground mb-6">
                            This invitation has already been accepted. You can sign in with your credentials.
                        </p>
                        <Button onClick={() => setLocation("/auth")}>Go to Sign In</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to Visit Dzaleka</CardTitle>
                    <CardDescription>
                        Complete your registration to accept the invitation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Create a password"
                                                    {...field}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={acceptInviteMutation.isPending}
                            >
                                {acceptInviteMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
