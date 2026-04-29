-- Keep Help Center guidance aligned with the current visitor, guide, payment,
-- training, and email workflows.

INSERT INTO public.help_articles (title, slug, content, category, audience, sort_order, is_published)
VALUES
  (
    'Visitor booking and payment basics',
    'visitor-booking-and-payment-basics',
    '# Visitor booking and payment basics

## Booking request
- Submit your preferred visit date, time, group size, tour type, and contact details.
- Public booking requests start as pending until staff confirm the visit.
- GetYourGuide bookings are created as confirmed because payment and scheduling come from the partner booking.

## Payment
- Visitors can report that payment was made by cash, Airtel Money, TNM Mpamba, or card.
- Reported payment does not mark the booking paid automatically.
- Staff verify the payment before the booking becomes paid.
- When online payment is confirmed, Visit Dzaleka sends a payment receipt email.

## Changes
- If the visit date or time changes, visitors receive a reschedule email with the old and new details.
- If a booking is cancelled, visitors receive a cancellation email with the reason and rescheduling instructions.',
    'visitor_help',
    'visitor',
    10,
    true
  ),
  (
    'Guide tour workflow',
    'guide-tour-workflow',
    '# Guide tour workflow

## Before the tour
- Review your assigned tours from the Guide Dashboard or My Tours.
- Check availability and required training readiness before accepting sensitive assignments.
- Review visitor notes, group size, preferred language, selected zones, special requests, and accessibility needs.

## During the tour
- Use the QR scanner or Check in visitor action when the visitor arrives.
- Mark no-show only when the visitor does not arrive after staff-approved waiting time.
- Use Check out when the tour is complete.

## After the tour
- Completed tours are used to calculate guide totals and earnings.
- Visitors receive a feedback request after completion.',
    'guide_help',
    'guide',
    20,
    true
  ),
  (
    'Training progress and readiness',
    'guide-training-progress-and-readiness',
    '# Training progress and readiness

## How percentages are calculated
- Training percentage counts required, active guide modules only.
- A module counts once when its status is completed.
- Duplicate progress records do not increase the percentage beyond 100%.

## Readiness expectations
- Coordinators should check training progress before assigning guides.
- Guides with incomplete required modules can receive reminder emails.
- Training completion supports assignment decisions, but coordinators still make the final readiness call.',
    'guide_help',
    'guide',
    30,
    true
  ),
  (
    'Email notifications you may receive',
    'email-notifications-you-may-receive',
    '# Email notifications you may receive

## Visitors
- Booking request received
- Booking confirmed
- Booking rescheduled
- Booking cancelled
- Reminder before visit
- Guide assigned or guide changed
- Check-in confirmation
- Payment receipt
- Feedback request
- Support ticket received or resolved

## Guides
- New tour assignment
- Guide assignment changed or released
- Training reminder

## Staff
- High-severity incident alert
- Low rating alert
- Recurring booking generation summary',
    'faq',
    'both',
    40,
    true
  ),
  (
    'Support tickets',
    'support-tickets',
    '# Support tickets

## When to create a ticket
- Use a support ticket for account issues, booking questions, payment clarification, or help center gaps.
- Include the booking reference when the issue relates to a visit.

## What happens next
- You receive an email confirming that the ticket was received.
- Staff review and update the ticket in Help Center Admin.
- When the ticket is resolved, you receive a resolved ticket email with any staff notes.',
    'general',
    'both',
    50,
    true
  )
ON CONFLICT (slug) DO UPDATE
SET
  title = excluded.title,
  content = excluded.content,
  category = excluded.category,
  audience = excluded.audience,
  sort_order = excluded.sort_order,
  is_published = excluded.is_published,
  updated_at = now();
