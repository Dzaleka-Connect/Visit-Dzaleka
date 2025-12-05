-- Dzaleka Visit Service - Database Schema Migration
-- Execute this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/efpcutyycylotscfrwaj/sql

-- Create enums (using DO blocks to avoid errors if they already exist)
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE group_size AS ENUM ('individual', 'small_group', 'large_group', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tour_type AS ENUM ('standard', 'extended', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('airtel_money', 'tnm_mpamba', 'cash');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'coordinator', 'guide', 'security', 'visitor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM ('reported', 'investigating', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'check_in', 'check_out', 'verify');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Sessions table for session storage
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users table with email/password authentication
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  phone VARCHAR,
  role user_role DEFAULT 'visitor',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  password_reset_token VARCHAR,
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Guides table
CREATE TABLE IF NOT EXISTS guides (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR NOT NULL,
  profile_image_url VARCHAR,
  bio TEXT,
  languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  assigned_zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  total_tours INTEGER DEFAULT 0,
  completed_tours INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Zones table
CREATE TABLE IF NOT EXISTS zones (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  is_active BOOLEAN DEFAULT true,
  total_visits INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Points of Interest table
CREATE TABLE IF NOT EXISTS points_of_interest (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  zone_id VARCHAR,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meeting Points table
CREATE TABLE IF NOT EXISTS meeting_points (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR NOT NULL,
  description TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pricing Config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR NOT NULL,
  group_size group_size NOT NULL,
  min_people INTEGER DEFAULT 1,
  max_people INTEGER,
  base_price INTEGER NOT NULL,
  additional_hour_price INTEGER DEFAULT 10000,
  currency VARCHAR DEFAULT 'MWK',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_reference VARCHAR UNIQUE,
  visitor_name VARCHAR NOT NULL,
  visitor_email VARCHAR NOT NULL,
  visitor_phone VARCHAR NOT NULL,
  visitor_user_id VARCHAR,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  group_size group_size NOT NULL,
  number_of_people INTEGER DEFAULT 1,
  tour_type tour_type NOT NULL,
  custom_duration INTEGER,
  meeting_point_id VARCHAR,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  payment_reference VARCHAR,
  payment_verified_by VARCHAR,
  payment_verified_at TIMESTAMP,
  status booking_status DEFAULT 'pending',
  selected_zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  selected_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  special_requests TEXT,
  accessibility_needs TEXT,
  referral_source VARCHAR,
  total_amount INTEGER,
  assigned_guide_id VARCHAR,
  admin_notes TEXT,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  check_in_by VARCHAR,
  check_out_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Guide Availability table
CREATE TABLE IF NOT EXISTS guide_availability (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  guide_id VARCHAR NOT NULL,
  day_of_week INTEGER,
  date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Booking Companions table
CREATE TABLE IF NOT EXISTS booking_companions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  relationship VARCHAR,
  special_needs TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Booking Activity Logs table
CREATE TABLE IF NOT EXISTS booking_activity_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id VARCHAR NOT NULL,
  user_id VARCHAR,
  action VARCHAR NOT NULL,
  description TEXT,
  old_status VARCHAR,
  new_status VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id VARCHAR,
  reported_by VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  severity incident_severity DEFAULT 'medium',
  status incident_status DEFAULT 'reported',
  location VARCHAR,
  involved_parties TEXT,
  actions_taken TEXT,
  resolved_by VARCHAR,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  action audit_action NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Zone Visits table
CREATE TABLE IF NOT EXISTS zone_visits (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id VARCHAR NOT NULL,
  zone_id VARCHAR NOT NULL,
  visited_at TIMESTAMP DEFAULT NOW(),
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email Logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sent_by VARCHAR NOT NULL,
  recipient_name VARCHAR,
  recipient_email VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Success message
SELECT 'Database schema created successfully!' AS message;
