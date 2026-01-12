import QRCode from 'qrcode';

/**
 * Generates a QR code as a data URL suitable for embedding in PDFs or images.
 * @param text - The text to encode in the QR code
 * @param size - The size of the QR code in pixels (default 150)
 * @returns A promise that resolves to a data URL string
 */
export async function generateQRCodeDataURL(text: string, size: number = 150): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(text, {
            width: size,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
        });
        return dataUrl;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw error;
    }
}
