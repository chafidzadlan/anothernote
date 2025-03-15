-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- This table is created automatically by Supabase

-- Profiles table (extends the users table with additional fields)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Notes table
CREATE TABLE notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security Policies

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can only read/update their own profile, admins can read/update all profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (is_admin());

-- Notes: Users can only CRUD their own notes, admins can CRUD all notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes and admins can view all notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create their own notes and admins can create notes for any user"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can update their own notes and admins can update any note"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete their own notes and admins can delete any note"
  ON notes FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- Function to create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for avatars
-- Run this in the SQL editor:
-- SELECT create_bucket('user-content', 'User uploaded content including avatars');

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-content');

CREATE POLICY "Users can upload their own avatars and admins can upload for anyone"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-content' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (auth.uid()::text = (storage.foldername(name))[2] OR is_admin())
  );

CREATE POLICY "Users can update their own avatars and admins can update for anyone"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-content' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (auth.uid()::text = (storage.foldername(name))[2] OR is_admin())
  );

CREATE POLICY "Users can delete their own avatars and admins can delete for anyone"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-content' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (auth.uid()::text = (storage.foldername(name))[2] OR is_admin())
  );

-- Admin function to get all profiles
CREATE OR REPLACE FUNCTION admin_get_all_profiles()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF is_admin() THEN
    RETURN QUERY SELECT * FROM profiles ORDER BY created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
END;
$$;

-- Admin Function to get all notes with user information
CREATE OR REPLACE FUNCTION admin_get_all_notes()
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF is_admin() THEN
    RETURN QUERY
      SELECT
        n.id,
        n.title,
        n.content,
        n.user_id,
        n.created_at,
        n.updated_at,
        p.name as user_name,
        p.email as user_email
      FROM notes n
      LEFT JOIN profiles p ON n.user_id = p.id
      ORDER BY n.created_at DESC;
  ELSE
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX notes_user_id_idx ON notes (user_id);
CREATE INDEX notes_created_at_idx ON notes (created_at DESC);