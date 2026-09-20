-- Disable RLS on tracking tables so the back-office can read them
ALTER TABLE public.hiking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiking_track_points DISABLE ROW LEVEL SECURITY;
