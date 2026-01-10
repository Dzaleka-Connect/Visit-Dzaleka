import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DollarSign,
  Save,
  Clock,
  Lock,
  Loader2,
  Bell,
  Database,
  Download,
  Activity,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatCurrency, PRICING } from "@/lib/constants";
import { useState, useEffect } from "react";
import type { PricingConfig, AnalyticsSetting, InsertAnalyticsSetting } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { NotificationSender } from "@/components/notification-sender";
import { SEO } from "@/components/seo";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [pricing, setPricing] = useState({
    individual: PRICING.individual as number,
    small_group: PRICING.small_group as number,
    large_group: PRICING.large_group as number,
    custom: PRICING.custom as number,
    additional_hour: PRICING.additional_hour as number,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: pricingConfigs } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing"],
  });

  // Analytics Settings State & Logic
  const [analyticsForm, setAnalyticsForm] = useState<InsertAnalyticsSetting>({
    ga4MeasurementId: "",
    googleAdsConversionId: "",
    googleAdsConversionLabel: "",
    facebookPixelId: "",
    customHtml: "",
    isEnabled: true
  });

  const { data: analyticsSettings } = useQuery<AnalyticsSetting>({
    queryKey: ["/api/settings/analytics"],
  });

  useEffect(() => {
    if (analyticsSettings) {
      setAnalyticsForm({
        ga4MeasurementId: analyticsSettings.ga4MeasurementId || "",
        googleAdsConversionId: analyticsSettings.googleAdsConversionId || "",
        googleAdsConversionLabel: analyticsSettings.googleAdsConversionLabel || "",
        facebookPixelId: analyticsSettings.facebookPixelId || "",
        customHtml: analyticsSettings.customHtml || "",
        isEnabled: analyticsSettings.isEnabled
      });
    }
  }, [analyticsSettings]);

  const updateAnalyticsMutation = useMutation({
    mutationFn: async (data: InsertAnalyticsSetting) => {
      await apiRequest("PATCH", "/api/settings/analytics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/analytics"] });
      toast({ title: "Analytics updated", description: "Tracking settings saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update analytics settings.", variant: "destructive" });
    }
  });

  const handleAnalyticsSave = () => {
    updateAnalyticsMutation.mutate(analyticsForm);
  };

  const updatePricingMutation = useMutation({
    mutationFn: async (data: typeof pricing) => {
      await apiRequest("PATCH", "/api/pricing", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing"] });
      toast({
        title: "Pricing updated",
        description: "Tour pricing has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update pricing.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return apiRequest("POST", "/api/auth/change-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to change password",
        description: error.message || "Please check your current password and try again.",
        variant: "destructive",
      });
    },
  });

  const handlePricingSave = () => {
    updatePricingMutation.mutate(pricing);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "New password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Settings"
        description="Manage your account and system settings at Visit Dzaleka."
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and system settings.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Password Change Section - Available to all users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password. You'll need to enter your current password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
            >
              {changePasswordMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Pricing Section - Admin only */}
        {isAdmin && (
          <>
            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Push Notifications
                </CardTitle>
                <CardDescription>
                  Send custom notifications to users. Choose to send to all users, users by role, or specific individuals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationSender />
              </CardContent>
            </Card>

            {/* Analytics Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Conversion Tracking & Analytics
                </CardTitle>
                <CardDescription>
                  Configure ID integrations for Google Analytics 4, Google Ads, and Facebook Pixel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {/* Google Analytics 4 */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm flex items-center gap-2">Google Analytics 4</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="ga4-id" className="text-muted-foreground">Measurement ID (G-XXXXXXXXXX)</Label>
                      <Input
                        id="ga4-id"
                        placeholder="G-12345678"
                        value={analyticsForm.ga4MeasurementId || ""}
                        onChange={(e) => setAnalyticsForm({ ...analyticsForm, ga4MeasurementId: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Google Ads */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm flex items-center gap-2">Google Ads</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ads-id" className="text-muted-foreground">Conversion ID</Label>
                        <Input
                          id="ads-id"
                          placeholder="1234567890"
                          value={analyticsForm.googleAdsConversionId || ""}
                          onChange={(e) => setAnalyticsForm({ ...analyticsForm, googleAdsConversionId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ads-label" className="text-muted-foreground">Conversion Label</Label>
                        <Input
                          id="ads-label"
                          placeholder="abcXYZABC1234abc-XYZ"
                          value={analyticsForm.googleAdsConversionLabel || ""}
                          onChange={(e) => setAnalyticsForm({ ...analyticsForm, googleAdsConversionLabel: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Facebook Pixel */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm flex items-center gap-2">Facebook Pixel</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="pixel-id" className="text-muted-foreground">Pixel ID</Label>
                      <Input
                        id="pixel-id"
                        placeholder="12345678901234"
                        value={analyticsForm.facebookPixelId || ""}
                        onChange={(e) => setAnalyticsForm({ ...analyticsForm, facebookPixelId: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Custom HTML */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm flex items-center gap-2">Other tracking methods (Custom HTML)</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      This code will be included at the bottom of the <strong>Booking Confirmation</strong> page.
                      <br />Supported placeholders: {'{FIRSTNAME}'}, {'{LASTNAME}'}, {'{EMAIL}'}, {'{TOTALPAID}'}, {'{BOOKINGNUMBER}'}.
                    </p>
                    <Textarea
                      className="font-mono text-xs min-h-[150px]"
                      placeholder="<script>...</script>"
                      value={analyticsForm.customHtml || ""}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, customHtml: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleAnalyticsSave}
                      disabled={updateAnalyticsMutation.isPending}
                    >
                      {updateAnalyticsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Tracking Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Export system data for backup or analysis purposes.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">System Backup</h4>
                  <p className="text-sm text-muted-foreground">Download a JSON export of Users, Bookings, Guides, and Zones.</p>
                </div>
                <Button variant="outline" onClick={() => window.open("/api/admin/export-data", "_blank")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tour Pricing
                </CardTitle>
                <CardDescription>
                  Set the base prices for different tour packages. All prices are in
                  Malawian Kwacha (MWK).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="individual-price">Individual Tour (1 person)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        MWK
                      </span>
                      <Input
                        id="individual-price"
                        type="number"
                        value={pricing.individual}
                        onChange={(e) =>
                          setPricing({ ...pricing, individual: parseInt(e.target.value) || 0 })
                        }
                        className="pl-12"
                        data-testid="input-individual-price"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ≈ ${(pricing.individual / 1700).toFixed(0)} USD
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="small-group-price">Small Group (2-5 people)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        MWK
                      </span>
                      <Input
                        id="small-group-price"
                        type="number"
                        value={pricing.small_group}
                        onChange={(e) =>
                          setPricing({ ...pricing, small_group: parseInt(e.target.value) || 0 })
                        }
                        className="pl-12"
                        data-testid="input-small-group-price"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ≈ ${(pricing.small_group / 1700).toFixed(0)} USD
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="large-group-price">Large Group (6-10 people)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        MWK
                      </span>
                      <Input
                        id="large-group-price"
                        type="number"
                        value={pricing.large_group}
                        onChange={(e) =>
                          setPricing({ ...pricing, large_group: parseInt(e.target.value) || 0 })
                        }
                        className="pl-12"
                        data-testid="input-large-group-price"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ≈ ${(pricing.large_group / 1700).toFixed(0)} USD
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-price">Custom Group (10+ people)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        MWK
                      </span>
                      <Input
                        id="custom-price"
                        type="number"
                        value={pricing.custom}
                        onChange={(e) =>
                          setPricing({ ...pricing, custom: parseInt(e.target.value) || 0 })
                        }
                        className="pl-12"
                        data-testid="input-custom-price"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ≈ ${(pricing.custom / 1700).toFixed(0)} USD
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label
                    htmlFor="additional-hour-price"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Additional Hour Rate
                  </Label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      MWK
                    </span>
                    <Input
                      id="additional-hour-price"
                      type="number"
                      value={pricing.additional_hour}
                      onChange={(e) =>
                        setPricing({
                          ...pricing,
                          additional_hour: parseInt(e.target.value) || 0,
                        })
                      }
                      className="pl-12"
                      data-testid="input-additional-hour-price"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Price per additional hour beyond the standard tour duration
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handlePricingSave}
                    disabled={updatePricingMutation.isPending}
                    data-testid="button-save-pricing"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Pricing
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Pricing Summary</CardTitle>
                <CardDescription>
                  Overview of your current tour pricing structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Individual</div>
                    <div className="mt-1 text-2xl font-bold">
                      {formatCurrency(pricing.individual)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      1 person
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Small Group</div>
                    <div className="mt-1 text-2xl font-bold">
                      {formatCurrency(pricing.small_group)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      2-5 people
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Large Group</div>
                    <div className="mt-1 text-2xl font-bold">
                      {formatCurrency(pricing.large_group)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      6-10 people
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Custom</div>
                    <div className="mt-1 text-2xl font-bold">
                      {formatCurrency(pricing.custom)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      10+ people
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
