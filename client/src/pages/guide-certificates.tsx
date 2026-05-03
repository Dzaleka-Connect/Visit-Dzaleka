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
  heritage: {
    label: "Heritage blue",
    primary: "#0369a1",
    accent: "#f59e0b",
    soft: "#e0f2fe",
  },
  community: {
    label: "Community green",
    primary: "#047857",
    accent: "#0ea5e9",
    soft: "#dcfce7",
  },
  classic: {
    label: "Classic black",
    primary: "#111827",
    accent: "#c2410c",
    soft: "#f8fafc",
  },
} as const;

const certificateLayouts = {
  official: {
    label: "Official record",
    description: "Clean internal record with Visit Dzaleka header.",
  },
  classic: {
    label: "Classic award",
    description: "Formal centered certificate with framed borders.",
  },
  community: {
    label: "Community recognition",
    description: "Warmer layout for service and appreciation certificates.",
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
  const [theme, setTheme] = useState<CertificateTheme>("heritage");
  const [layout, setLayout] = useState<CertificateLayout>("official");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedGuide = activeGuides.find((guide) => guide.id === selectedGuideId);
  const themeConfig = certificateThemes[theme];
  const layoutConfig = certificateLayouts[layout];
  const canExport = recipientName.trim().length > 0;
  const signatureStatus = signatureDataUrl ? "Signature uploaded" : "Signature not uploaded";
  const logoStatus = logoUrl.trim() ? "Logo set" : "Logo fallback";

  useEffect(() => {
    if (selectedGuide) {
      setRecipientName(fullGuideName(selectedGuide));
    }
  }, [selectedGuide]);

  const generatePdf = async () => {
    if (!recipientName.trim()) {
      toast({
        title: "Recipient needed",
        description: "Choose a guide or enter a certificate recipient name.",
        variant: "destructive",
      });
      return;
    }

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
      const bodyLines = splitPdfText(doc, body, 165, 2);
      const recognitionText = truncatePdfText(doc, completionLabel.trim(), 86);

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

      if (layout === "classic") {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setDrawColor(primaryR, primaryG, primaryB);
        doc.setLineWidth(1.2);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(0.5);
        doc.rect(21, 21, pageWidth - 42, pageHeight - 42);
        drawLogo(pageWidth / 2 - 10, 28, 20, "circle");

        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text(truncatePdfText(doc, titleText, 205), pageWidth / 2, 64, { align: "center" });
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(truncatePdfText(doc, subtitleText, 120), pageWidth / 2, 82, { align: "center" });
        doc.setTextColor(17, 24, 39);
        doc.setFont("times", "bolditalic");
        doc.setFontSize(30);
        doc.text(truncatePdfText(doc, recipientText, 180), pageWidth / 2, 102, { align: "center" });
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(0.8);
        doc.line(88, 110, 209, 110);
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(bodyLines, pageWidth / 2, 125, { align: "center", lineHeightFactor: 1.35 });
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(recognitionText, pageWidth / 2, 146, { align: "center" });
        drawSignatureBlock(168, 175, 180, 155);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Certificate ID: ${truncatePdfText(doc, certificateIdText, 68)}`, pageWidth - 27, 31, { align: "right" });
      } else if (layout === "community") {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setFillColor(softR, softG, softB);
        doc.roundedRect(14, 14, pageWidth - 28, 182, 5, 5, "F");
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(25, 25, pageWidth - 50, 160, 4, 4, "F");
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
        doc.setFontSize(23);
        doc.text(truncatePdfText(doc, titleText, 205), pageWidth / 2, 70, { align: "center" });
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(truncatePdfText(doc, subtitleText, 120), pageWidth / 2, 86, { align: "center" });
        doc.setTextColor(17, 24, 39);
        doc.setFont("times", "bold");
        doc.setFontSize(30);
        doc.text(truncatePdfText(doc, recipientText, 185), pageWidth / 2, 105, { align: "center" });
        doc.setFillColor(accentR, accentG, accentB);
        doc.roundedRect(pageWidth / 2 - 43, 113, 86, 2, 1, 1, "F");
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(bodyLines, pageWidth / 2, 128, { align: "center", lineHeightFactor: 1.35 });
        doc.setFillColor(softR, softG, softB);
        doc.roundedRect(pageWidth / 2 - 48, 148, 96, 11, 2.5, 2.5, "F");
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(recognitionText, pageWidth / 2, 155, { align: "center" });
        drawSignatureBlock(172, 179, 184, 160);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setFillColor(primaryR, primaryG, primaryB);
        doc.rect(0, 0, 16, pageHeight, "F");
        doc.setFillColor(accentR, accentG, accentB);
        doc.rect(16, 0, 2, pageHeight, "F");
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4);
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(1);
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
        doc.setFillColor(softR, softG, softB);
        doc.roundedRect(pageWidth / 2 - 34, 59, 68, 9, 2.5, 2.5, "F");
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("VISIT DZALEKA CERTIFICATE", pageWidth / 2, 65, { align: "center" });
        doc.setFontSize(25);
        doc.text(truncatePdfText(doc, titleText, 205), pageWidth / 2, 78, { align: "center" });
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.text(truncatePdfText(doc, subtitleText, 120), pageWidth / 2, 94, { align: "center" });
        doc.setTextColor(17, 24, 39);
        doc.setFont("times", "bold");
        doc.setFontSize(30);
        doc.text(truncatePdfText(doc, recipientText, 185), pageWidth / 2, 111, { align: "center" });
        doc.setDrawColor(accentR, accentG, accentB);
        doc.setLineWidth(0.8);
        doc.line(90, 118, 207, 118);
        doc.setTextColor(55, 65, 81);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(bodyLines, pageWidth / 2, 131, { align: "center", lineHeightFactor: 1.35 });
        doc.setFillColor(softR, softG, softB);
        doc.roundedRect(pageWidth / 2 - 48, 149, 96, 11, 2.5, 2.5, "F");
        doc.setTextColor(primaryR, primaryG, primaryB);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(recognitionText, pageWidth / 2, 156, { align: "center" });
        drawSignatureBlock(173, 180, 185, 161);
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
                <Label htmlFor="recipient">Name on certificate</Label>
                <Input
                  id="recipient"
                  name="recipientName"
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="Guide name…"
                  className="text-base"
                />
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
                style={{ color: themeConfig.primary }}
              >
                {layout === "classic" ? (
                  <div className="absolute inset-7 bg-white shadow-sm">
                    <div className="absolute inset-0 border-2" style={{ borderColor: themeConfig.primary }} />
                    <div className="absolute inset-5 border" style={{ borderColor: themeConfig.accent }} />
                    <div className="absolute inset-x-12 top-7 text-center">
                      <img
                        src={logoUrl || defaultLogoUrl}
                        alt="Visit Dzaleka logo"
                        className="mx-auto h-10 w-10 rounded-full object-contain"
                      />
                      <div className="mt-2 truncate text-2xl font-bold tracking-tight" style={{ color: themeConfig.primary }}>
                        {certificateTitle}
                      </div>
                      <div className="mt-3 truncate text-sm text-slate-500">{subtitle}</div>
                      <div className="mt-2 truncate font-serif text-3xl font-bold italic text-slate-900">
                        {recipientName || "Guide Name"}
                      </div>
                      <div className="mx-auto mt-2 h-px w-44" style={{ backgroundColor: themeConfig.accent }} />
                      <p className="mx-auto mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-slate-600">{body}</p>
                      <div className="mx-auto mt-3 max-w-[440px] truncate text-xs font-bold" style={{ color: themeConfig.primary }}>
                        {completionLabel}
                      </div>
                    </div>
                    <div className="absolute inset-x-16 bottom-8 grid grid-cols-2 gap-12 text-center text-slate-600">
                      <div>
                        <div className="border-t border-slate-300 pt-2 text-sm">{issuedDate}</div>
                        <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">Date</div>
                      </div>
                      <div>
                        {signatureDataUrl && (
                          <img
                            src={signatureDataUrl}
                            alt="Issuer signature"
                            className="mx-auto mb-1 h-10 max-w-36 object-contain"
                          />
                        )}
                        <div className="truncate border-t border-slate-300 pt-2 text-sm">{issuedBy}</div>
                        <div className="mt-1 truncate text-xs uppercase tracking-wide text-slate-400">{issuerTitle}</div>
                      </div>
                    </div>
                    <div className="absolute right-9 top-7 max-w-60 truncate text-xs text-slate-500 tabular-nums">Certificate ID: {certificateId}</div>
                  </div>
                ) : layout === "community" ? (
                  <div className="absolute inset-5 rounded-lg" style={{ backgroundColor: themeConfig.soft }}>
                    <div className="absolute inset-7 overflow-hidden rounded-lg bg-white shadow-sm">
                      <div className="absolute inset-x-0 top-0 h-14" style={{ backgroundColor: themeConfig.primary }} />
                      <div className="absolute inset-x-0 top-14 h-1" style={{ backgroundColor: themeConfig.accent }} />
                      <div className="absolute left-6 top-4 flex min-w-0 items-center gap-3 text-white">
                        <img
                          src={logoUrl || defaultLogoUrl}
                          alt="Visit Dzaleka logo"
                          className="h-9 w-9 rounded-md bg-white object-contain"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">Visit Dzaleka</div>
                          <div className="truncate text-xs opacity-80">{certificateId}</div>
                        </div>
                      </div>
                      <div className="absolute inset-x-12 top-[4.5rem] text-center">
                        <div className="truncate text-2xl font-bold tracking-tight" style={{ color: themeConfig.primary }}>
                          {certificateTitle}
                        </div>
                        <div className="mt-3 truncate text-sm text-slate-500">{subtitle}</div>
                        <div className="mt-2 truncate font-serif text-3xl font-bold text-slate-900">
                          {recipientName || "Guide Name"}
                        </div>
                        <div className="mx-auto mt-2 h-1 w-36 rounded" style={{ backgroundColor: themeConfig.accent }} />
                        <p className="mx-auto mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-slate-600">{body}</p>
                        <div
                          className="mx-auto mt-3 max-w-[440px] truncate rounded px-4 py-2 text-xs font-bold"
                          style={{ backgroundColor: themeConfig.soft, color: themeConfig.primary }}
                        >
                          {completionLabel}
                        </div>
                      </div>
                      <div className="absolute inset-x-12 bottom-7 grid grid-cols-2 gap-12 text-center text-slate-600">
                        <div>
                          <div className="border-t border-slate-300 pt-2 text-sm">{issuedDate}</div>
                          <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">Date</div>
                        </div>
                        <div>
                          {signatureDataUrl && (
                            <img
                              src={signatureDataUrl}
                              alt="Issuer signature"
                              className="mx-auto mb-1 h-10 max-w-36 object-contain"
                            />
                          )}
                          <div className="truncate border-t border-slate-300 pt-2 text-sm">{issuedBy}</div>
                          <div className="mt-1 truncate text-xs uppercase tracking-wide text-slate-400">{issuerTitle}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-y-0 left-0 w-[5.5%]" style={{ backgroundColor: themeConfig.primary }} />
                    <div className="absolute inset-y-0 left-[5.5%] w-[0.75%]" style={{ backgroundColor: themeConfig.accent }} />
                    <div className="absolute left-[10%] right-[6%] top-[7%] bottom-[7%] overflow-hidden rounded-lg border bg-white shadow-sm">
                      <div className="flex items-start justify-between border-b px-8 py-5" style={{ borderColor: themeConfig.accent }}>
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={logoUrl || defaultLogoUrl}
                            alt="Visit Dzaleka logo"
                            className="h-11 w-11 rounded-md object-contain"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold" style={{ color: themeConfig.primary }}>Visit Dzaleka</div>
                            <div className="truncate text-xs text-slate-500">Guide certification record</div>
                          </div>
                        </div>
                        <div className="min-w-0 text-right">
                          <div className="text-[10px] uppercase text-slate-400">Certificate ID</div>
                          <div className="max-w-48 truncate text-xs font-semibold text-slate-900 tabular-nums">{certificateId}</div>
                        </div>
                      </div>
                      <div className="absolute inset-x-12 top-[26%] text-center">
                        <div
                          className="mx-auto inline-flex max-w-[320px] rounded px-4 py-1 text-[10px] font-bold uppercase tracking-wide"
                          style={{ backgroundColor: themeConfig.soft, color: themeConfig.primary }}
                        >
                          Visit Dzaleka Certificate
                        </div>
                        <div className="mt-3 truncate text-2xl font-bold tracking-tight" style={{ color: themeConfig.primary }}>
                          {certificateTitle}
                        </div>
                        <div className="mt-3 truncate text-sm text-slate-500">{subtitle}</div>
                        <div className="mt-2 truncate font-serif text-3xl font-bold text-slate-900">
                          {recipientName || "Guide Name"}
                        </div>
                        <div className="mx-auto mt-2 h-px w-44" style={{ backgroundColor: themeConfig.accent }} />
                        <p className="mx-auto mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-slate-600">{body}</p>
                        <div
                          className="mx-auto mt-3 max-w-[440px] truncate rounded px-4 py-2 text-xs font-bold"
                          style={{ backgroundColor: themeConfig.soft, color: themeConfig.primary }}
                        >
                          {completionLabel}
                        </div>
                      </div>
                      <div className="absolute inset-x-12 bottom-7 grid grid-cols-2 gap-12 text-center text-slate-600">
                        <div>
                          <div className="border-t border-slate-300 pt-2 text-sm">{issuedDate}</div>
                          <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">Date</div>
                        </div>
                        <div>
                          {signatureDataUrl && (
                            <img
                              src={signatureDataUrl}
                              alt="Issuer signature"
                              className="mx-auto mb-1 h-10 max-w-36 object-contain"
                            />
                          )}
                          <div className="truncate border-t border-slate-300 pt-2 text-sm">{issuedBy}</div>
                          <div className="mt-1 truncate text-xs uppercase tracking-wide text-slate-400">{issuerTitle}</div>
                        </div>
                      </div>
                    </div>
                  </>
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
