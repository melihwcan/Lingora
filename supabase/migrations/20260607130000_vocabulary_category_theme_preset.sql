ALTER TABLE public.vocabulary_category_meta
  ADD COLUMN IF NOT EXISTS theme_preset text NOT NULL DEFAULT 'slate';

-- Existing custom categories: give them a color instead of monochrome slate
UPDATE public.vocabulary_category_meta
SET theme_preset = 'indigo'
WHERE icon_name IS NOT NULL AND theme_preset = 'slate';
