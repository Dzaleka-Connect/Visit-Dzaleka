-- Task Management System Migration
-- Run this in Supabase SQL Editor

-- Task Priority Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
END$$;

-- Task Status Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'under_review', 'completed', 'cancelled');
  END IF;
END$$;

-- Task Category Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_category') THEN
    CREATE TYPE task_category AS ENUM ('tour_prep', 'training', 'admin', 'maintenance', 'communication', 'documentation', 'other');
  END IF;
END$$;

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'other',
  priority VARCHAR(10) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  assigned_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50),
  parent_task_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Attachments Table
CREATE TABLE IF NOT EXISTS task_attachments (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task History Table (for audit trail)
CREATE TABLE IF NOT EXISTS task_history (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  field_name VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);

-- Trigger to update updated_at on tasks
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_updated_at();

-- Sample seed data (optional - uncomment to use)
-- INSERT INTO tasks (title, description, category, priority, status) VALUES
--   ('Welcome new visitors', 'Prepare welcome materials for incoming tour group', 'tour_prep', 'high', 'pending'),
--   ('Complete safety training', 'Review and complete monthly safety training module', 'training', 'medium', 'pending'),
--   ('Update tour routes', 'Review and update tour route documentation', 'documentation', 'low', 'pending');
