-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  songs JSONB[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own playlists
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can view public playlists
CREATE POLICY "Public playlists are viewable by everyone"
  ON playlists FOR SELECT
  USING (is_public = true);

-- Policy: Users can insert their own playlists
CREATE POLICY "Users can insert own playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own playlists
CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own playlists
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  USING (auth.uid() = user_id);

