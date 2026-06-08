-- Listening comprehension True/False questions + user_progress XP eligibility

CREATE TABLE IF NOT EXISTS public.listening_comprehension_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  statement text NOT NULL,
  correct_answer boolean NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listening_comprehension_questions_module_id
  ON public.listening_comprehension_questions(module_id);

CREATE INDEX IF NOT EXISTS idx_listening_comprehension_questions_module_order
  ON public.listening_comprehension_questions(module_id, order_index);

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS transcript_revealed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp_eligible boolean NOT NULL DEFAULT true;

ALTER TABLE public.listening_comprehension_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions for published modules"
  ON public.listening_comprehension_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      WHERE m.id = module_id AND m.is_published = true
    )
  );

CREATE POLICY "Admins can view all listening questions"
  ON public.listening_comprehension_questions
  FOR SELECT
  TO authenticated
  USING (get_is_admin(auth.uid()));

CREATE POLICY "Admins can insert listening questions"
  ON public.listening_comprehension_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (get_is_admin(auth.uid()));

CREATE POLICY "Admins can update listening questions"
  ON public.listening_comprehension_questions
  FOR UPDATE
  TO authenticated
  USING (get_is_admin(auth.uid()))
  WITH CHECK (get_is_admin(auth.uid()));

CREATE POLICY "Admins can delete listening questions"
  ON public.listening_comprehension_questions
  FOR DELETE
  TO authenticated
  USING (get_is_admin(auth.uid()));
