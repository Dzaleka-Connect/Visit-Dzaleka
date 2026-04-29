-- Update the signup welcome email to the warmer visitor planning copy.
-- This intentionally updates the operational default template in place.

UPDATE email_templates
SET
  subject = 'Welcome to Visit Dzaleka – Planning Your Visit',
  body = 'Hi {{visitor_name}},

Thank you for signing up with Visit Dzaleka! We’re excited to share the stories, culture, and community of Dzaleka Refugee Camp with you.

We’d love to hear if you’re planning a visit soon and help you make the most of your experience. From guided tours to community activities, we can tailor your visit to suit your interests.

Feel free to reply to this email with your travel plans or any questions you have, and we’ll help you get started.

Looking forward to welcoming you to Dzaleka!

You can verify your account here:
{{verification_link}}

Need help?
{{support_link}}

Kind regards,
Bakari Mustafa
Visit Dzaleka Team',
  variables = '["visitor_name","visitor_email","verification_link","support_link"]'::jsonb,
  updated_at = NOW()
WHERE name = 'welcome_or_email_verification';
