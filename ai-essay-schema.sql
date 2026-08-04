-- Add AI grading column to exam_submissions
ALTER TABLE exam_submissions ADD COLUMN IF NOT EXISTS ai_grades JSONB DEFAULT NULL;