import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import {
  Award,
  CalendarDays,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Palette,
  PenLine,
  UserRound,
} from "lucide-react";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Guide } from "@shared/schema";

const defaultLogoUrl = "/favicon.png";

const certificateThemes = {
  earth: {
    label: "Dzaleka Earth",
    primary: "#7C4A2D",
    accent: "#C4841D",
    soft: "#FBF0E1",
  },
  sunset: {
    label: "Sunset Warmth",
    primary: "#8B3A3A",
    accent: "#D4943A",
    soft: "#FDF2E9",
  },
  lake: {
    label: "Lake Green",
    primary: "#3D6B4F",
    accent: "#B8860B",
    soft: "#EEF5E8",
  },
} as const;

const certificateLayouts = {
  official: {
    label: "Dzaleka record",
    description: "Clean document with a warm side accent and organic details.",
  },
  classic: {
    label: "Kanga border",
    description: "Warm certificate framed with a hand-drawn geometric border inspired by East African textile patterns.",
  },
  community: {
    label: "Ubuntu spirit",
    description: "Simple, centered recognition of community contribution.",
  },
} as const;

type CertificateTheme = keyof typeof certificateThemes;
type CertificateLayout = keyof typeof certificateLayouts;

function fullGuideName(guide?: Guide) {
  if (!guide) return "";
  return `${guide.firstName || ""} ${guide.lastName || ""}`.trim();
}

function splitHex(hex: string) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ] as const;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlFormat(dataUrl: string) {
  return dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg") ? "JPEG" : "PNG";
}

function truncatePdfText(doc: jsPDF, value: string, maxWidth: number) {
  const cleanValue = value.trim();
  if (!cleanValue || doc.getTextWidth(cleanValue) <= maxWidth) return cleanValue;
  let result = cleanValue;
  while (result.length > 1 && doc.getTextWidth(`${result}…`) > maxWidth) {
    result = result.slice(0, -1).trimEnd();
  }
  return `${result}…`;
}

function splitPdfText(doc: jsPDF, value: string, maxWidth: number, maxLines: number) {
  const cleanValue = value.trim();
  if (!cleanValue) return [];
  const lines = doc.splitTextToSize(cleanValue, maxWidth) as string[];
  if (lines.length <= maxLines) return lines;
  const visibleLines = lines.slice(0, maxLines);
  visibleLines[maxLines - 1] = truncatePdfText(doc, visibleLines[maxLines - 1], maxWidth);
  return visibleLines;
}

export default function GuideCertificates() {
  const { toast } = useToast();
  const { data: guides = [], isLoading } = useQuery<Guide[]>({
    queryKey: ["/api/guides"],
  });
  const activeGuides = useMemo(() => guides.filter((guide) => guide.isActive !== false), [guides]);
  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [certificateTitle, setCertificateTitle] = useState("Certificate of Appreciation");
  const [subtitle, setSubtitle] = useState("Presented to");
  const [body, setBody] = useState(
    "For guiding visitors with care, local knowledge, and respect for the dignity, safety, and stories of Dzaleka residents."
  );
  const [completionLabel, setCompletionLabel] = useState("Guide Training & Visitor Care");
  const [issuedDate, setIssuedDate] = useState(todayIsoDate());
  const [issuedBy, setIssuedBy] = useState("Bakari Mustafa");
  const [issuerTitle, setIssuerTitle] = useState("Founder, Visit Dzaleka");
  const [certificateId, setCertificateId] = useState(`VD-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`);
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<CertificateTheme>("earth");
  const [layout, setLayout] = useState<CertificateLayout>("official");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipientError, setRecipientError] = useState(false);

  const selectedGuide = activeGuides.find((guide) => guide.id === selectedGuideId);
  const themeConfig = certificateThemes[theme];
  const layoutConfig = certificateLayouts[layout];
  const canExport = recipientName.trim().length > 0;
  const signatureStatus = signatureDataUrl ? "Signature uploaded" : "Signature not uploaded";
  const logoStatus = logoUrl.trim() ? "Logo set" : "Logo fallback";

  useEffect(() => {
    if (selectedGuide) {
      setRecipientName(fullGuideName(selectedGuide));
      setRecipientError(false);
    }
  }, [selectedGuide]);

  const generatePdf = async () => {
    if (!recipientName.trim()) {
      setRecipientError(true);
      const recipientInput = document.getElementById("recipient");
      if (recipientInput) {
        recipientInput.focus();
      }
      toast({
        title: "Recipient needed",
        description: "Choose a guide or enter a certificate recipient name.",
        variant: "destructive",
      });
      return;
    }
    setRecipientError(false);

    setIsGenerating(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = 297;
      const pageHeight = 210;
      const [primaryR, primaryG, primaryB] = splitHex(themeConfig.primary);
      const [accentR, accentG, accentB] = splitHex(themeConfig.accent);
      const [softR, softG, softB] = splitHex(themeConfig.soft);
      const cardX = 24;
      const cardY = 16;
      const cardWidth = 249;
      const cardHeight = 178;

      const logoDataUrl = logoUrl ? await imageToDataUrl(logoUrl) : null;
      const titleText = certificateTitle.trim() || "Certificate";
      const subtitleText = subtitle.trim() || "Presented to";
      const recipientText = recipientName.trim();
      const issuerText = issuedBy.trim() || "Bakari Mustafa";
      const issuerTitleText = issuerTitle.trim() || "Founder, Visit Dzaleka";
      const certificateIdText = certificateId.trim();

      // Dynamic recipient name font size
      let recipientFontSize = 30;
      if (recipientText.length > 35) {
        recipientFontSize = 16;
      } else if (recipientText.length > 28) {
        recipientFontSize = 20;
      } else if (recipientText.length > 18) {
        recipientFontSize = 24;
      }

      // Dynamic body text font size
      let bodyFontSize = 11;
      if (body.length > 320) {
        bodyFontSize = 8.0;
      } else if (body.length > 250) {
        bodyFontSize = 8.8;
      } else if (body.length > 180) {
        bodyFontSize = 9.6;
      } else if (body.length > 110) {
        bodyFontSize = 10.2;
      }

      // Set temporarily to split text accurately
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodyFontSize);
      const bodyLines = splitPdfText(doc, body, 175, 5);

      const recognitionText = truncatePdfText(doc, completionLabel.trim(), 86);

      const getCenteredBaselineY = (topY: number, bottomY: number, linesCount: number, fontSize: number, lineHeight: number = 1.35) => {
        const charHeight = fontSize * 0.3527; // pt to mm
        const textHeight = (linesCount - 1) * (charHeight * lineHeight) + charHeight;
        const spaceHeight = bottomY - topY;
        return topY + (spaceHeight - textHeight) / 2 + charHeight;
      };


      const drawLogo = (x: number, y: number, size: number, shape: "circle" | "square" = "square") => {
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, dataUrlFormat(logoDataUrl), x, y, size, size);
          return;
        }
        doc.setFillColor(primaryR, primaryG, primaryB);
        if (shape === "circle") {
          doc.circle(x + size / 2, y + size / 2, size / 2, "F");
        } else {
          doc.roundedRect(x, y, size, size, 3, 3, "F");
        }
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(Math.max(7, size * 0.42));
        doc.text("VD", x + size / 2, y + size / 2 + size * 0.14, { align: "center" });
      };

      const drawSignatureBlock = (lineY: number, textY: number, labelY: number, signatureImageY?: number) => {
        if (signatureDataUrl && signatureImageY) {
          doc.addImage(signatureDataUrl, dataUrlFormat(signatureDataUrl), 190, signatureImageY, 44, 10);
        }
        doc.setDrawColor(148, 163, 184);
        doc.line(51, lineY, 117, lineY);
        doc.line(181, lineY, 247, lineY);
        doc.setTextColor(75, 85, 99);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(issuedDate || todayIsoDate(), 84, textY, { align: "center" });
        doc.text(truncatePdfText(doc, issuerText, 62), 214, textY, { align: "center" });
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("DATE", 84, labelY, { align: "center" });
        doc.text(truncatePdfText(doc, issuerTitleText, 62), 214, labelY, { align: "center" });
      };

      const drawZigzagBand = (startX: number, endX: number, y: number, height: number, segments: number) => {
        const segWidth = (endX - startX) / segments;
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(0.6);
        for (let i = 0; i < segments; i++) {
          const x = startX + i * segWidth;
          doc.line(x, y + height, x + segWidth / 2, y);
          doc.line(x + segWidth / 2, y, x + segWidth, y + height);
        }
      };

      const drawOrganicUnderline = (startX: number, endX: number, y: number) => {
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(0.8);
        const midX = (startX + endX) / 2;
        doc.line(startX, y, midX + 5, y - 0.2);
        doc.line(midX - 5, y + 0.3, endX, y);
      };

      const drawCornerDots = (x: number, y: number, w: number, h: number, margin: number) => {
        doc.setFillColor(accentR, accentG, accentB);
        doc.circle(x + margin, y + margin, 1.5, "F");
        doc.circle(x + w - margin, y + margin, 1.5, "F");
        doc.circle(x + margin, y + h - margin, 1.5, "F");
        doc.circle(x + w - margin, y + h - margin, 1.5, "F");
      };

      if (layout === "classic") {
        doc.setFillColor(255, 250, 243); // Warm cream/parchment background
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setDrawColor(primaryR, primaryG, primaryB);
        doc.setLineWidth(1.2);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(0.4);
        doc.rect(21, 21, pageWidth - 42, pageHeight - 42);
        
        drawZigzagBand(23, pageWidth - 23, 23, 4, 26);
        drawZigzagBand(23, pageWidth - 23, pageHeight - 27, 4, 26);
        
        drawLogo(pageWidth / 2 - 10, 32, 20, "circle");

        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(truncatePdfText(doc, titleText, 205), pageWidth / 2, 66, { align: "center" });
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(truncatePdfText(doc, subtitleText, 120), pageWidth / 2, 80, { align: "center" });
        doc.setTextColor(17, 24, 39);
        doc.setFont("times", "bolditalic");
        doc.setFontSize(recipientFontSize);
        doc.text(truncatePdfText(doc, recipientText, 220), pageWidth / 2, 98, { align: "center" });
        
        drawOrganicUnderline(88, 209, 102);
        
        const classicBodyY = 110;
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(bodyFontSize);
        doc.text(bodyLines, pageWidth / 2, classicBodyY, { align: "center", lineHeightFactor: 1.35 });
        const classicBodyBottom = classicBodyY + (bodyLines.length - 1) * (bodyFontSize * 0.3527 * 1.35);
        
        const classicBadgeY = classicBodyBottom + 9;
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("times", "italic");
        doc.setFontSize(11);
        doc.text(`◆  ${recognitionText}  ◆`, pageWidth / 2, classicBadgeY, { align: "center" });
        
        const classicSigLineY = Math.max(classicBadgeY + 14, 163);
        drawSignatureBlock(classicSigLineY, classicSigLineY + 7, classicSigLineY + 12, classicSigLineY - 13);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Certificate ID: ${truncatePdfText(doc, certificateIdText, 68)}`, pageWidth - 27, 33, { align: "right" });
      } else if (layout === "community") {
        doc.setFillColor(255, 250, 243);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setFillColor(softR, softG, softB);
        doc.roundedRect(14, 14, pageWidth - 28, 182, 5, 5, "F");
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(25, 25, pageWidth - 50, 162, 4, 4, "F");
        
        drawCornerDots(25, 25, pageWidth - 50, 162, 4);
        
        doc.setFillColor(primaryR, primaryG, primaryB);
        doc.rect(25, 25, pageWidth - 50, 21, "F");
        doc.setFillColor(accentR, accentG, accentB);
        doc.rect(25, 46, pageWidth - 50, 2, "F");
        drawLogo(36, 31, 14);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Visit Dzaleka", 55, 39);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(truncatePdfText(doc, certificateIdText, 78), pageWidth - 37, 39, { align: "right" });

        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(truncatePdfText(doc, titleText, 205), pageWidth / 2, 70, { align: "center" });
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(truncatePdfText(doc, subtitleText, 120), pageWidth / 2, 86, { align: "center" });
        doc.setTextColor(17, 24, 39);
        doc.setFont("times", "bolditalic");
        doc.setFontSize(recipientFontSize);
        doc.text(truncatePdfText(doc, recipientText, 185), pageWidth / 2, 102, { align: "center" });
        
        drawOrganicUnderline(pageWidth / 2 - 43, pageWidth / 2 + 43, 107);
        
        const communityBodyY = 115;
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(bodyFontSize);
        doc.text(bodyLines, pageWidth / 2, communityBodyY, { align: "center", lineHeightFactor: 1.35 });
        const communityBodyBottom = communityBodyY + (bodyLines.length - 1) * (bodyFontSize * 0.3527 * 1.35);
        
        const communityBadgeY = communityBodyBottom + 9;
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("times", "italic");
        doc.setFontSize(11);
        doc.text(`◆  ${recognitionText}  ◆`, pageWidth / 2, communityBadgeY, { align: "center" });
        
        const communitySigLineY = Math.max(communityBadgeY + 14, 166);
        drawSignatureBlock(communitySigLineY, communitySigLineY + 6.5, communitySigLineY + 10.5, communitySigLineY - 12);
      } else {
        doc.setFillColor(255, 250, 243);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setFillColor(accentR, accentG, accentB);
        doc.rect(0, 0, 14, pageHeight, "F");
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, "F");
        
        drawCornerDots(cardX, cardY, cardWidth, cardHeight, 6);
        
        doc.setDrawColor(softR, softG, softB);
        doc.setLineWidth(0.8);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4);
        
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(0.6);
        doc.line(cardX + 12, cardY + 36, cardX + cardWidth - 12, cardY + 36);
        drawLogo(cardX + 14, cardY + 10, 18);

        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Visit Dzaleka", cardX + 38, cardY + 16);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Guide certification record", cardX + 38, cardY + 23);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Certificate ID", cardX + cardWidth - 14, cardY + 15, { align: "right" });
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(truncatePdfText(doc, certificateIdText, 70), cardX + cardWidth - 14, cardY + 22, { align: "right" });
        
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(truncatePdfText(doc, titleText, 205), pageWidth / 2, 78, { align: "center" });
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.text(truncatePdfText(doc, subtitleText, 120), pageWidth / 2, 92, { align: "center" });
        doc.setTextColor(17, 24, 39);
        doc.setFont("times", "bolditalic");
        doc.setFontSize(recipientFontSize);
        doc.text(truncatePdfText(doc, recipientText, 185), pageWidth / 2, 108, { align: "center" });
        
        drawOrganicUnderline(90, 207, 114);
        
        const officialBodyY = 122;
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(bodyFontSize);
        doc.text(bodyLines, pageWidth / 2, officialBodyY, { align: "center", lineHeightFactor: 1.35 });
        const officialBodyBottom = officialBodyY + (bodyLines.length - 1) * (bodyFontSize * 0.3527 * 1.35);
        
        const officialBadgeY = officialBodyBottom + 9;
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("times", "italic");
        doc.setFontSize(11);
        doc.text(`◆  ${recognitionText}  ◆`, pageWidth / 2, officialBadgeY, { align: "center" });
        
        const officialSigLineY = Math.max(officialBadgeY + 14, 163);
        drawSignatureBlock(officialSigLineY, officialSigLineY + 6.5, officialSigLineY + 11, officialSigLineY - 11);
      }

      const fileName = `${recipientName.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "guide"}-certificate.pdf`;
      doc.save(fileName);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recipientFontSizeCqw = recipientName.length > 35 ? "1.6cqw" : recipientName.length > 28 ? "2.0cqw" : recipientName.length > 18 ? "2.4cqw" : "3.0cqw";
  const bodyFontSizeCqw = body.length > 320 ? "0.95cqw" : body.length > 250 ? "1.05cqw" : body.length > 180 ? "1.15cqw" : body.length > 110 ? "1.25cqw" : "1.35cqw";

  return (
    <div className="space-y-6">
      <SEO
        title="Guide Certificates"
        description="Create and download Visit Dzaleka guide certificates."
      />

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Guide Certificates</h1>
                <Badge variant={canExport ? "secondary" : "outline"} className="gap-2">
                  <span className={`h-2 w-2 rounded-full ${canExport ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {canExport ? "Ready to export" : "Needs recipient"}
                </Badge>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Issue training, service, or recognition certificates with the correct Visit Dzaleka wording, issuer, logo, and signature.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Badge variant="outline" className="justify-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              {layoutConfig.label}
            </Badge>
            <Badge variant="outline" className="justify-center gap-2">
              <Palette className="h-3.5 w-3.5" />
              {themeConfig.label}
            </Badge>
            <Button onClick={generatePdf} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Certificate setup</CardTitle>
            <CardDescription>Keep the content short enough to fit on one landscape page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4" aria-labelledby="certificate-recipient">
              <div className="flex items-center gap-2 text-sm font-semibold" id="certificate-recipient">
                <UserRound className="h-4 w-4 text-primary" />
                Recipient
              </div>
              <div className="space-y-2">
                <Label htmlFor="guide">Guide record</Label>
                <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
                  <SelectTrigger id="guide">
                    <SelectValue placeholder="Select guide…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGuides.map((guide) => (
                      <SelectItem key={guide.id} value={guide.id}>{fullGuideName(guide)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient" className={recipientError ? "text-destructive" : ""}>Name on certificate</Label>
                <Input
                  id="recipient"
                  name="recipientName"
                  value={recipientName}
                  onChange={(event) => {
                    setRecipientName(event.target.value);
                    if (event.target.value.trim()) setRecipientError(false);
                  }}
                  placeholder="Guide name…"
                  className={`text-base ${recipientError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-invalid={recipientError}
                  aria-describedby={recipientError ? "recipient-error" : undefined}
                />
                {recipientError && (
                  <p id="recipient-error" className="text-xs font-medium text-destructive" role="alert">
                    Please choose a guide or enter a recipient name.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-4 border-t pt-5" aria-labelledby="certificate-wording">
              <div className="flex items-center gap-2 text-sm font-semibold" id="certificate-wording">
                <FileText className="h-4 w-4 text-primary" />
                Certificate text
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certificate-title">Title</Label>
                  <Input
                    id="certificate-title"
                    name="certificateTitle"
                    value={certificateTitle}
                    onChange={(event) => setCertificateTitle(event.target.value)}
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Recipient label</Label>
                  <Input
                    id="subtitle"
                    name="certificateSubtitle"
                    value={subtitle}
                    onChange={(event) => setSubtitle(event.target.value)}
                    className="text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Wording</Label>
                <Textarea
                  id="body"
                  name="certificateBody"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={4}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">Best fit: one or two direct sentences.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion-label">Recognition line</Label>
                <Input
                  id="completion-label"
                  name="completionLabel"
                  value={completionLabel}
                  onChange={(event) => setCompletionLabel(event.target.value)}
                  className="text-base"
                />
              </div>
            </section>

            <section className="space-y-4 border-t pt-5" aria-labelledby="certificate-issuer">
              <div className="flex items-center gap-2 text-sm font-semibold" id="certificate-issuer">
                <PenLine className="h-4 w-4 text-primary" />
                Issuer
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issued-date">Issued date</Label>
                  <Input
                    id="issued-date"
                    name="issuedDate"
                    type="date"
                    value={issuedDate}
                    onChange={(event) => setIssuedDate(event.target.value)}
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-id">Certificate ID</Label>
                  <Input
                    id="certificate-id"
                    name="certificateId"
                    value={certificateId}
                    onChange={(event) => setCertificateId(event.target.value)}
                    className="text-base tabular-nums"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issued-by">Issued by</Label>
                  <Input
                    id="issued-by"
                    name="issuedBy"
                    value={issuedBy}
                    onChange={(event) => setIssuedBy(event.target.value)}
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuer-title">Issuer title</Label>
                  <Input
                    id="issuer-title"
                    name="issuerTitle"
                    value={issuerTitle}
                    onChange={(event) => setIssuerTitle(event.target.value)}
                    className="text-base"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t pt-5" aria-labelledby="certificate-branding">
              <div className="flex items-center gap-2 text-sm font-semibold" id="certificate-branding">
                <ImageIcon className="h-4 w-4 text-primary" />
                Branding
              </div>

              <div className="space-y-2">
                <Label htmlFor="layout">Certificate layout</Label>
                <Select value={layout} onValueChange={(value) => setLayout(value as CertificateLayout)}>
                  <SelectTrigger id="layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(certificateLayouts).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{layoutConfig.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme">Color theme</Label>
                  <Select value={theme} onValueChange={(value) => setTheme(value as CertificateTheme)}>
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(certificateThemes).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signature-image">Signature image</Label>
                  <Input
                    id="signature-image"
                    name="signatureImage"
                    type="file"
                    accept="image/png,image/jpeg"
                    className="text-base"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await fileToDataUrl(file);
                      setSignatureDataUrl(dataUrl);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo path or URL</Label>
                <Input
                  id="logo-url"
                  name="logoUrl"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                  placeholder="/favicon.png or https://…"
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">Local app assets export more reliably than remote images.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{logoStatus}</Badge>
                <Badge variant="outline">{signatureStatus}</Badge>
              </div>
            </section>
          </CardContent>
        </Card>

        <Card className="overflow-hidden xl:sticky xl:top-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Document preview</CardTitle>
                <CardDescription>A4 landscape export with print-safe margins.</CardDescription>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {layoutConfig.label}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Palette className="h-3.5 w-3.5" />
                  {themeConfig.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-2">
              <div
                className="relative mx-auto aspect-[1.414/1] w-full min-w-[720px] max-w-5xl overflow-hidden rounded-lg border bg-slate-50 shadow-sm"
                style={{ color: themeConfig.primary, containerType: "inline-size" }}
              >
                {layout === "classic" ? (
                  <div className="absolute shadow-sm" style={{ backgroundColor: "#FFFAF3", top: "2.8cqw", bottom: "2.8cqw", left: "2.8cqw", right: "2.8cqw" }}>
                    <div className="absolute inset-0" style={{ border: "0.2cqw solid", borderColor: themeConfig.primary }} />
                    <div className="absolute" style={{ top: "1.4cqw", bottom: "1.4cqw", left: "1.4cqw", right: "1.4cqw", border: "0.08cqw solid", borderColor: themeConfig.accent }} />
                    
                    {/* Zigzag borders (simulated with SVG background) */}
                    <div 
                      className="absolute" 
                      style={{ 
                        left: "1.6cqw", right: "1.6cqw", top: "1.6cqw", height: "0.8cqw", 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpath d='M0 10 L10 0 L20 10' fill='none' stroke='${encodeURIComponent(themeConfig.accent)}' stroke-width='2'/%3E%3C/svg%3E")`,
                        backgroundSize: "auto 100%"
                      }} 
                    />
                    <div 
                      className="absolute" 
                      style={{ 
                        left: "1.6cqw", right: "1.6cqw", bottom: "1.6cqw", height: "0.8cqw", 
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpath d='M0 0 L10 10 L20 0' fill='none' stroke='${encodeURIComponent(themeConfig.accent)}' stroke-width='2'/%3E%3C/svg%3E")`,
                        backgroundSize: "auto 100%"
                      }} 
                    />

                    <div className="absolute text-center" style={{ left: "4.8cqw", right: "4.8cqw", top: "4cqw" }}>
                      <img
                        src={logoUrl || defaultLogoUrl}
                        alt="Visit Dzaleka logo"
                        className="mx-auto rounded-full object-contain"
                        style={{ height: "4.0cqw", width: "4.0cqw" }}
                      />
                      <div className="font-bold tracking-tight" style={{ fontSize: "2.4cqw", marginTop: "1.2cqw", color: themeConfig.primary }}>
                        {certificateTitle}
                      </div>
                      <div className="text-slate-500" style={{ fontSize: "1.2cqw", marginTop: "0.8cqw" }}>{subtitle}</div>
                      <div className="font-serif font-bold italic text-slate-900 truncate" style={{ fontSize: recipientFontSizeCqw, marginTop: "1.2cqw" }}>
                        {recipientName || "Guide Name"}
                      </div>
                      <div className="mx-auto relative" style={{ height: "0.3cqw", width: "20cqw", marginTop: "0.8cqw" }}>
                        <div className="absolute top-0 left-0 right-4" style={{ borderTop: "0.1cqw solid", borderColor: themeConfig.accent, transform: "rotate(-0.5deg)" }} />
                        <div className="absolute bottom-0 left-4 right-0" style={{ borderBottom: "0.1cqw solid", borderColor: themeConfig.accent, transform: "rotate(0.5deg)" }} />
                      </div>
                      <p className="mx-auto line-clamp-5 text-slate-600" style={{ fontSize: bodyFontSizeCqw, lineHeight: "1.35", marginTop: "1.2cqw", maxWidth: "80%" }}>{body}</p>
                      <div className="mx-auto font-serif italic truncate" style={{ fontSize: "1.2cqw", marginTop: "1.5cqw", color: themeConfig.primary, maxWidth: "60%" }}>
                        ◆ &nbsp;{completionLabel}&nbsp; ◆
                      </div>
                    </div>
                    <div className="absolute grid grid-cols-2 text-center text-slate-600" style={{ left: "6.4cqw", right: "6.4cqw", bottom: "3.2cqw", gap: "4.8cqw" }}>
                      <div>
                        <div className="border-slate-300" style={{ borderTopWidth: "0.08cqw", paddingTop: "0.6cqw", fontSize: "1.35cqw" }}>{issuedDate}</div>
                        <div className="uppercase tracking-wide text-slate-400 font-bold" style={{ fontSize: "1.0cqw", marginTop: "0.4cqw" }}>Date</div>
                      </div>
                      <div>
                        {signatureDataUrl && (
                          <img
                            src={signatureDataUrl}
                            alt="Issuer signature"
                            className="mx-auto object-contain"
                            style={{ height: "4.2cqw", maxWidth: "16cqw", marginBottom: "0.2cqw" }}
                          />
                        )}
                        <div className="truncate border-slate-300" style={{ borderTopWidth: "0.08cqw", paddingTop: "0.6cqw", fontSize: "1.35cqw" }}>{issuedBy}</div>
                        <div className="truncate uppercase tracking-wide text-slate-400 font-bold" style={{ fontSize: "1.0cqw", marginTop: "0.4cqw" }}>{issuerTitle}</div>
                      </div>
                    </div>
                    <div className="absolute truncate text-slate-500 tabular-nums" style={{ fontSize: "1.0cqw", top: "2.2cqw", right: "3.2cqw", maxWidth: "24cqw" }}>Certificate ID: {certificateId}</div>
                  </div>
                ) : layout === "community" ? (
                  <div className="absolute rounded-lg" style={{ backgroundColor: "#FFFAF3", top: "0", bottom: "0", left: "0", right: "0" }}>
                    <div className="absolute rounded-lg" style={{ backgroundColor: themeConfig.soft, top: "2.0cqw", bottom: "2.0cqw", left: "2.0cqw", right: "2.0cqw" }}>
                      <div className="absolute overflow-hidden rounded-lg shadow-sm" style={{ backgroundColor: "#FFFAF3", top: "2.8cqw", bottom: "2.8cqw", left: "2.8cqw", right: "2.8cqw" }}>
                        
                        {/* Corner dots */}
                        <div className="absolute rounded-full" style={{ width: "0.4cqw", height: "0.4cqw", top: "0.8cqw", left: "0.8cqw", backgroundColor: themeConfig.accent }} />
                        <div className="absolute rounded-full" style={{ width: "0.4cqw", height: "0.4cqw", top: "0.8cqw", right: "0.8cqw", backgroundColor: themeConfig.accent }} />
                        <div className="absolute rounded-full" style={{ width: "0.4cqw", height: "0.4cqw", bottom: "0.8cqw", left: "0.8cqw", backgroundColor: themeConfig.accent }} />
                        <div className="absolute rounded-full" style={{ width: "0.4cqw", height: "0.4cqw", bottom: "0.8cqw", right: "0.8cqw", backgroundColor: themeConfig.accent }} />

                        <div className="absolute inset-x-0 top-0" style={{ backgroundColor: themeConfig.primary, height: "5.6cqw" }} />
                        <div className="absolute inset-x-0" style={{ backgroundColor: themeConfig.accent, top: "5.6cqw", height: "0.4cqw" }} />
                        <div className="absolute flex min-w-0 items-center text-white" style={{ left: "2.4cqw", top: "1.0cqw", gap: "1.2cqw" }}>
                          <img
                            src={logoUrl || defaultLogoUrl}
                            alt="Visit Dzaleka logo"
                            className="rounded-md object-contain"
                            style={{ width: "3.6cqw", height: "3.6cqw", backgroundColor: "#FFFAF3" }}
                          />
                          <div className="min-w-0">
                            <div className="font-bold truncate" style={{ fontSize: "1.35cqw" }}>Visit Dzaleka</div>
                            <div className="opacity-80 truncate" style={{ fontSize: "1.0cqw" }}>{certificateId}</div>
                          </div>
                        </div>
                        <div className="absolute text-center" style={{ left: "4.8cqw", right: "4.8cqw", top: "8cqw" }}>
                          <div className="font-bold tracking-tight" style={{ fontSize: "2.4cqw", color: themeConfig.primary }}>
                            {certificateTitle}
                          </div>
                          <div className="text-slate-500" style={{ fontSize: "1.2cqw", marginTop: "0.8cqw" }}>{subtitle}</div>
                          <div className="font-serif font-bold italic text-slate-900 truncate" style={{ fontSize: recipientFontSizeCqw, marginTop: "1.0cqw" }}>
                            {recipientName || "Guide Name"}
                          </div>
                          <div className="mx-auto relative" style={{ height: "0.3cqw", width: "18cqw", marginTop: "0.8cqw" }}>
                            <div className="absolute top-0 left-0 right-4" style={{ borderTop: "0.1cqw solid", borderColor: themeConfig.accent, transform: "rotate(-0.5deg)" }} />
                            <div className="absolute bottom-0 left-4 right-0" style={{ borderBottom: "0.1cqw solid", borderColor: themeConfig.accent, transform: "rotate(0.5deg)" }} />
                          </div>
                          <p className="mx-auto line-clamp-5 text-slate-600" style={{ fontSize: bodyFontSizeCqw, lineHeight: "1.35", marginTop: "1.2cqw", maxWidth: "80%" }}>{body}</p>
                          <div className="mx-auto font-serif italic truncate" style={{ fontSize: "1.2cqw", marginTop: "1.5cqw", color: themeConfig.primary, maxWidth: "60%" }}>
                            ◆ &nbsp;{completionLabel}&nbsp; ◆
                          </div>
                        </div>
                        <div className="absolute grid grid-cols-2 text-center text-slate-600" style={{ left: "4.8cqw", right: "4.8cqw", bottom: "2.8cqw", gap: "4.8cqw" }}>
                          <div>
                            <div className="border-slate-300" style={{ borderTopWidth: "0.08cqw", paddingTop: "0.6cqw", fontSize: "1.35cqw" }}>{issuedDate}</div>
                            <div className="uppercase tracking-wide text-slate-400 font-bold" style={{ fontSize: "1.0cqw", marginTop: "0.4cqw" }}>Date</div>
                          </div>
                          <div>
                            {signatureDataUrl && (
                              <img
                                src={signatureDataUrl}
                                alt="Issuer signature"
                                className="mx-auto object-contain"
                                style={{ height: "4.2cqw", maxWidth: "16cqw", marginBottom: "0.2cqw" }}
                              />
                            )}
                            <div className="truncate border-slate-300" style={{ borderTopWidth: "0.08cqw", paddingTop: "0.6cqw", fontSize: "1.35cqw" }}>{issuedBy}</div>
                            <div className="truncate uppercase tracking-wide text-slate-400 font-bold" style={{ fontSize: "1.0cqw", marginTop: "0.4cqw" }}>{issuerTitle}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute rounded-lg" style={{ backgroundColor: "#FFFAF3", top: "0", bottom: "0", left: "0", right: "0" }}>
                    <div className="absolute inset-y-0 left-0" style={{ backgroundColor: themeConfig.accent, width: "1.5cqw" }} />
                    <div className="absolute overflow-hidden rounded-lg shadow-sm" style={{ left: "6cqw", right: "6cqw", top: "7cqw", bottom: "7cqw", backgroundColor: "#FFFAF3" }}>
                      
                      {/* Corner dots */}
                      <div className="absolute rounded-full" style={{ width: "0.4cqw", height: "0.4cqw", top: "1cqw", left: "1cqw", backgroundColor: themeConfig.accent }} />
                      <div className="absolute rounded-full" style={{ width: "0.4cqw", height: "0.4cqw", top: "1cqw", right: "1cqw", backgroundColor: themeConfig.accent }} />
                      <div className="absolute rounded-full" style={{ width: "0.4cqw", height: "0.4cqw", bottom: "1cqw", left: "1cqw", backgroundColor: themeConfig.accent }} />
                      <div className="absolute rounded-full" style={{ width: "0.4cqw", height: "0.4cqw", bottom: "1cqw", right: "1cqw", backgroundColor: themeConfig.accent }} />

                      <div className="absolute inset-0" style={{ border: "0.1cqw solid", borderColor: themeConfig.soft, borderRadius: "0.5cqw" }} />

                      <div className="flex items-start justify-between border-b" style={{ padding: "1.8cqw 2.8cqw", borderColor: themeConfig.accent, borderBottomWidth: "0.1cqw" }}>
                        <div className="flex min-w-0 items-center" style={{ gap: "1.2cqw" }}>
                          <img
                            src={logoUrl || defaultLogoUrl}
                            alt="Visit Dzaleka logo"
                            className="rounded-md object-contain"
                            style={{ height: "4.4cqw", width: "4.4cqw" }}
                          />
                          <div className="min-w-0 text-left">
                            <div className="font-bold truncate" style={{ fontSize: "1.4cqw", color: themeConfig.primary }}>Visit Dzaleka</div>
                            <div className="text-slate-500 truncate" style={{ fontSize: "1.1cqw" }}>Guide certification record</div>
                          </div>
                        </div>
                        <div className="min-w-0 text-right">
                          <div className="uppercase text-slate-400 font-bold" style={{ fontSize: "1.0cqw" }}>Certificate ID</div>
                          <div className="font-semibold text-slate-900 tabular-nums truncate" style={{ fontSize: "1.2cqw", maxWidth: "24cqw" }}>{certificateId}</div>
                        </div>
                      </div>
                      <div className="absolute text-center" style={{ left: "4.8cqw", right: "4.8cqw", top: "12cqw" }}>
                        <div className="font-bold tracking-tight" style={{ fontSize: "2.5cqw", color: themeConfig.primary }}>
                          {certificateTitle}
                        </div>
                        <div className="text-slate-500" style={{ fontSize: "1.2cqw", marginTop: "0.8cqw" }}>{subtitle}</div>
                        <div className="font-serif font-bold italic text-slate-900 truncate" style={{ fontSize: recipientFontSizeCqw, marginTop: "1.0cqw" }}>
                          {recipientName || "Guide Name"}
                        </div>
                        <div className="mx-auto relative" style={{ height: "0.3cqw", width: "18cqw", marginTop: "0.8cqw" }}>
                          <div className="absolute top-0 left-0 right-4" style={{ borderTop: "0.1cqw solid", borderColor: themeConfig.accent, transform: "rotate(-0.5deg)" }} />
                          <div className="absolute bottom-0 left-4 right-0" style={{ borderBottom: "0.1cqw solid", borderColor: themeConfig.accent, transform: "rotate(0.5deg)" }} />
                        </div>
                        <p className="mx-auto line-clamp-5 text-slate-600" style={{ fontSize: bodyFontSizeCqw, lineHeight: "1.35", marginTop: "1.2cqw", maxWidth: "80%" }}>{body}</p>
                        <div className="mx-auto font-serif italic truncate" style={{ fontSize: "1.2cqw", marginTop: "1.5cqw", color: themeConfig.primary, maxWidth: "60%" }}>
                          ◆ &nbsp;{completionLabel}&nbsp; ◆
                        </div>
                      </div>
                      <div className="absolute grid grid-cols-2 text-center text-slate-600" style={{ left: "4.8cqw", right: "4.8cqw", bottom: "2.8cqw", gap: "4.8cqw" }}>
                        <div>
                          <div className="border-slate-300" style={{ borderTopWidth: "0.08cqw", paddingTop: "0.6cqw", fontSize: "1.35cqw" }}>{issuedDate}</div>
                          <div className="uppercase tracking-wide text-slate-400 font-bold" style={{ fontSize: "1.0cqw", marginTop: "0.4cqw" }}>Date</div>
                        </div>
                        <div>
                          {signatureDataUrl && (
                            <img
                              src={signatureDataUrl}
                              alt="Issuer signature"
                              className="mx-auto object-contain"
                              style={{ height: "4.2cqw", maxWidth: "16cqw", marginBottom: "0.2cqw" }}
                            />
                          )}
                          <div className="truncate border-slate-300" style={{ borderTopWidth: "0.08cqw", paddingTop: "0.6cqw", fontSize: "1.35cqw" }}>{issuedBy}</div>
                          <div className="truncate uppercase tracking-wide text-slate-400 font-bold" style={{ fontSize: "1.0cqw", marginTop: "0.4cqw" }}>{issuerTitle}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-lg border bg-background p-3 text-sm md:grid-cols-4">
              <div className="flex min-w-0 gap-2">
                <Palette className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium text-foreground">Layout</div>
                  <div className="truncate text-muted-foreground">{layoutConfig.label}</div>
                </div>
              </div>
              <div className="flex min-w-0 gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium text-foreground">Certificate ID</div>
                  <div className="truncate text-muted-foreground tabular-nums">{certificateId}</div>
                </div>
              </div>
              <div className="flex min-w-0 gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium text-foreground">Issued date</div>
                  <div className="truncate text-muted-foreground tabular-nums">{issuedDate || todayIsoDate()}</div>
                </div>
              </div>
              <div className="flex min-w-0 gap-2">
                <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium text-foreground">Issuer</div>
                  <div className="truncate text-muted-foreground">{issuedBy || "Bakari Mustafa"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
