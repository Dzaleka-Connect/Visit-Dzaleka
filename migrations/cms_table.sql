CREATE TABLE IF NOT EXISTS content_blocks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR NOT NULL,
  key VARCHAR NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type VARCHAR DEFAULT 'text',
  last_updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default content for landing page if not exists
INSERT INTO content_blocks (section, key, value, type) VALUES
('hero', 'hero_title', 'Discover the Spirit of Dzaleka Refugee Camp', 'text'),
('hero', 'hero_subtitle', 'Join us for an immersive cultural journey. Meet resilient artists, entrepreneurs, and community leaders building a vibrant future against all odds.', 'text'),
('hero', 'hero_cta', 'Book Your Visit', 'text'),

('stats', 'stats_label_1', 'Residents', 'text'),
('stats', 'stats_label_2', 'Entrepreneurs', 'text'),
('stats', 'stats_label_3', 'Nationalities', 'text'),
('stats', 'stats_label_4', 'Visitor Rating', 'text'),

('features', 'feature_1_title', 'Smart Scheduling', 'text'),
('features', 'feature_1_desc', 'Book your visit in seconds with our real-time availability system. No more back-and-forth emails.', 'text'),
('features', 'feature_2_title', 'Expert Guides', 'text'),
('features', 'feature_2_desc', 'Connect with verified local guides who know the camp’s history, culture, and hidden gems.', 'text'),
('features', 'feature_3_title', 'Cultural Exchange', 'text'),
('features', 'feature_3_desc', 'Experience the diverse cultures of Dzaleka through food, art, and music tours.', 'text'),
('features', 'feature_4_title', 'Safe & Secure', 'text'),
('features', 'feature_4_desc', 'All visits are coordinated with camp security protocols for a safe and respectful experience.', 'text'),

('pricing', 'pricing_title', 'Transparent Pricing', 'text'),
('pricing', 'pricing_desc', 'Choose the package that fits your group size. All proceeds support the guides and community development projects.', 'text'),

('testimonials', 'testimonial_1_quote', 'An eye-opening experience that changed my perspective completely. The guides are incredibly knowledgeable and welcoming.', 'text'),
('testimonials', 'testimonial_1_author', 'Sarah Jenkins', 'text'),
('testimonials', 'testimonial_1_role', 'International Visitor', 'text'),
('testimonials', 'testimonial_2_quote', 'The booking process was seamless, and the tour was well-organized. It''s amazing to see the creativity and resilience here.', 'text'),
('testimonials', 'testimonial_2_author', 'David Mwale', 'text'),
('testimonials', 'testimonial_2_role', 'Local Tourist', 'text'),
('testimonials', 'testimonial_3_quote', 'A unique opportunity to learn about the resilience and creativity within the camp. The art market is a must-visit.', 'text'),
('testimonials', 'testimonial_3_author', 'Elena Rodriguez', 'text'),
('testimonials', 'testimonial_3_role', 'NGO Worker', 'text'),

('cta', 'cta_title', 'Ready to Plan Your Visit?', 'text'),
('cta', 'cta_desc', 'Create an account to check availability, book your tour, and manage your itinerary.', 'text'),

('footer', 'footer_description', 'Connecting visitors with the vibrant community of Dzaleka Refugee Camp through guided tours and cultural exchange.', 'text'),
('footer', 'footer_contact_email', 'visit@dzaleka.com', 'text'),
('footer', 'footer_contact_phone', '+265 123 456 789', 'text')
ON CONFLICT (key) DO NOTHING;
