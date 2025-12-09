-- ================================================
-- HELP CENTER MIGRATION
-- ================================================
-- Run this in your Supabase SQL Editor

-- Help article categories
DO $$ BEGIN
    CREATE TYPE help_category AS ENUM ('faq', 'getting_started', 'guide_help', 'visitor_help', 'general');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Target audience for articles
DO $$ BEGIN
    CREATE TYPE help_audience AS ENUM ('visitor', 'guide', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Support ticket status
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Support ticket priority
DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Help articles table
CREATE TABLE IF NOT EXISTS help_articles (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category help_category NOT NULL DEFAULT 'general',
    audience help_audience NOT NULL DEFAULT 'both',
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_by VARCHAR,
    updated_by VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'normal',
    assigned_to VARCHAR,
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_audience ON help_articles(audience);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Enable RLS
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive - backend handles access control)
DROP POLICY IF EXISTS "help_articles_policy" ON help_articles;
CREATE POLICY "help_articles_policy" ON help_articles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "support_tickets_policy" ON support_tickets;
CREATE POLICY "support_tickets_policy" ON support_tickets FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- SEED DATA - Sample Help Articles
-- ================================================

-- Visitor FAQs
INSERT INTO help_articles (title, slug, content, category, audience, sort_order) VALUES
('How do I book a tour?', 'how-to-book-tour', 
'## Booking a Tour

1. **Log in** to your account or create one
2. Go to **Dashboard** and click "Book a Visit"
3. Select your preferred **date and time**
4. Choose your **group size** and **tour type**
5. Select a **meeting point**
6. Complete the **payment**
7. You''ll receive a confirmation email with your booking details

### Tips
- Book at least 24 hours in advance
- Check the calendar for guide availability
- Have your payment method ready', 
'faq', 'visitor', 1),

('What payment methods are accepted?', 'payment-methods',
'## Accepted Payment Methods

We accept the following payment methods:

- **Cash** - Pay on arrival at the meeting point
- **Mobile Money** - Airtel Money or TNM Mpamba
- **Bank Transfer** - For group bookings

### Payment Process
1. Select your preferred payment method during booking
2. For mobile money, you''ll receive payment instructions
3. Cash payments are collected by your guide before the tour starts

### Refund Policy
- Full refund for cancellations 48+ hours before
- 50% refund for cancellations 24-48 hours before
- No refund for cancellations less than 24 hours',
'faq', 'visitor', 2),

('What should I expect during my visit?', 'what-to-expect',
'## Your Visit Experience

### Before the Tour
- Arrive at your chosen meeting point 10 minutes early
- Wear comfortable walking shoes
- Bring water and sun protection
- **Optional**: Carry ID for immigration/police checkpoints if needed

### During the Tour
- Your guide will introduce you to the camp
- You''ll visit various zones based on your tour type
- Feel free to ask questions
- Photography is allowed in designated areas

### After the Tour
- You can rate your experience
- Leave feedback for your guide
- Pay your guide directly',
'getting_started', 'visitor', 1),

('What types of tours do you offer?', 'tour-types',
'## Tour Types

We offer guided walking tours of Dzaleka Refugee Camp, where visitors can:
- Explore key areas of the camp
- Learn about the camp''s history and community
- Engage directly with residents

### Tour Options
- **Standard Tour** (2 hours) - Overview of camp life
- **Extended Tour** (4 hours) - Deeper exploration
- **Custom Tour** - Tailored to your interests

All tours are conducted on foot with a local guide who knows the community personally.',
'faq', 'visitor', 4),

('What are the different zones in Dzaleka?', 'camp-zones',
'## Dzaleka Camp Zones

Dzaleka Refugee Camp is divided into several distinct zones, each with unique characteristics:

### Main Zones
- **Lisungwi** - Central community area
- **Kawale 1 & 2** - Residential sections
- **Likuni 1 & 2** - Mixed residential and commercial
- **Zomba** - Community services area
- **Blantyre** - Active marketplace zone
- **Katubza** - Established residential
- **New Katubza** - Newer settlement area
- **Dzaleka Hill** - Elevated residential zone

Each zone has its own community features, businesses, and gathering spaces.',
'faq', 'visitor', 5),

('What should I bring for the tour?', 'what-to-bring',
'## Packing List for Your Visit

### Essential Items
- **Comfortable walking shoes** - Tours involve walking on unpaved paths
- **Hat and sunscreen** - Sun protection is important
- **Water bottle** - Stay hydrated
- **Camera** - Capture memories (with permission)

### Recommended Items
- Light, breathable clothing
- Small backpack
- Snacks
- Cash for local purchases (Malawian Kwacha)

### Note
Tours are conducted entirely on foot, so dress comfortably!',
'faq', 'visitor', 6),

('What activities can I experience?', 'tour-activities',
'## Activities During Your Visit

### Cultural Experiences
- **Cultural exchanges** with camp residents
- **Educational workshops** about refugee life
- **Community initiatives** and projects

### Special Events
- **Tumaini Festival** - Annual celebration featuring:
  - Live music performances
  - Art exhibitions
  - Cultural performances
  - Food tasting

### Engagement Opportunities
- Meet **local entrepreneurs** and artisans
- Visit **community businesses**
- Learn about **ongoing projects**
- Support local initiatives through purchases',
'faq', 'visitor', 7),

('What are the tour timings?', 'tour-timings',
'## Tour Schedule

### Operating Days
**Monday through Friday**

### Standard Start Times
- **10:00 AM** - Morning tour
- **2:00 PM** - Afternoon tour

### Tour Duration
- **Standard Tour**: 2 hours
- **Extended Tour**: 4 hours
- **Custom Tours**: Flexible duration

### Booking
- Book at least 48 hours in advance
- Start times can be adjusted for groups
- Weekend tours available by special arrangement',
'faq', 'visitor', 8),

('Do you offer group discounts?', 'group-discounts',
'## Group Pricing

Yes! We offer special rates for groups:

### Standard Rates
| Group Size | Price (MWK) |
|------------|-------------|
| Individual | 15,000 |
| Small Group (2-5) | 50,000 |
| Large Group (6-10) | 80,000 |
| Extra Large (10+) | 100,000 |

### What''s Included
- Professional guide for your entire group
- 2-hour standard tour
- Community support contribution

### Additional Hours
- MWK 10,000 per extra hour (any group size)

Contact us for custom group arrangements!',
'faq', 'visitor', 9),

('Are tours family-friendly?', 'family-tours',
'## Family-Friendly Tours

**Yes!** Our tours are suitable for all ages.

### For Families
- Tours can be adjusted for **children''s attention spans**
- Walking pace can be **modified for younger visitors**
- Content is appropriate for all ages
- **Interactive elements** engage younger visitors

### Child-Friendly Features
- Stories and cultural sharing
- Opportunities to meet local children
- Hands-on craft demonstrations
- Kid-friendly snack stops available

Let us know the ages of your children when booking so we can best prepare!',
'faq', 'visitor', 10),

('Where do tours start from?', 'meeting-points',
'## Meeting Points

Tours can start from three recommended locations:

### 1. UNHCR Office
- Primary meeting point
- Easy to locate
- Parking available

### 2. Appfactory
- Central location
- Tech hub in the camp
- Good starting point for tech-focused tours

### 3. JRS (Jesuit Refugee Service)
- Well-known landmark
- Educational center
- Good for education-focused visits

### Confirmation
Your specific meeting point will be confirmed upon booking based on:
- Your tour type
- Starting time
- Group size',
'faq', 'visitor', 11)
ON CONFLICT (slug) DO NOTHING;

-- Guide FAQs
INSERT INTO help_articles (title, slug, content, category, audience, sort_order) VALUES
('How do I get paid?', 'guide-payment',
'## Guide Payment Process

### How It Works
You receive **100% of the tour payment** directly from the visitor at the end of each tour.

### Payment Methods Accepted
- **Cash** - Most common
- **Airtel Money** - Mobile money transfer
- **TNM Mpamba** - Mobile money transfer

### When You Get Paid
- Payment is collected **immediately after tour completion**
- The visitor pays you directly
- No waiting for weekly payouts

### Tracking Your Earnings
1. Go to your **Dashboard**
2. Check the "Earnings" section
3. View completed tour history

### Tips
- Confirm payment method with visitor before starting
- Provide excellent service for tips',
'faq', 'guide', 1),

('How do I manage my availability?', 'guide-availability',
'## Managing Your Schedule

### Setting Availability
1. Go to **Calendar** in the sidebar
2. Click on dates to mark as available/unavailable
3. Set your working hours for each day

### Accepting Bookings
- You''ll receive notifications for new bookings
- Review booking details before accepting
- Check visitor requirements and group size

### Cancelling a Booking
- Only cancel if absolutely necessary
- Notify the coordinator immediately
- Another guide will be assigned',
'getting_started', 'guide', 1),

('How do I complete my training?', 'guide-training-help',
'## Guide Training Program

### Accessing Training
1. Go to **Guide Training** in the sidebar
2. View all required training modules
3. Complete each module in order

### Training Categories
- **Safety & Security** - Emergency procedures
- **Cultural Sensitivity** - Working with diverse groups
- **Tour Delivery** - Presentation skills

### Certification
- Complete all required modules
- Achieve a passing score
- Receive your certified guide badge',
'getting_started', 'guide', 2)
ON CONFLICT (slug) DO NOTHING;

-- General Articles (for both)
INSERT INTO help_articles (title, slug, content, category, audience, sort_order) VALUES
('How do I contact support?', 'contact-support',
'## Getting Help

### Quick Support
Use the **Contact Support** button on the Help Center page to submit a ticket.

### What to Include
- Clear description of your issue
- Any error messages you see
- Screenshots if helpful

### Response Time
- **Urgent issues**: Within 2 hours
- **Normal requests**: Within 24 hours

### Emergency Contact
For urgent safety issues, contact the security team directly through the Messages feature.

### Need a Custom Quote?
For specialized tours or group arrangements:
- **Email**: dzalekaconnect@gmail.com
- Use the Contact Us form on this page',
'general', 'both', 1),

('How do I update my profile?', 'update-profile',
'## Updating Your Profile

### Access Profile Settings
1. Click **My Profile** in the sidebar
2. Or click your avatar at the bottom of the sidebar

### What You Can Update
- Profile photo
- Contact information
- Notification preferences
- Password

### For Guides
You can also update:
- Languages spoken
- Specialties
- Available zones',
'general', 'both', 2),

('Terms and Conditions', 'terms-and-conditions',
'## Booking Terms & Conditions

### Booking Requirements
- All bookings must be made at least **48 hours in advance**
- Visitors must be registered on the platform

### Payment Options
Payment is collected **on arrival** - no online payment required:
- **Airtel Money** - Mobile money transfer
- **TNM Mpamba** - Mobile money transfer  
- **Cash** - Pay in person at the meeting point

### Cancellation Policy
- **24+ hours before**: Full refund available
- **Less than 24 hours**: No refund

### Tour Conditions
- Tours are subject to **weather conditions** and camp accessibility
- Visitors must follow camp guidelines and **respect local customs**
- **Photography** requires prior permission and must follow guidelines

### Important Notes
- Standard visit duration is up to **2 hours**
- Additional hours: **MWK 10,000 per hour** (any group size)
- Tours are conducted **entirely on foot** - no transportation provided
- **Meals and refreshments** are NOT included in the tour price
- Prices include guided tour and local community support

Please review our visitor guidelines before booking.',
'general', 'both', 3),

('Pricing Information', 'pricing-info',
'## Tour Pricing

### Standard Rates
Prices vary by group size:
- **Individual**: MWK 15,000
- **Small Group** (2-5 people): MWK 50,000
- **Large Group** (6-10 people): MWK 80,000
- **Custom Tours**: MWK 100,000+

### Additional Charges
- **Extra hours**: MWK 10,000 per hour (any group size)
- Extended tours include 2 additional hours in base price

### What''s Included
- Professional local guide
- Guided tour of camp zones
- Local community support
- Visit certificate

### What''s NOT Included
- Transportation to/from meeting point
- Meals and refreshments
- Personal expenses
- Photography equipment

### Payment on Arrival
No online payment required! You''ll pay when you arrive at the camp via:
- Airtel Money
- TNM Mpamba
- Cash',
'faq', 'visitor', 3)
ON CONFLICT (slug) DO NOTHING;

-- Add to supabase_realtime publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE help_articles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
