import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2, LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SEO } from "@/components/seo";

const contentSchema = z.object({
  hero_title: z.string().min(1, "Hero title is required"),
  hero_subtitle: z.string().min(1, "Hero subtitle is required"),
  hero_cta: z.string().min(1, "Hero CTA button text is required"),

  stats_label_1: z.string().min(1, "Stat 1 label is required"),
  stats_label_2: z.string().min(1, "Stat 2 label is required"),
  stats_label_3: z.string().min(1, "Stat 3 label is required"),
  stats_label_4: z.string().min(1, "Stat 4 label is required"),

  feature_1_title: z.string().min(1, "Feature 1 title is required"),
  feature_1_desc: z.string().min(1, "Feature 1 description is required"),
  feature_2_title: z.string().min(1, "Feature 2 title is required"),
  feature_2_desc: z.string().min(1, "Feature 2 description is required"),
  feature_3_title: z.string().min(1, "Feature 3 title is required"),
  feature_3_desc: z.string().min(1, "Feature 3 description is required"),
  feature_4_title: z.string().min(1, "Feature 4 title is required"),
  feature_4_desc: z.string().min(1, "Feature 4 description is required"),

  pricing_title: z.string().min(1, "Pricing title is required"),
  pricing_desc: z.string().min(1, "Pricing description is required"),

  testimonial_1_quote: z.string().min(1, "Testimonial 1 quote is required"),
  testimonial_1_author: z.string().min(1, "Testimonial 1 author is required"),
  testimonial_1_role: z.string().min(1, "Testimonial 1 role is required"),
  testimonial_2_quote: z.string().min(1, "Testimonial 2 quote is required"),
  testimonial_2_author: z.string().min(1, "Testimonial 2 author is required"),
  testimonial_2_role: z.string().min(1, "Testimonial 2 role is required"),
  testimonial_3_quote: z.string().min(1, "Testimonial 3 quote is required"),
  testimonial_3_author: z.string().min(1, "Testimonial 3 author is required"),
  testimonial_3_role: z.string().min(1, "Testimonial 3 role is required"),

  cta_title: z.string().min(1, "CTA title is required"),
  cta_desc: z.string().min(1, "CTA description is required"),

  footer_description: z.string().min(1, "Footer description is required"),
  footer_contact_email: z.string().email("Invalid email for footer contact"),
  footer_contact_phone: z.string().min(1, "Footer contact phone is required"),
});

type ContentFormData = z.infer<typeof contentSchema>;

export default function CMSPage() {
  const { toast } = useToast();
  const { data: content, isLoading } = useQuery<ContentFormData>({
    queryKey: ["/api/content"],
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    values: content as ContentFormData, // Auto-populate when data loads
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/content", { updates: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({ title: "Content updated", description: "Landing page content has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="Content Management" description="Manage landing page content." />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Update the text and messaging on your public landing page.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5" />
                Hero Section
              </CardTitle>
              <CardDescription>The first thing visitors see on the landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Main Headline</Label>
                <Input {...register("hero_title")} />
                {errors.hero_title && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea {...register("hero_subtitle")} />
                {errors.hero_subtitle && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input {...register("hero_cta")} />
                {errors.hero_cta && <span className="text-red-500 text-xs">Required</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats Section</CardTitle>
              <CardDescription>Labels for the visitor statistics.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stat 1 Label</Label>
                <Input {...register("stats_label_1")} />
                {errors.stats_label_1 && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>Stat 2 Label</Label>
                <Input {...register("stats_label_2")} />
                {errors.stats_label_2 && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>Stat 3 Label</Label>
                <Input {...register("stats_label_3")} />
                {errors.stats_label_3 && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>Stat 4 Label</Label>
                <Input {...register("stats_label_4")} />
                {errors.stats_label_4 && <span className="text-red-500 text-xs">Required</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features Section</CardTitle>
              <CardDescription>Key features highlighted on the landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { index: 1, label: "Effortless Booking" },
                { index: 2, label: "Meet Your Local Ambassador" },
                { index: 3, label: "Immersive Experiences" },
                { index: 4, label: "A Culture of Safety & Respect" },
              ].map(({ index, label }) => (
                <div key={index} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                  <h4 className="font-semibold text-lg">{label}</h4>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input {...register(`feature_${index}_title` as keyof ContentFormData)} placeholder={label} />
                    {errors[`feature_${index}_title` as keyof ContentFormData] && <span className="text-red-500 text-xs">Required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea {...register(`feature_${index}_desc` as keyof ContentFormData)} />
                    {errors[`feature_${index}_desc` as keyof ContentFormData] && <span className="text-red-500 text-xs">Required</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing Section</CardTitle>
              <CardDescription>Headline and description for the pricing plans.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pricing Header</Label>
                <Input {...register("pricing_title")} />
                {errors.pricing_title && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>Pricing Description</Label>
                <Textarea {...register("pricing_desc")} />
                {errors.pricing_desc && <span className="text-red-500 text-xs">Required</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testimonials Section</CardTitle>
              <CardDescription>Quotes from satisfied visitors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3].map((index) => (
                <div key={index} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                  <h4 className="font-semibold text-lg">Testimonial {index}</h4>
                  <div className="space-y-2">
                    <Label>Quote</Label>
                    <Label>Quote</Label>
                    <Textarea {...register(`testimonial_${index}_quote` as keyof ContentFormData)} />
                    {errors[`testimonial_${index}_quote` as keyof ContentFormData] && <span className="text-red-500 text-xs">Required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Author</Label>
                    <Input {...register(`testimonial_${index}_author` as keyof ContentFormData)} />
                    {errors[`testimonial_${index}_author` as keyof ContentFormData] && <span className="text-red-500 text-xs">Required</span>}
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input {...register(`testimonial_${index}_role` as keyof ContentFormData)} />
                    {errors[`testimonial_${index}_role` as keyof ContentFormData] && <span className="text-red-500 text-xs">Required</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Call to Action (CTA) Section</CardTitle>
              <CardDescription>Encourage visitors to book their visit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CTA Title</Label>
                <Input {...register("cta_title")} />
                {errors.cta_title && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>CTA Description</Label>
                <Textarea {...register("cta_desc")} />
                {errors.cta_desc && <span className="text-red-500 text-xs">Required</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer Section</CardTitle>
              <CardDescription>Contact information and copyright details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Footer Description</Label>
                <Textarea {...register("footer_description")} />
                {errors.footer_description && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input {...register("footer_contact_email")} />
                {errors.footer_contact_email && <span className="text-red-500 text-xs">Required</span>}
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input {...register("footer_contact_phone")} />
                {errors.footer_contact_phone && <span className="text-red-500 text-xs">Required</span>}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending} size="lg">
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
