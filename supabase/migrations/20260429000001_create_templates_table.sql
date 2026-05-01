-- Create templates table for Instagram Post Builder
-- Schema: user_id (FK), name, config (JSONB), timestamps

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT NOT NULL DEFAULT '1080x1080',

  -- Template configuration as JSONB
  config JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint per user
  CONSTRAINT templates_user_name_unique UNIQUE(user_id, name)
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_updated_at ON templates(updated_at DESC);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
