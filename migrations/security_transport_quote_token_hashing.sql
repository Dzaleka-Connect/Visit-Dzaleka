-- Store live public tokens as prefixed SHA-256 hashes.
-- The prefix makes this migration idempotent while preserving active links:
-- visitors keep using the raw token from email, and the app hashes lookups.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE transport_requests
SET quote_approval_token = 'sha256:' || encode(digest(quote_approval_token, 'sha256'), 'hex')
WHERE quote_approval_token IS NOT NULL
  AND quote_approval_token NOT LIKE 'sha256:%';

UPDATE users
SET password_reset_token = 'sha256:' || encode(digest(password_reset_token, 'sha256'), 'hex')
WHERE password_reset_token IS NOT NULL
  AND password_reset_token NOT LIKE 'sha256:%';

UPDATE users
SET email_verification_token = 'sha256:' || encode(digest(email_verification_token, 'sha256'), 'hex')
WHERE email_verification_token IS NOT NULL
  AND email_verification_token NOT LIKE 'sha256:%';
