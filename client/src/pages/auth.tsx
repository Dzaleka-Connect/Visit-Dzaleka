import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEO } from "@/components/seo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (mode === "login") {
      loginForm.reset();
      setShowPassword(false);
    } else if (mode === "register") {
      registerForm.reset();
      setShowPassword(false);
    } else if (mode === "forgot-password") {
      forgotPasswordForm.reset();
    }
  }, [mode]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.firstName} ${user.lastName}`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword: _, ...registerData } = data;
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      return response.json();
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Account created!",
        description: `Welcome, ${user.firstName}! Your account has been created successfully.`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Check your email",
        description: "If an account exists with that email, we've sent password reset instructions.",
      });
      setMode("login");
    },
    onError: () => {
      toast({
        title: "Check your email",
        description: "If an account exists with that email, we've sent password reset instructions.",
      });
      setMode("login");
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const onForgotPasswordSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SEO
        title="Sign In"
        description="Sign in to your Visit Dzaleka account to manage tour bookings and access the dashboard."
      />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="https://services.dzaleka.com/images/dzaleka-digital-heritage.png"
              alt="Dzaleka Digital Heritage Logo"
              className="h-16 w-auto mix-blend-multiply dark:mix-blend-normal dark:invert dark:brightness-0 dark:contrast-200"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Visit Dzaleka</h1>
          <p className="text-muted-foreground mt-2">Visitor Management System</p>
        </div>

        <Card>
          {mode === "login" && (
            <>
              <CardHeader>
                <CardTitle data-testid="text-auth-title">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access the dashboard
                </CardDescription>
              </CardHeader>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              autoComplete="email"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <button
                              type="button"
                              onClick={() => setMode("forgot-password")}
                              className="text-xs text-primary hover:underline"
                              data-testid="link-forgot-password"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                data-testid="input-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("register")}
                        className="text-primary hover:underline font-medium"
                        data-testid="link-register"
                      >
                        Create one
                      </button>
                    </p>
                  </CardFooter>
                </form>
              </Form>
            </>
          )}

          {mode === "register" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMode("login")}
                    data-testid="button-back-to-login"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle data-testid="text-auth-title">Create Account</CardTitle>
                    <CardDescription>
                      Register as a visitor to book tours
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John"
                                autoComplete="given-name"
                                data-testid="input-first-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Doe"
                                autoComplete="family-name"
                                data-testid="input-last-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="email"
                              placeholder="you@example.com"
                              autoComplete="email"
                              data-testid="input-register-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                data-testid="input-register-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-register-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              autoComplete="new-password"
                              data-testid="input-confirm-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-primary hover:underline font-medium"
                        data-testid="link-login"
                      >
                        Sign in
                      </button>
                    </p>
                  </CardFooter>
                </form>
              </Form>
            </>
          )}

          {mode === "forgot-password" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMode("login")}
                    data-testid="button-back-to-login-from-forgot"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle data-testid="text-auth-title">Reset Password</CardTitle>
                    <CardDescription>
                      Enter your email to receive reset instructions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="pl-10"
                                data-testid="input-forgot-email"
                                {...field}
                              />
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={forgotPasswordMutation.isPending}
                      data-testid="button-send-reset"
                    >
                      {forgotPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Instructions"
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Remember your password?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-primary hover:underline font-medium"
                        data-testid="link-back-to-login"
                      >
                        Sign in
                      </button>
                    </p>
                  </CardFooter>
                </form>
              </Form>
            </>
          )}
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to the Visit Dzaleka{" "}
          <a
            href="https://services.dzaleka.com/terms/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            data-testid="link-terms"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="https://services.dzaleka.com/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            data-testid="link-privacy"
          >
            Privacy Policy
          </a>.
        </p>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Want to book a visit?{" "}
          <a
            href="https://services.dzaleka.com/visit/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            data-testid="link-book-visit"
          >
            Book here
          </a>
        </p>

        <div className="mt-8 pt-6 border-t border-border/40 text-center">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Code of Practice</h3>
          <p className="text-[10px] text-muted-foreground leading-relaxed px-4">
            Information technology resources are essential for accomplishing Dzaleka Online Services's mission.
            Members and users of the Visit Dzaleka community are granted shared access to these resources on
            condition they are used in accordance with the organisation's Information Technology Code of Practice.
            This Code of Practice applies irrespective of where the technology resources are accessed and used,
            and includes use at home. You can expect sanctions if you act irresponsibly and disregard your
            obligations under the <a href="https://services.dzaleka.com/terms/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms and Conditions</a>. It is your responsibility to become familiar with the <a href="https://services.dzaleka.com/terms/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms and Conditions</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
