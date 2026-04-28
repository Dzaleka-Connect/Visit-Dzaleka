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
