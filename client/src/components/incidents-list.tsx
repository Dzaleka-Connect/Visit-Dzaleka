import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { Incident } from "@shared/schema";
import { formatDate } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export function IncidentsList() {
    const { data: incidents, isLoading } = useQuery<Incident[]>({
        queryKey: ["/api/incidents"],
    });

    if (isLoading) {
        return <Skeleton className="h-[100px] w-full" />;
    }

    if (!incidents || incidents.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground text-sm">
                No reports submitted yet.
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'reported': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'investigating': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-3">
            {incidents.map((incident) => (
                <div key={incident.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-1">
                        {incident.status === 'resolved' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{incident.title}</h4>
                            <Badge variant="secondary" className={getStatusColor(incident.status || 'reported')}>
                                {incident.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {incident.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Reported on {incident.createdAt ? formatDate(incident.createdAt) : "Unknown"}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
