-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  duration_seconds INTEGER,
  cover_image_path TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on user_id
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own songs
CREATE POLICY "Users can view own songs"
  ON songs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own songs
CREATE POLICY "Users can insert own songs"
  ON songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own songs
CREATE POLICY "Users can update own songs"
  ON songs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own songs
CREATE POLICY "Users can delete own songs"
  ON songs FOR DELETE
  USING (auth.uid() = user_id);
