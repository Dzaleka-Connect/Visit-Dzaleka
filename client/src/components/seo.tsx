import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  name?: string;
  type?: string;
  ogImage?: string;
  keywords?: string;
  canonical?: string;
  structuredData?: object;
}

export function SEO({
  title,
  description,
  name = "Visit Dzaleka",
  type = "website",
  ogImage,
  keywords,
  canonical,
  structuredData
}: SEOProps) {
  const defaultDescription = "Book guided tours of Dzaleka Refugee Camp in Malawi. Experience vibrant African culture, meet local artists and entrepreneurs, and support refugee-led initiatives. Book your transformative cultural experience today.";
  const fullDescription = description || defaultDescription;
  const defaultKeywords = "Dzaleka tours, refugee camp visit Malawi, cultural tourism Africa, book Dzaleka tour, Tumaini Festival, refugee camp tours, Malawi tourism, cultural exchange, guided tours Malawi, visit Dzaleka, book tour refugee camp, African cultural experience, responsible tourism Malawi";

  // Default structured data for tour service
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristAttraction",
        "name": "Dzaleka Refugee Camp Cultural Tours",
        "description": fullDescription,
        "url": "https://visit.dzaleka.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Dowa",
          "addressRegion": "Central Region",
          "addressCountry": "MW"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "-13.7833",
          "longitude": "33.9833"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "08:00",
          "closes": "17:00"
        },
        "priceRange": "MWK 15,000 - MWK 80,000"
      },
      {
        "@type": "TourReservationService",
        "name": "Visit Dzaleka - Book Your Tour",
        "description": "Official booking platform for guided cultural tours of Dzaleka Refugee Camp",
        "url": "https://visit.dzaleka.com",
        "provider": {
          "@type": "Organization",
          "name": "Visit Dzaleka",
          "url": "https://services.dzaleka.com"
        },
        "areaServed": {
          "@type": "Place",
          "name": "Dzaleka Refugee Camp, Malawi"
        },
        "serviceType": "Guided Cultural Tours"
      },
      {
        "@type": "WebSite",
        "name": "Visit Dzaleka",
        "url": "https://visit.dzaleka.com",
        "potentialAction": {
          "@type": "ReserveAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://visit.dzaleka.com",
            "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
          },
          "result": {
            "@type": "Reservation",
            "name": "Tour Booking"
          }
        }
      }
    ]
  };

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title} | {name}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="author" content="Visit Dzaleka" />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Geo tags for local SEO */}
      <meta name="geo.region" content="MW" />
      <meta name="geo.placename" content="Dzaleka, Dowa, Malawi" />
      <meta name="geo.position" content="-13.7833;33.9833" />
      <meta name="ICBM" content="-13.7833, 33.9833" />

      {/* Language */}
      <meta httpEquiv="content-language" content="en" />
      <link rel="alternate" hrefLang="en" href="https://services.dzaleka.com/visit/" />

      {/* Open Graph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Visit Dzaleka" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:url" content="https://services.dzaleka.com/visit/" />
      <meta property="og:locale" content="en_US" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:alt" content="Visit Dzaleka - Cultural Tours" />}

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@DzalekaOnline" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={fullDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Structured Data / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
}

