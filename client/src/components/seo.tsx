import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  name?: string;
  type?: string;
  ogImage?: string; // Add ogImage prop
}

export function SEO({ title, description, name = "Visit Dzaleka", type = "website", ogImage }: SEOProps) {
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title} | {name}</title>
      <meta name="description" content={description} />

      {/* Open Graph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || "Book guided tours of Dzaleka Refugee Camp highlighting vibrant culture, rich heritage, and resilient community. Experience authentic cultural performances, visit local businesses, meet community leaders, and learn about refugee life in Malawi's largest settlement."} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description || "Book guided tours of Dzaleka Refugee Camp highlighting vibrant culture, rich heritage, and resilient community. Experience authentic cultural performances, visit local businesses, meet community leaders, and learn about refugee life in Malawi's largest settlement."} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
}
