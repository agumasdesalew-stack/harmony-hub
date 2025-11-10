# Harmony Hub

A sleek, modern web application designed for music lovers who want to discover, curate, and share their perfect playlists with ease. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎵 **Music Discovery**: Search for songs, artists, or moods with instant results
- 🎨 **Beautiful UI**: Dark mode by default with glassmorphism effects
- 📱 **Responsive Design**: Works seamlessly on phones, tablets, and desktops
- 🎧 **Audio Previews**: 30-second previews on hover for song cards
- 📋 **Playlist Management**: Create, edit, and organize playlists with drag-and-drop
- 👤 **Authentication**: Sign in with Google or email via Supabase Auth
- ☁️ **Cloud Sync**: Playlists sync across devices for logged-in users
- 🔗 **Sharing**: Generate public links to share playlists
- 📤 **Spotify Export**: Export playlists directly to Spotify
- 🔌 **PWA Support**: Install as a Progressive Web App for offline access
- ⚡ **Fast & Modern**: Built with Next.js 16 and React 19

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account (for authentication and database)
- Spotify Developer account (for music search and previews)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd harmony-hub
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

4. Set up Supabase:
   - Create a new Supabase project
   - Create a `playlists` table with the following schema:
   ```sql
   CREATE TABLE playlists (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     description TEXT,
     songs JSONB DEFAULT '[]',
     user_id UUID REFERENCES auth.users(id),
     is_public BOOLEAN DEFAULT false,
     share_id TEXT UNIQUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
   - Enable Row Level Security (RLS) policies as needed

5. Set up Spotify API:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Copy your Client ID and Client Secret

6. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
harmony-hub/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   ├── song/         # Song detail pages
│   │   └── ...
│   ├── components/       # React components
│   │   ├── layout/       # Layout components
│   │   └── ...
│   ├── contexts/         # React contexts
│   ├── lib/             # Utility functions
│   └── types/           # TypeScript types
├── public/              # Static assets
└── ...
```

## Key Technologies

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend as a service (auth & database)
- **Spotify Web API**: Music search and previews
- **Lucide React**: Icon library
- **PWA**: Progressive Web App capabilities

## Features in Detail

### Search
- Glowing search bar with autocomplete
- Real-time search results from Spotify
- Beautiful song cards with album art

### Playlists
- Create playlists with custom names and descriptions
- Drag-and-drop reordering
- Add songs from search results
- Save locally (guests) or in cloud (logged-in users)

### Authentication
- Google OAuth sign-in
- Email/password authentication
- Secure session management

### Sharing
- Generate unique share links
- Public playlist viewing
- Copy playlists to your collection

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables
4. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
