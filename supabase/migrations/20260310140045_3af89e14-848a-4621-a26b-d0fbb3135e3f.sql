
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create enneagram_results table
CREATE TABLE public.enneagram_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_1_name TEXT NOT NULL,
  type_1_pct INTEGER NOT NULL,
  type_2_name TEXT,
  type_2_pct INTEGER,
  type_3_name TEXT,
  type_3_pct INTEGER,
  dominant_subtype TEXT,
  subtype_social INTEGER,
  subtype_preservation INTEGER,
  subtype_sexual INTEGER,
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enneagram_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own results" ON public.enneagram_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own results" ON public.enneagram_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own results" ON public.enneagram_results FOR DELETE USING (auth.uid() = user_id);
