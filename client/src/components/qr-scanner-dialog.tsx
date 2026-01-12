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
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (open) {
            // Wait for dialog to be fully rendered before starting scanner
            const timeout = setTimeout(() => {
                if (mountedRef.current) {
                    requestCameraPermission();
                }
            }, 300);
            return () => clearTimeout(timeout);
        } else {
            stopScanner();
        }
    }, [open]);

    const requestCameraPermission = async () => {
        setIsStarting(true);
        setError(null);

        try {
            // First, check if we can get camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop());

            setHasPermission(true);

            // Small delay to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 100));

            if (mountedRef.current) {
                await startScanner();
            }
        } catch (err: any) {
            console.error("Camera permission error:", err);
            setHasPermission(false);

            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Camera permission denied. Please allow camera access in your browser settings.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setError("No camera found on this device.");
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                setError("Camera is already in use by another application.");
            } else if (err.name === "OverconstrainedError") {
                setError("Camera constraints not supported.");
            } else if (err.name === "AbortError") {
                setError("Camera access was aborted. Please try again.");
            } else {
                setError(`Camera error: ${err.message || "Unknown error occurred."}`);
            }
        } finally {
            if (mountedRef.current) {
                setIsStarting(false);
            }
        }
    };

    const startScanner = async () => {
        const readerElement = document.getElementById("qr-reader");
        if (!readerElement) {
            setError("Scanner container not found. Please try again.");
            return;
        }

        try {
            // Clear any existing content in the reader element
            readerElement.innerHTML = "";

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
            console.error("QR Scanner start error:", err);
            setError("Failed to start QR scanner. Please try again.");
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) { // SCANNING state
                    await scannerRef.current.stop();
                }
            } catch (err) {
                // Ignore stop errors
            } finally {
                scannerRef.current = null;
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
