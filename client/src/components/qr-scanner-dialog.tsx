import { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanLine, Camera, X, Loader2 } from "lucide-react";

interface QRScannerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (result: string) => void;
    title?: string;
    description?: string;
}

export function QRScannerDialog({
    open,
    onOpenChange,
    onScan,
    title = "Scan QR Code",
    description = "Point your camera at the visitor's QR code to check them in.",
}: QRScannerDialogProps) {
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && containerRef.current) {
            startScanner();
        }

        return () => {
            stopScanner();
        };
    }, [open]);

    const startScanner = async () => {
        if (!containerRef.current) return;

        setIsStarting(true);
        setError(null);

        try {
            const scanner = new Html5Qrcode("qr-reader", {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                verbose: false,
            });
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // Success - got a QR code
                    stopScanner();
                    onScan(decodedText);
                    onOpenChange(false);
                },
                () => {
                    // QR code not found - this is called continuously, ignore
                }
            );
        } catch (err: any) {
            console.error("QR Scanner error:", err);
            if (err.toString().includes("NotAllowedError")) {
                setError("Camera permission denied. Please allow camera access.");
            } else if (err.toString().includes("NotFoundError")) {
                setError("No camera found on this device.");
            } else {
                setError("Failed to start camera. Please try again.");
            }
        } finally {
            setIsStarting(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (err) {
                // Ignore stop errors
            }
        }
    };

    const handleClose = () => {
        stopScanner();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScanLine className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4">
                    {/* Scanner container */}
                    <div
                        ref={containerRef}
                        className="relative w-full max-w-[300px] aspect-square bg-black rounded-lg overflow-hidden"
                    >
                        <div id="qr-reader" className="w-full h-full" />

                        {isStarting && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                <div className="flex flex-col items-center gap-2 text-white">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-sm">Starting camera...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <Camera className="h-10 w-10 text-red-400" />
                                    <p className="text-sm text-white">{error}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startScanner()}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Position the QR code within the frame
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// QR Code Display Component
interface QRCodeDisplayProps {
    value: string;
    size?: number;
    className?: string;
}

export function QRCodeDisplay({ value, size = 150, className }: QRCodeDisplayProps) {
    return (
        <div className={`flex flex-col items-center gap-2 ${className}`}>
            <div className="p-3 bg-white rounded-lg shadow-sm border">
                <QRCodeSVG
                    value={value}
                    size={size}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                />
            </div>
            <p className="text-xs text-muted-foreground font-mono">{value}</p>
        </div>
    );
}
