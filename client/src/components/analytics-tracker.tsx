import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AnalyticsSetting } from "@shared/schema";

type PublicAnalyticsSetting = Pick<
    AnalyticsSetting,
    "facebookPixelId" | "ga4MeasurementId" | "googleAdsConversionId" | "isEnabled"
>;

export function AnalyticsTracker() {
    const { data: settings } = useQuery<PublicAnalyticsSetting>({
        queryKey: ["/api/settings/analytics/public"],
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    useEffect(() => {
        if (!settings || !settings.isEnabled) return;

        const w = window as any;

        const ensureGtag = () => {
            if (!w.dataLayer) {
                w.dataLayer = [];
                w.gtag = function () { w.dataLayer.push(arguments); }
                w.gtag('js', new Date());
            }
        };

        if (settings.ga4MeasurementId) {
            if (!document.getElementById("ga4-script")) {
                ensureGtag();

                const script = document.createElement("script");
                script.id = "ga4-script";
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.ga4MeasurementId}`;
                document.head.appendChild(script);

                w.gtag('config', settings.ga4MeasurementId);
            }
        }

        if (settings.googleAdsConversionId) {
            if (!document.getElementById("ga4-script") && !document.getElementById("google-ads-script")) {
                ensureGtag();
                const script = document.createElement("script");
                script.id = "google-ads-script";
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleAdsConversionId}`;
                document.head.appendChild(script);
            } else {
                ensureGtag();
            }

            w.gtag('config', settings.googleAdsConversionId);
        }

        if (settings.facebookPixelId) {
            if (!document.getElementById("fb-pixel")) {
                const w = window as any;
                if (!w.fbq) {
                    w.fbq = function () {
                        w.fbq.callMethod ? w.fbq.callMethod.apply(w.fbq, arguments) : w.fbq.queue.push(arguments);
                    };
                    w.fbq.push = w.fbq;
                    w.fbq.loaded = true;
                    w.fbq.version = "2.0";
                    w.fbq.queue = [];
                }

                const script = document.createElement("script");
                script.id = "fb-pixel";
                script.async = true;
                script.src = "https://connect.facebook.net/en_US/fbevents.js";
                document.head.appendChild(script);

                w.fbq("init", settings.facebookPixelId);
                w.fbq("track", "PageView");

                const noscript = document.createElement("noscript");
                noscript.id = "fb-pixel-noscript";
                const img = document.createElement("img");
                img.height = 1;
                img.width = 1;
                img.style.display = "none";
                img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(settings.facebookPixelId)}&ev=PageView&noscript=1`;
                noscript.appendChild(img);
                document.head.appendChild(noscript);
            }
        }

    }, [settings]);

    return null;
}
