import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2, MessageSquareText, Send, Star } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { SiteFooter } from "@/components/site-footer";
import { SEO } from "@/components/seo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReviewRequestDetails {
  bookingReference: string;
  visitorName: string;
  visitDate: string;
  visitTime: string;
  status: string;
  guideName: string | null;
  canReview: boolean;
  review: {
    id: string;
    rating: number | null;
    title: string | null;
    comment: string | null;
    tourGuideName: string | null;
    country: string | null;
    purposeOfVisit: string | null;
    groupSize: string | null;
    referralSource: string | null;
    overallExperience: string | null;
    guideExperience: string | null;
    enjoyedMost: string | null;
    improvementSuggestions: string | null;
    wouldRecommend: string | null;
    otherComments: string | null;
    wouldVisitAgain: string | null;
    consentPhotos: boolean | null;
    consentTestimonial: boolean | null;
    consentDataProcessing: boolean | null;
    status: string;
    submittedAt: string | null;
  } | null;
}

interface ReviewSubmitResponse {
  message: string;
  review: {
    id: string;
    rating: number | null;
    status: string;
    submittedAt: string | null;
  };
}

function initialBookingReference() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("booking")?.trim() || "";
}

function formatVisitDate(value?: string | null) {
  if (!value) return "Visit date not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(value));
}

function existingRating(review: ReviewRequestDetails["review"]) {
  if (!review?.rating) return null;
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      aria-hidden="true"
      className={`h-4 w-4 ${index < review.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
    />
  ));
}

const experienceOptions = ["Excellent", "Good", "Average", "Poor"];
const yesNoMaybeOptions = ["Yes", "No", "Maybe"];
const purposeOptions = [
  "Cultural learning",
  "Education or research",
  "Community organization visit",
  "Partnership or donor visit",
  "Tourism",
  "Other",
];
const groupSizeOptions = [
  "Solo visitor",
  "2-5 visitors",
  "6-10 visitors",
  "11-20 visitors",
  "21+ visitors",
];
const referralOptions = [
  "Friend or family",
  "Google Search",
  "Social media",
  "GetYourGuide",
  "Dzaleka Online",
  "Partner organization",
  "Other",
];

function experienceToRating(value: string) {
  const ratings: Record<string, number> = {
    Excellent: 5,
    Good: 4,
    Average: 3,
    Poor: 2,
  };
  return ratings[value] || 0;
}

function OptionRadioGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const groupId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2 sm:grid-cols-4">
        {options.map((option) => {
          const id = `${groupId}-${option.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
            <Label
              key={option}
              htmlFor={id}
              className={`relative flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring ${
                value === option ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <RadioGroupItem id={id} value={option} className="absolute inset-0 h-full w-full rounded-md opacity-0" />
              {option}
            </Label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}

export default function VisitFeedback() {
  const startingReference = initialBookingReference();
  const [referenceInput, setReferenceInput] = useState(startingReference);
  const [activeReference, setActiveReference] = useState(startingReference);
  const [tourGuideName, setTourGuideName] = useState("");
  const [country, setCountry] = useState("");
  const [purposeOfVisit, setPurposeOfVisit] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [overallExperience, setOverallExperience] = useState("");
  const [guideExperience, setGuideExperience] = useState("");
  const [enjoyedMost, setEnjoyedMost] = useState("");
  const [improvementSuggestions, setImprovementSuggestions] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState("");
  const [otherComments, setOtherComments] = useState("");
  const [wouldVisitAgain, setWouldVisitAgain] = useState("");
  const [consentPhotos, setConsentPhotos] = useState(false);
  const [consentTestimonial, setConsentTestimonial] = useState(false);
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const firstErrorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const reviewQueryKey = activeReference
    ? `/api/public/reviews/request?booking=${encodeURIComponent(activeReference)}`
    : "";

  const { data, isLoading, isError } = useQuery<ReviewRequestDetails>({
    queryKey: [reviewQueryKey],
    enabled: Boolean(activeReference),
    retry: false,
  });

  useEffect(() => {
    if (data?.review) {
      setTourGuideName(data.review.tourGuideName || data.guideName || "");
      setCountry(data.review.country || "");
      setPurposeOfVisit(data.review.purposeOfVisit || "");
      setGroupSize(data.review.groupSize || "");
      setReferralSource(data.review.referralSource || "");
      setOverallExperience(data.review.overallExperience || "");
      setGuideExperience(data.review.guideExperience || "");
      setEnjoyedMost(data.review.enjoyedMost || data.review.comment || "");
      setImprovementSuggestions(data.review.improvementSuggestions || "");
      setWouldRecommend(data.review.wouldRecommend || "");
      setOtherComments(data.review.otherComments || "");
      setWouldVisitAgain(data.review.wouldVisitAgain || "");
      setConsentPhotos(Boolean(data.review.consentPhotos));
      setConsentTestimonial(Boolean(data.review.consentTestimonial));
      setConsentDataProcessing(Boolean(data.review.consentDataProcessing));
    } else if (data) {
      setTourGuideName(data.guideName || "");
      setCountry("");
      setPurposeOfVisit("");
      setGroupSize("");
      setReferralSource("");
      setOverallExperience("");
      setGuideExperience("");
      setEnjoyedMost("");
      setImprovementSuggestions("");
      setWouldRecommend("");
      setOtherComments("");
      setWouldVisitAgain("");
      setConsentPhotos(false);
      setConsentTestimonial(false);
      setConsentDataProcessing(false);
    }
  }, [data]);

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/public/reviews/request", {
        bookingReference: activeReference,
        rating: experienceToRating(overallExperience),
        title: overallExperience ? `${overallExperience} Visit Dzaleka experience` : undefined,
        comment: enjoyedMost.trim() || otherComments.trim() || undefined,
        tourGuideName: tourGuideName.trim() || undefined,
        country: country.trim() || undefined,
        purposeOfVisit: purposeOfVisit || undefined,
        groupSize: groupSize || undefined,
        referralSource: referralSource || undefined,
        overallExperience,
        guideExperience,
        enjoyedMost: enjoyedMost.trim() || undefined,
        improvementSuggestions: improvementSuggestions.trim() || undefined,
        wouldRecommend,
        otherComments: otherComments.trim() || undefined,
        wouldVisitAgain,
        consentPhotos,
        consentTestimonial,
        consentDataProcessing,
      });
      return response.json() as Promise<ReviewSubmitResponse>;
    },
    onSuccess: async (result) => {
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: [reviewQueryKey] });
      toast({
        title: "Review received",
        description: result.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReferenceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = referenceInput.trim();
    setActiveReference(trimmed);
    setSubmitted(false);
  };

  const handleReviewSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!overallExperience) {
      setFormError("Choose your overall experience before submitting.");
      firstErrorRef.current?.focus();
      return;
    }

    if (!guideExperience) {
      setFormError("Choose how your tour guide did before submitting.");
      firstErrorRef.current?.focus();
      return;
    }

    if (!consentDataProcessing) {
      setFormError("Please consent to data processing so we can save your feedback.");
      firstErrorRef.current?.focus();
      return;
    }

    setFormError("");
    submitReviewMutation.mutate();
  };

  const alreadySubmitted = submitted || Boolean(data?.review?.submittedAt);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Share Your Visit Feedback"
        description="Share verified feedback after your Visit Dzaleka guided tour."
        canonical="https://visit.dzaleka.com/visit/feedback"
      />
      <PublicHeader />

      <main>
        <section className="border-b bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <Badge variant="outline" className="mb-4 gap-2">
              <MessageSquareText className="h-3.5 w-3.5" />
              Verified visitor feedback
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Share your Visit Dzaleka experience</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Your review helps the team improve the tour, support guides, and give future visitors a clearer picture of what to expect.
            </p>
          </div>
        </section>

        <section className="container mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Find your booking</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReferenceSubmit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="booking-reference">Booking reference</Label>
                    <Input
                      id="booking-reference"
                      name="bookingReference"
                      value={referenceInput}
                      onChange={(event) => setReferenceInput(event.target.value)}
                      placeholder="DVS-2026-ABC123…"
                      autoComplete="off"
                      spellCheck={false}
                      className="text-base"
                    />
                  </div>
                  <Button type="submit" className="self-end" disabled={!referenceInput.trim()}>
                    Load booking
                  </Button>
                </form>
              </CardContent>
            </Card>

            {!activeReference && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Booking reference needed</AlertTitle>
                <AlertDescription>
                  Open the feedback link from your email, or enter the booking reference shared by the Visit Dzaleka team.
                </AlertDescription>
              </Alert>
            )}

            {activeReference && isLoading && (
              <Card>
                <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading booking…
                </CardContent>
              </Card>
            )}

            {activeReference && isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Booking not found</AlertTitle>
                <AlertDescription>
                  Check the reference and try again. If the problem continues, contact Visit Dzaleka from the Contact page.
                </AlertDescription>
              </Alert>
            )}

            {data && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{data.bookingReference}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatVisitDate(data.visitDate)}{data.visitTime ? ` at ${data.visitTime}` : ""}
                      </p>
                    </div>
                    <Badge variant={data.status === "completed" ? "default" : "secondary"}>{data.status.replace("_", " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground">Visitor</div>
                      <div className="mt-1 font-medium">{data.visitorName}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-muted-foreground">Guide</div>
                      <div className="mt-1 font-medium">{data.guideName || "Guide not recorded"}</div>
                    </div>
                  </div>

                  {alreadySubmitted ? (
                    <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Thank you for your review</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-3">
                          <p>Your feedback has been saved for the Visit Dzaleka team to review before publishing.</p>
                          {data.review?.rating && (
                            <div className="flex items-center gap-2">
                              <span className="sr-only">{data.review.rating} out of 5 stars</span>
                              {existingRating(data.review)}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : !data.canReview ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Reviews open after checkout</AlertTitle>
                      <AlertDescription>
                        This booking is not marked completed yet. The review form becomes available after the tour is checked out or completed by staff.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <form onSubmit={handleReviewSubmit} noValidate className="space-y-5">
                      {formError && (
                        <div
                          ref={firstErrorRef}
                          tabIndex={-1}
                          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-live="polite"
                        >
                          {formError}
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="tour-guide-name">Tour guide name</Label>
                          <Input
                            id="tour-guide-name"
                            name="tourGuideName"
                            value={tourGuideName}
                            onChange={(event) => setTourGuideName(event.target.value)}
                            placeholder="Name of your tour guide…"
                            autoComplete="name"
                            className="text-base"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            name="country"
                            value={country}
                            onChange={(event) => setCountry(event.target.value)}
                            placeholder="Where are you from?…"
                            autoComplete="country-name"
                            className="text-base"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="purpose-of-visit">Purpose of visit</Label>
                          <Select value={purposeOfVisit} onValueChange={setPurposeOfVisit}>
                            <SelectTrigger id="purpose-of-visit" className="text-base">
                              <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              {purposeOptions.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="group-size">Group size</Label>
                          <Select value={groupSize} onValueChange={setGroupSize}>
                            <SelectTrigger id="group-size" className="text-base">
                              <SelectValue placeholder="Select group size" />
                            </SelectTrigger>
                            <SelectContent>
                              {groupSizeOptions.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="referral-source">How did you hear about Visit Dzaleka?</Label>
                          <Select value={referralSource} onValueChange={setReferralSource}>
                            <SelectTrigger id="referral-source" className="text-base">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {referralOptions.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <OptionRadioGroup
                        label="Overall experience"
                        value={overallExperience}
                        onChange={(value) => {
                          setOverallExperience(value);
                          setFormError("");
                        }}
                        options={experienceOptions}
                      />

                      <OptionRadioGroup
                        label="How was your tour guide?"
                        value={guideExperience}
                        onChange={(value) => {
                          setGuideExperience(value);
                          setFormError("");
                        }}
                        options={experienceOptions}
                      />

                      <div className="space-y-2">
                        <Label htmlFor="enjoyed-most">What did you enjoy most about the tour?</Label>
                        <Textarea
                          id="enjoyed-most"
                          name="enjoyedMost"
                          value={enjoyedMost}
                          onChange={(event) => setEnjoyedMost(event.target.value)}
                          rows={4}
                          maxLength={3000}
                          placeholder="Tell us what you liked…"
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="improvement-suggestions">How can we improve?</Label>
                        <Textarea
                          id="improvement-suggestions"
                          name="improvementSuggestions"
                          value={improvementSuggestions}
                          onChange={(event) => setImprovementSuggestions(event.target.value)}
                          rows={4}
                          maxLength={3000}
                          placeholder="Any suggestions or areas we can do better…"
                          className="text-base"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <OptionRadioGroup
                          label="Would you recommend this tour to others?"
                          value={wouldRecommend}
                          onChange={setWouldRecommend}
                          options={yesNoMaybeOptions}
                        />
                        <OptionRadioGroup
                          label="Would you visit Dzaleka again?"
                          value={wouldVisitAgain}
                          onChange={setWouldVisitAgain}
                          options={yesNoMaybeOptions}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="other-comments">Any other comments?</Label>
                        <Textarea
                          id="other-comments"
                          name="otherComments"
                          value={otherComments}
                          onChange={(event) => setOtherComments(event.target.value)}
                          rows={4}
                          maxLength={3000}
                          placeholder="Anything else you'd like to share…"
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-3 rounded-lg border p-4">
                        <h3 className="font-semibold">Permissions & consent</h3>
                        <Label htmlFor="consent-photos" className="flex min-h-11 items-start gap-3 rounded-md p-1">
                          <Checkbox
                            id="consent-photos"
                            checked={consentPhotos}
                            onCheckedChange={(checked) => setConsentPhotos(checked === true)}
                            className="mt-1"
                          />
                          <span>I consent to photos taken during my visit being used on the Visit Dzaleka website and social media.</span>
                        </Label>
                        <Label htmlFor="consent-testimonial" className="flex min-h-11 items-start gap-3 rounded-md p-1">
                          <Checkbox
                            id="consent-testimonial"
                            checked={consentTestimonial}
                            onCheckedChange={(checked) => setConsentTestimonial(checked === true)}
                            className="mt-1"
                          />
                          <span>I agree to have my positive feedback featured on the Visit Dzaleka website as a testimonial.</span>
                        </Label>
                        <Label htmlFor="consent-data" className="flex min-h-11 items-start gap-3 rounded-md p-1">
                          <Checkbox
                            id="consent-data"
                            checked={consentDataProcessing}
                            onCheckedChange={(checked) => {
                              setConsentDataProcessing(checked === true);
                              setFormError("");
                            }}
                            className="mt-1"
                          />
                          <span>
                            I consent to my data being collected and processed to improve Visit Dzaleka services.{" "}
                            <a
                              href="https://services.dzaleka.com/privacy/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              View our Privacy Policy.
                            </a>
                          </span>
                        </Label>
                      </div>

                      <Button type="submit" disabled={submitReviewMutation.isPending}>
                        {submitReviewMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Submit review
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>What happens next</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Staff read each review before publishing public comments on the tour listing.</p>
                <p>Private notes help improve guide training, meeting point clarity, and visitor care.</p>
                <p>You can also reply to your feedback email if you need support with a specific issue.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>If your booking reference is not working, contact the team and include your visit date.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Contact Visit Dzaleka</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
