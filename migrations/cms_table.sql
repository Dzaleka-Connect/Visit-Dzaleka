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
('hero', 'hero_title', 'Visit Dzaleka with local guides.', 'text'),
('hero', 'hero_subtitle', 'Plan a respectful guided visit to Dzaleka Refugee Camp. Meet residents, community groups, artists, and entrepreneurs while supporting refugee-led work.', 'text'),
('hero', 'hero_cta', 'Book Your Visit', 'text'),

('stats', 'stats_label_1', 'Residents', 'text'),
('stats', 'stats_label_2', 'Entrepreneurs', 'text'),
('stats', 'stats_label_3', 'Nationalities', 'text'),
('stats', 'stats_label_4', 'Visitor Rating', 'text'),

('features', 'feature_1_title', 'Simple Booking', 'text'),
('features', 'feature_1_desc', 'Choose a date, group size, and focus area. The team confirms the details and helps you prepare for the visit.', 'text'),
('features', 'feature_2_title', 'Guides Who Live Here', 'text'),
('features', 'feature_2_desc', 'Visit with trained resident guides who know the camp, speak multiple languages, and can answer practical questions from lived experience.', 'text'),
('features', 'feature_3_title', 'Food, Arts, and Daily Life', 'text'),
('features', 'feature_3_desc', 'Build a visit around community markets, food, artists, schools, sports, or events, depending on what is available that day.', 'text'),
('features', 'feature_4_title', 'Safe, Coordinated Visits', 'text'),
('features', 'feature_4_desc', 'Visits follow local guidance and camp security protocols, with clear expectations for photography, privacy, and respectful conduct.', 'text'),

('pricing', 'pricing_title', 'Transparent Pricing', 'text'),
('pricing', 'pricing_desc', 'Choose the package that fits your group size. All proceeds support the guides and community development projects.', 'text'),

('testimonials', 'testimonial_1_quote', 'Warm, clear, and well organized. I left with names, places, and context I could not have found on my own.', 'text'),
('testimonials', 'testimonial_1_author', 'Sarah Jenkins', 'text'),
('testimonials', 'testimonial_1_role', 'International Visitor', 'text'),
('testimonials', 'testimonial_2_quote', 'The booking was straightforward and the guide handled the visit with care. It felt respectful from start to finish.', 'text'),
('testimonials', 'testimonial_2_author', 'David Mwale', 'text'),
('testimonials', 'testimonial_2_role', 'Local Tourist', 'text'),
('testimonials', 'testimonial_3_quote', 'A practical way to learn from residents and support local work. The art market was the highlight for me.', 'text'),
('testimonials', 'testimonial_3_author', 'Elena Rodriguez', 'text'),
('testimonials', 'testimonial_3_role', 'NGO Worker', 'text'),

('cta', 'cta_title', 'Ready to Plan Your Visit?', 'text'),
('cta', 'cta_desc', 'Create an account to check availability, book your tour, and manage your itinerary.', 'text'),

('footer', 'footer_description', 'Connecting visitors with resident guides and community-led tours in Dzaleka Refugee Camp.', 'text'),
('footer', 'footer_contact_email', 'visit@dzaleka.com', 'text'),
('footer', 'footer_contact_phone', '+265 123 456 789', 'text')
ON CONFLICT (key) DO NOTHING;
