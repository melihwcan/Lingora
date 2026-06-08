CREATE TABLE IF NOT EXISTS public.vocabulary_category_meta (
  category text PRIMARY KEY,
  label_tr text,
  icon_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vocabulary_category_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vocabulary category meta"
  ON public.vocabulary_category_meta
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert vocabulary category meta"
  ON public.vocabulary_category_meta
  FOR INSERT
  TO authenticated
  WITH CHECK (get_is_admin(auth.uid()));

CREATE POLICY "Admins can update vocabulary category meta"
  ON public.vocabulary_category_meta
  FOR UPDATE
  TO authenticated
  USING (get_is_admin(auth.uid()))
  WITH CHECK (get_is_admin(auth.uid()));

CREATE POLICY "Admins can delete vocabulary category meta"
  ON public.vocabulary_category_meta
  FOR DELETE
  TO authenticated
  USING (get_is_admin(auth.uid()));
