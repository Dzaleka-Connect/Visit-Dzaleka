-- Seed operational email templates that are now wired to real sends.
-- Existing customized subject/body text is preserved; variables and descriptions
-- are refreshed so the admin template UI stays accurate.

INSERT INTO public.email_templates (name, subject, body, description, variables, is_active)
VALUES
  (
    'booking_cancelled',
    'Booking cancelled - {{booking_id}}',
    'Dear {{visitor_name}},

Your Visit Dzaleka booking has been cancelled.

Booking Details:
- Reference: {{booking_id}}
- Date: {{visit_date}}
- Time: {{visit_time}}
- Meeting Point: {{meeting_point}}

Reason:
{{cancellation_reason}}

If you would like to request a new date, use this link or reply to this email:
{{reschedule_link}}

Best regards,
Visit Dzaleka Team',
    'Sent when staff or visitors cancel a booking',
    '["visitor_name","booking_id","visit_date","visit_time","meeting_point","cancellation_reason","reschedule_link"]'::jsonb,
    true
  ),
  (
    'guide_assignment_changed',
    'Guide assignment updated - {{booking_id}}',
    'Hello,

{{assignment_change}}

Booking Details:
- Reference: {{booking_id}}
- Visitor: {{visitor_name}}
- Date: {{visit_date}}
- Time: {{visit_time}}
- Meeting Point: {{meeting_point}}

Guide Details:
- Previous Guide: {{old_guide_name}}
- New Guide: {{new_guide_name}}

Best regards,
Visit Dzaleka Team',
    'Sent when a booking guide changes after the first assignment',
    '["assignment_change","booking_id","visitor_name","visit_date","visit_time","meeting_point","old_guide_name","new_guide_name"]'::jsonb,
    true
  ),
  (
    'payment_receipt',
    'Payment receipt - {{booking_id}}',
    'Dear {{visitor_name}},

We have received payment for your Visit Dzaleka booking.

Receipt Details:
- Reference: {{booking_id}}
- Amount: {{total_amount}}
- Payment Method: {{payment_method}}
- Payment Reference: {{payment_reference}}
- Paid At: {{paid_at}}

Thank you for supporting Visit Dzaleka.

Best regards,
Visit Dzaleka Team',
    'Sent when staff or payment webhooks mark a booking as paid',
    '["visitor_name","booking_id","total_amount","payment_method","payment_reference","paid_at"]'::jsonb,
    true
  ),
  (
    'support_ticket_created',
    'Support ticket received - {{ticket_subject}}',
    'Hello,

We received your support ticket and our team will review it.

Ticket Details:
- Ticket ID: {{ticket_id}}
- Subject: {{ticket_subject}}
- Status: {{ticket_status}}

You can view your tickets here:
{{support_link}}

Best regards,
Visit Dzaleka Team',
    'Sent to visitors when a support ticket is created',
    '["ticket_id","ticket_subject","ticket_status","support_link"]'::jsonb,
    true
  ),
  (
    'support_ticket_resolved',
    'Support ticket resolved - {{ticket_subject}}',
    'Hello,

Your support ticket has been updated.

Ticket Details:
- Ticket ID: {{ticket_id}}
- Subject: {{ticket_subject}}
- Status: {{ticket_status}}

Team Note:
{{admin_notes}}

You can review it here:
{{support_link}}

Best regards,
Visit Dzaleka Team',
    'Sent to visitors when a support ticket is resolved',
    '["ticket_id","ticket_subject","ticket_status","admin_notes","support_link"]'::jsonb,
    true
  ),
  (
    'incident_alert',
    'Incident alert: {{incident_severity}} - {{incident_title}}',
    'Hello team,

A high-priority incident has been reported.

Incident Details:
- Title: {{incident_title}}
- Severity: {{incident_severity}}
- Location: {{incident_location}}
- Reported By: {{incident_reporter}}

Description:
{{admin_notes}}

Review in Security:
{{support_link}}',
    'Sent to internal staff when high-severity incidents are reported',
    '["incident_title","incident_severity","incident_location","incident_reporter","admin_notes","support_link"]'::jsonb,
    true
  ),
  (
    'low_rating_alert',
    'Low rating alert - {{guide_name}}',
    'Hello team,

A low tour rating needs review.

Details:
- Guide: {{guide_name}}
- Rating: {{rating}}/5
- Visitor: {{visitor_name}}
- Booking: {{booking_id}}
- Visit Date: {{visit_date}}

Open guide performance:
{{support_link}}',
    'Sent to internal staff when a guide receives a low rating',
    '["guide_name","rating","visitor_name","booking_id","visit_date","support_link"]'::jsonb,
    true
  ),
  (
    'recurring_booking_generated',
    'Recurring bookings generated for {{visitor_name}}',
    'Hello,

Recurring bookings have been generated.

Details:
- Visitor or Organization Contact: {{visitor_name}}
- Email: {{visitor_email}}
- Generated Count: {{generated_count}}
- Dates: {{generated_dates}}

Review bookings:
{{support_link}}',
    'Sent when recurring bookings generate confirmed bookings',
    '["visitor_name","visitor_email","generated_count","generated_dates","support_link"]'::jsonb,
    true
  ),
  (
    'guide_training_reminder',
    'Training reminder - Visit Dzaleka',
    'Hello {{guide_name}},

Your required guide training is {{training_percentage}}% complete.

Please complete:
{{incomplete_modules}}

Continue training:
{{support_link}}

Best regards,
Visit Dzaleka Team',
    'Sent to guides with incomplete required training',
    '["guide_name","training_percentage","incomplete_modules","support_link"]'::jsonb,
    true
  ),
  (
    'welcome_or_email_verification',
    'Welcome to Visit Dzaleka – Planning Your Visit',
    'Hi {{visitor_name}},

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
    'Sent when a user account is created or accepts an invite',
    '["visitor_name","visitor_email","verification_link","support_link"]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE
SET
  description = excluded.description,
  variables = excluded.variables,
  updated_at = now();
