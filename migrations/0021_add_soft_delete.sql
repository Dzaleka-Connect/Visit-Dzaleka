-- Add soft delete support for guides, zones, and tasks
ALTER TABLE guides ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for efficient filtering of non-deleted records
CREATE INDEX IF NOT EXISTS idx_guides_deleted_at ON guides(deleted_at);
CREATE INDEX IF NOT EXISTS idx_zones_deleted_at ON zones(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);

COMMENT ON COLUMN guides.deleted_at IS 'Soft delete timestamp - null means active';
COMMENT ON COLUMN zones.deleted_at IS 'Soft delete timestamp - null means active';
COMMENT ON COLUMN tasks.deleted_at IS 'Soft delete timestamp - null means active';
