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
  robots?: string;
}

export function SEO({
  title,
  description,
  name = "Visit Dzaleka",
  type = "website",
  ogImage,
  keywords,
  canonical,
  structuredData,
  robots
}: SEOProps) {
  const defaultDescription = "Book a guided visit to Dzaleka Refugee Camp in Malawi. Meet local guides, artists, entrepreneurs, and community groups while supporting refugee-led work.";
  const defaultOgImage = "https://services.dzaleka.com/images/Visit_Dzaleka.png";
  const fullDescription = description || defaultDescription;
  const fullOgImage = ogImage || defaultOgImage;
  const defaultKeywords = "Dzaleka tours, refugee camp visit Malawi, cultural tourism Africa, book Dzaleka tour, Tumaini Festival, refugee camp tours, Malawi tourism, cultural exchange, guided tours Malawi, visit Dzaleka, book tour refugee camp, African cultural experience, responsible tourism Malawi";

  // Default structured data for tour service
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://visit.dzaleka.com/#attraction",
        "additionalType": "https://schema.org/TouristAttraction",
        "name": "Dzaleka Refugee Camp Cultural Tours",
        "description": fullDescription,
        "url": "https://visit.dzaleka.com",
        "image": "https://services.dzaleka.com/images/Visit_Dzaleka.png",
        "logo": "https://services.dzaleka.com/images/dzaleka-digital-heritage.png",
        "email": "contact@mail.dzaleka.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Dzaleka Refugee Camp",
          "addressLocality": "Dowa",
          "addressRegion": "Central Region",
          "addressCountry": "MW"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "-13.7833",
          "longitude": "33.9833"
        },
        "containedInPlace": {
          "@type": "Country",
          "name": "Malawi"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "opens": "08:00",
          "closes": "17:00"
        },
        "touristType": ["Cultural Tourism", "Educational Tourism", "Responsible Tourism"],
        "availableLanguage": ["English", "French", "Swahili"],
        "tourBookingPage": "https://visit.dzaleka.com",
        "isAccessibleForFree": false,
        "priceRange": "MWK 15,000 - MWK 80,000",
        "currenciesAccepted": "MWK",
        "paymentAccepted": "Cash, Mobile Money, Bank Transfer",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Guided tour services",
          "itemListElement": [
            {
              "@type": "Offer",
              "@id": "https://visit.dzaleka.com/#offer-individual-tour",
              "name": "Solo Explorer Tour",
              "price": "15000",
              "priceCurrency": "MWK",
              "availability": "https://schema.org/InStock",
              "url": "https://visit.dzaleka.com/login",
              "itemOffered": {
                "@type": "Service",
                "name": "Solo Explorer Tour",
                "description": "2-hour guided visit to Dzaleka Refugee Camp for individual visitors.",
                "provider": { "@id": "https://visit.dzaleka.com/#attraction" }
              }
            },
            {
              "@type": "Offer",
              "@id": "https://visit.dzaleka.com/#offer-small-group-tour",
              "name": "Small Group Tour",
              "price": "50000",
              "priceCurrency": "MWK",
              "availability": "https://schema.org/InStock",
              "url": "https://visit.dzaleka.com/login",
              "itemOffered": {
                "@type": "Service",
                "name": "Small Group Tour",
                "description": "2-hour guided visit for groups of 2-5 people.",
                "provider": { "@id": "https://visit.dzaleka.com/#attraction" }
              }
            },
            {
              "@type": "Offer",
              "@id": "https://visit.dzaleka.com/#offer-medium-group-tour",
              "name": "Medium Group Tour",
              "price": "80000",
              "priceCurrency": "MWK",
              "availability": "https://schema.org/InStock",
              "url": "https://visit.dzaleka.com/login",
              "itemOffered": {
                "@type": "Service",
                "name": "Medium Group Tour",
                "description": "2-hour guided cultural tour for groups of 6-10 people.",
                "provider": { "@id": "https://visit.dzaleka.com/#attraction" }
              }
            },
            {
              "@type": "Offer",
              "@id": "https://visit.dzaleka.com/#offer-custom-group-tour",
              "name": "Large Group and Custom Tour",
              "price": "100000",
              "priceCurrency": "MWK",
              "availability": "https://schema.org/InStock",
              "url": "https://visit.dzaleka.com/login",
              "itemOffered": {
                "@type": "Service",
                "name": "Large Group and Custom Tour",
                "description": "Custom guided tours for groups of 10 or more people.",
                "provider": { "@id": "https://visit.dzaleka.com/#attraction" }
              }
            }
          ]
        },
        "sameAs": [
          "https://www.facebook.com/DzalekaOnline",
          "https://x.com/Dzalekaconnect",
          "https://www.instagram.com/dzalekaonline"
        ],
        "founder": {
          "@type": "Person",
          "name": "Bakari Mustafa",
          "jobTitle": "Founder",
          "sameAs": [
            "https://linkedin.com/in/realbakari",
            "https://x.com/realbakari"
          ]
        }
      },
      {
        "@type": "TourReservationService",
        "name": "Visit Dzaleka - Book Your Tour",
        "description": "Official booking platform for guided cultural tours of Dzaleka Refugee Camp",
        "url": "https://visit.dzaleka.com",
        "provider": {
          "@type": "Organization",
          "name": "Visit Dzaleka",
          "url": "https://visit.dzaleka.com"
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
      },
      {
        "@type": "ItemList",
        "itemListElement": [
          {
            "@type": "SiteNavigationElement",
            "position": 1,
            "name": "Book a Tour",
            "description": "Book your guided tour of Dzaleka Refugee Camp",
            "url": "https://visit.dzaleka.com/login"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 2,
            "name": "Things to Do",
            "description": "Discover activities, arts, culture, and experiences in Dzaleka",
            "url": "https://visit.dzaleka.com/things-to-do"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 3,
            "name": "Plan Your Trip",
            "description": "Essential information for planning your visit to Dzaleka",
            "url": "https://visit.dzaleka.com/plan-your-trip"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 4,
            "name": "Accommodation",
            "description": "Find places to stay near Dzaleka Refugee Camp",
            "url": "https://visit.dzaleka.com/accommodation"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 5,
            "name": "Blog",
            "description": "Stories and updates from Dzaleka Refugee Camp",
            "url": "https://visit.dzaleka.com/blog"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 6,
            "name": "Destinations",
            "description": "Explore the different zones of Dzaleka Refugee Camp",
            "url": "https://visit.dzaleka.com/destinations"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 7,
            "name": "What's On",
            "description": "Upcoming events and festivals in Dzaleka",
            "url": "https://visit.dzaleka.com/whats-on"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 8,
            "name": "About Dzaleka",
            "description": "Learn about the history and community of Dzaleka Refugee Camp",
            "url": "https://visit.dzaleka.com/about-dzaleka"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 9,
            "name": "Life in Dzaleka",
            "description": "Discover daily life and community stories from Dzaleka",
            "url": "https://visit.dzaleka.com/life-in-dzaleka"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 10,
            "name": "FAQ",
            "description": "Frequently asked questions about visiting Dzaleka",
            "url": "https://visit.dzaleka.com/faq"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 11,
            "name": "Partner With Us",
            "description": "Partnership opportunities with Visit Dzaleka",
            "url": "https://visit.dzaleka.com/partner-with-us"
          },
          {
            "@type": "SiteNavigationElement",
            "position": 12,
            "name": "Support Our Work",
            "description": "Support refugee-led initiatives in Dzaleka",
            "url": "https://visit.dzaleka.com/support-our-work"
          }
        ]
      }
    ]
  };

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title} | {name}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <meta name="robots" content={robots || "index, follow, max-image-preview:large"} />
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
      <meta property="og:url" content={canonical || "https://visit.dzaleka.com/"} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:image:alt" content={`${title} | Visit Dzaleka`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@Dzalekaconnect" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Structured Data / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
}
