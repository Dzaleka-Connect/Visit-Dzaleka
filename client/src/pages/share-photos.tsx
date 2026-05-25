import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ExternalLink, UploadCloud } from "lucide-react";
import { SEO } from "@/components/seo";

export default function SharePhotos() {
    useEffect(() => {
        window.location.href = "https://services.dzaleka.com/photos/submit/";
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-4">
            <SEO
                title="Redirecting to Photo Portal"
                description="Redirecting to the Dzaleka Online photo portal to share tour photos."
            />
            <div className="flex bg-primary/10 p-4 rounded-full shadow-sm">
                <Camera className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Redirecting to Photo Portal…</h1>
            <p className="text-muted-foreground max-w-md text-sm">
                You are being redirected to the Dzaleka Online photo submission portal where consent and upload requirements are managed.
            </p>
            <Button size="lg" className="rounded-full font-semibold" asChild>
                <a href="https://services.dzaleka.com/photos/submit/" rel="noopener noreferrer">
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Open Photo Portal
                    <ExternalLink className="ml-2 h-4 w-4 opacity-70" />
                </a>
            </Button>
        </div>
    );
}
