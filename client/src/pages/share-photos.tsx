import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, ExternalLink, Image as ImageIcon, UploadCloud } from "lucide-react";
import { SEO } from "@/components/seo";

export default function SharePhotos() {
    return (
        <div className="space-y-6">
            <SEO
                title="Share Your Photos"
                description="Share your Dzaleka tour photos with us. Help us tell the story of our community."
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Share Your Experience</h1>
                <p className="text-muted-foreground">
                    Capture the moment? Help us tell the story of Dzaleka.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="flex flex-col md:flex-row items-center gap-6 p-8 text-center md:text-left">
                        <div className="flex bg-background p-4 rounded-full shadow-sm shrink-0">
                            <Camera className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <h2 className="text-2xl font-bold tracking-tight">Got Photos?</h2>
                            <p className="text-muted-foreground text-lg">
                                Your perspective matters. If you took photos during your visit, we invite you to share them with the Dzaleka Online community.
                            </p>
                            <div className="pt-2">
                                <Button size="lg" className="rounded-full font-semibold shadow-lg hover:scale-105 transition-transform" asChild>
                                    <a href="https://services.dzaleka.com/photos/submit/" target="_blank" rel="noopener noreferrer">
                                        <UploadCloud className="mr-2 h-5 w-5" />
                                        Submit Your Photos
                                        <ExternalLink className="ml-2 h-4 w-4 opacity-70" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            Why Share?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            <strong>Support the Narrative:</strong> Help shift the narrative by sharing authentic glimpses of daily life, innovation, and resilience in Dzaleka.
                        </p>
                        <p>
                            <strong>Community Archive:</strong> Your photos contribute to our community archive, preserving memories and documenting our growth.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            How it works
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            Clicking the button will open our secure photo submission portal. You can upload multiple images at once directly from your phone or camera.
                        </p>
                        <p>
                            Please ensure you have consent from anyone clearly visible in your photos before sharing.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
