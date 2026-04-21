-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  faculty TEXT DEFAULT '',
  course TEXT DEFAULT '',
  about TEXT DEFAULT '',
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  goals TEXT[] DEFAULT ARRAY[]::TEXT[],
  avatar_url TEXT DEFAULT '',
  nfc_code TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  is_pro BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts (smart feed)
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by everyone"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON public.posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Friendships
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id),
  CONSTRAINT unique_pair UNIQUE (requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can request friendship"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Addressee can update friendship"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Participants can delete friendship"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Profile visits
CREATE TABLE public.profile_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_visits_profile ON public.profile_visits(profile_id, visited_at DESC);

ALTER TABLE public.profile_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile owner sees visits"
  ON public.profile_visits FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Authenticated users record visits"
  ON public.profile_visits FOR INSERT
  WITH CHECK (auth.uid() = visitor_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();