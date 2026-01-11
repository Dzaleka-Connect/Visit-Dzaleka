import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
    path: string;
    component: React.ComponentType<any>;
    allowedRoles?: ("admin" | "coordinator" | "guide" | "visitor")[];
};

export function ProtectedRoute({
    path,
    component: Component,
    allowedRoles,
}: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Route path={path}>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-border" />
                </div>
            </Route>
        );
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role as any))) {
        return (
            <Route path={path}>
                <Redirect to="/unauthorized" />
            </Route>
        );
    }

    return <Route path={path} component={Component} />;
}
