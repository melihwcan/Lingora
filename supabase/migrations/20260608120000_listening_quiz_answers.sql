-- Persist listening quiz answers for restore after page refresh

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS quiz_answers jsonb DEFAULT NULL;

COMMENT ON COLUMN public.user_progress.quiz_answers IS
  'Latest listening quiz answers: { question_id: boolean }';
