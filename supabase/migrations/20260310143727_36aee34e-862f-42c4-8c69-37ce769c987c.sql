
-- Melhorar tabela de resultados: asas, nível de saúde, centro dominante, tritype
ALTER TABLE public.enneagram_results
  ADD COLUMN IF NOT EXISTS wing text,
  ADD COLUMN IF NOT EXISTS health_level integer,
  ADD COLUMN IF NOT EXISTS dominant_center text,
  ADD COLUMN IF NOT EXISTS tritype text,
  ADD COLUMN IF NOT EXISTS integration_direction text,
  ADD COLUMN IF NOT EXISTS disintegration_direction text;

-- Criar tabela de feedback/avaliações
CREATE TABLE public.enneagram_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  result_id uuid REFERENCES public.enneagram_results(id) ON DELETE CASCADE NOT NULL,
  accuracy_rating integer NOT NULL CHECK (accuracy_rating BETWEEN 1 AND 5),
  agrees_with_type boolean,
  suggested_type text,
  comments text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, result_id)
);

-- RLS na tabela de feedback
ALTER TABLE public.enneagram_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.enneagram_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.enneagram_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.enneagram_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.enneagram_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
