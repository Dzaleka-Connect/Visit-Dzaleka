import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AnalyticsSetting } from "@shared/schema";

export function AnalyticsTracker() {
    const { data: settings } = useQuery<AnalyticsSetting>({
        queryKey: ["/api/settings/analytics"],
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!settings || !settings.isEnabled) return;

        const w = window as any;

        // Helper to ensure dataLayer exists
        const ensureGtag = () => {
            if (!w.dataLayer) {
                w.dataLayer = [];
                w.gtag = function () { w.dataLayer.push(arguments); }
                w.gtag('js', new Date());
            }
        };

        // 1. Google Analytics 4
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

        // 2. Google Ads
        if (settings.googleAdsConversionId) {
            // If GA4 is not present, we might need to load gtag lib.
            // If GA4 IS present, the lib is same.
            if (!document.getElementById("ga4-script") && !document.getElementById("google-ads-script")) {
                ensureGtag();
                const script = document.createElement("script");
                script.id = "google-ads-script";
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleAdsConversionId}`;
                document.head.appendChild(script);
            } else {
                ensureGtag(); // ensure window.gtag is available
            }

            // Add Ads config
            // Check if config already added to avoid duplicates on re-renders? 
            // useEffect runs once if deps correct/stale.
            // We'll proceed.
            w.gtag('config', settings.googleAdsConversionId);
        }

        // 3. Facebook Pixel
        if (settings.facebookPixelId) {
            if (!document.getElementById("fb-pixel")) {
                const script = document.createElement("script");
                script.id = "fb-pixel";
                script.innerHTML = `
             !function(f,b,e,v,n,t,s)
             {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
             n.callMethod.apply(n,arguments):n.queue.push(arguments)};
             if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
             n.queue=[];t=b.createElement(e);t.async=!0;
             t.src=v;s=b.getElementsByTagName(e)[0];
             s.parentNode.insertBefore(t,s)}(window, document,'script',
             'https://connect.facebook.net/en_US/fbevents.js');
             fbq('init', '${settings.facebookPixelId}');
             fbq('track', 'PageView');
           `;
                document.head.appendChild(script);

                const noscript = document.createElement("noscript");
                noscript.innerHTML = `<img height="1" width="1" style="display:none"
             src="https://www.facebook.com/tr?id=${settings.facebookPixelId}&ev=PageView&noscript=1"
           />`;
                document.head.appendChild(noscript);
            }
        }

    }, [settings]);

    return null;
}
