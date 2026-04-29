-- Seed newly wired automated email templates.
-- Existing customized templates are preserved, except feedback_request receives
-- the feedback link body if it still lacks the new variable.

INSERT INTO public.email_templates (name, subject, body, description, variables, is_active)
VALUES
  (
    'booking_rescheduled',
    'Booking rescheduled - {{booking_id}}',
    'Dear {{visitor_name}},

Your Visit Dzaleka booking has been rescheduled.

Previous Details:
- Date: {{old_visit_date}}
- Time: {{old_visit_time}}

New Details:
- Date: {{new_visit_date}}
- Time: {{new_visit_time}}
- Meeting Point: {{meeting_point}}
- Guide: {{guide_name}}

If this new time does not work for you, please reply to this email as soon as possible.

Best regards,
Visit Dzaleka Team',
    'Sent when staff reschedule a booking',
    '["visitor_name","booking_id","old_visit_date","old_visit_time","new_visit_date","new_visit_time","meeting_point","guide_name"]'::jsonb,
    true
  ),
  (
    'feedback_request',
    'How was your Visit Dzaleka experience?',
    'Dear {{visitor_name}},

Thank you for visiting Dzaleka Refugee Camp on {{visit_date}}.

We hope you had a meaningful and educational experience. Your feedback helps us improve our services and better share the stories of our community.

We would love to hear your thoughts:
- What did you enjoy most about the tour?
- How was your guide, {{guide_name}}?
- Any suggestions for improvement?

Share feedback here: {{feedback_link}}

Thank you for your support in sharing the Dzaleka story with the world.

Warm regards,
Visit Dzaleka Team',
    'Sent after a tour is completed',
    '["visitor_name","visit_date","guide_name","feedback_link"]'::jsonb,
    true
  ),
  (
    'guide_tour_assignment',
    'New tour assignment - {{booking_id}}',
    'Hello {{guide_name}},

You have been assigned to a Visit Dzaleka tour.

Tour Details:
- Reference: {{booking_id}}
- Visitor: {{visitor_name}}
- Visitor Email: {{visitor_email}}
- Visitor Phone: {{visitor_phone}}
- Organization: {{visitor_organization}}
- Date: {{visit_date}}
- Time: {{visit_time}}
- Group Size: {{number_of_people}}
- Meeting Point: {{meeting_point}}
- Selected Zones: {{selected_zones}}

Notes:
- Special Requests: {{special_requests}}
- Accessibility Needs: {{accessibility_needs}}

Please review the booking details before the tour.

Best regards,
Visit Dzaleka Team',
    'Sent to guides when staff assign them to a tour',
    '["guide_name","booking_id","visitor_name","visitor_email","visitor_phone","visitor_organization","visit_date","visit_time","number_of_people","meeting_point","selected_zones","special_requests","accessibility_needs"]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE
SET
  description = excluded.description,
  variables = excluded.variables,
  body = CASE
    WHEN email_templates.name = 'feedback_request'
      AND email_templates.body NOT LIKE '%{{feedback_link}}%'
      THEN excluded.body
    ELSE email_templates.body
  END,
  updated_at = now();
